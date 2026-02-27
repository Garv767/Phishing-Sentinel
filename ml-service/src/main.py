from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import joblib
import pandas as pd
import tempfile
import os
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

# Load the NEW v2 model on startup
print("Loading Phishing Sentinel V2 model...")
# Make sure the filename matches what you downloaded from Drive!
model = joblib.load('../models/phishing_sentinel_model_v2.pkl')
print("Model loaded successfully!")

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
    
    result = "Phishing" if prediction == 1 else "Legitimate"
    
    return {
        "verdict": result,
        "phishing_probability": round(probability * 100, 2),
        "analyzed_features": combined_features
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=10000, reload=True)