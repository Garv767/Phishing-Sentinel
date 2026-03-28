// Data structures for the ML Service communication
package main

import (
    "bytes"
    "encoding/json"
    "io"
    "net/http"
)

// What the Chrome extension sends to Go
type AnalysisRequest struct {
    URL        string                 `json:"url" binding:"required"`
    DOMContent string                 `json:"dom_content"`
    Metadata   map[string]interface{} `json:"metadata"`
}

// What Go sends back to the Chrome extension (and saves to Supabase)
type AnalysisResponse struct {
    IsSpoof         bool     `json:"is_spoof"`
    ConfidenceScore float64  `json:"confidence_score"`
    ThreatLevel     string   `json:"threat_level"`
    Anomalies       []string `json:"detected_anomalies"`
}

// What the Python ML Service actually returns
type PythonMLResponse struct {
    Verdict             string                 `json:"verdict"`
    PhishingProbability float64                `json:"phishing_probability"`
    AnalyzedFeatures    map[string]interface{} `json:"analyzed_features"`
}

// Function to call your Python ML service
func forwardToMLService(data AnalysisRequest) (*AnalysisResponse, error) {
    // 1. Translate Go Request -> Python Expected JSON ("dom_content" -> "html")
    mlPayload := map[string]string{
        "url":  data.URL,
        "html": data.DOMContent,
    }

    jsonData, err := json.Marshal(mlPayload)
    if err != nil {
        return nil, err
    }

    // Assuming your Python FastAPI server runs on port 8000
    resp, err := http.Post("https://phishing-sentinel-ml-service.onrender.com/analyze", "application/json", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }

    // 2. Parse the exact Python response
    var pyResp PythonMLResponse
    if err := json.Unmarshal(body, &pyResp); err != nil {
        return nil, err
    }

    // 3. Translate Python Response -> Go Expected Struct for Database Logging
    //
    // Threat level is derived from the model's phishing probability score,
    // independent of the binary Verdict label:
    //   < 0.40  → "Low"    (likely legitimate, negligible risk)
    //   < 0.70  → "Medium" (suspicious, warrants caution)
    //   >= 0.70 → "High"   (high-confidence phishing, block triggered)
    threatLevel := func(p float64) string {
        switch {
        case p >= 0.70:
            return "High"
        case p >= 0.40:
            return "Medium"
        default:
            return "Low"
        }
    }(pyResp.PhishingProbability)

    result := AnalysisResponse{
        IsSpoof:         pyResp.Verdict == "Phishing",
        ConfidenceScore: pyResp.PhishingProbability,
        ThreatLevel:     threatLevel,
    }

    return &result, nil
}