from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import joblib
import pandas as pd
import tempfile
import os
import time
from datetime import datetime
from preprocess import extract_url_features, extract_dom_features

app = FastAPI(title="Phishing Sentinel API V2")

# Allow your browser extension to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODEL LOADING LOGIC (Fixed for Render) ---
# This ensures the model is found regardless of where the script is called from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Moves up one level from 'src' then into 'models'
MODEL_PATH = os.path.join(BASE_DIR, '..', 'models', 'phishing_sentinel_model_v2.pkl')

print(f"Loading Phishing Sentinel V2 model from: {MODEL_PATH}")

try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully!")
except FileNotFoundError:
    print(f"ERROR: Model file not found at {MODEL_PATH}")
    # Fallback for different directory structures during local testing
    model = None 
# ----------------------------------------------

class AnalyzePayload(BaseModel):
    url: str
    html: str

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "unix_time": time.time()
    }

@app.post("/analyze")
async def analyze_page(payload: AnalyzePayload):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded on server")
        
    if not payload.url or not payload.html:
        raise HTTPException(status_code=400, detail="Missing URL or HTML content")
        
    url = payload.url
    html_content = payload.html
    
    # 1. Extract the upgraded URL features
    url_feats = extract_url_features(url)
    
    # 2. Extract the upgraded DOM features
    with tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8') as temp_file:
        temp_file.write(html_content)
        temp_path = temp_file.name
        
    dom_feats = extract_dom_features(temp_path, url)
    os.remove(temp_path) 
    
    # 3. Combine and format matching the exact v2 training sequence
    combined_features = {**url_feats, **dom_feats}
    
    feature_order = [
        'url_length', 'has_ip', 'has_at_symbol', 'num_hyphens', 'num_subdomains',
        'url_entropy', 'num_digits', 'num_parameters', 'has_sensitive_words',
        'has_password_field', 'has_hidden_iframe', 'suspicious_form_action', 
        'script_to_content_ratio', 'external_link_ratio', 'empty_links_ratio', 'num_input_fields'
    ]
    
    df_features = pd.DataFrame([combined_features], columns=feature_order)
    
    # 4. Predict
    prediction = model.predict(df_features)[0]
    probability = model.predict_proba(df_features)[0][1] 
    
    # Custom threshold: Only mark as Phishing if probability > 0.70
    threshold = 0.70
    result = "Phishing" if probability >= threshold else "Legitimate"
        
    return {
        "verdict": result,
        "phishing_probability": round(probability * 100, 2),
        "analyzed_features": combined_features
    }

if __name__ == "__main__":
    # Use Render's PORT environment variable
    port = int(os.environ.get("PORT", 10000))
    # 'main' refers to this filename (main.py)
    uvicorn.run(app, host="0.0.0.0", port=port)
