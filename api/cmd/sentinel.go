package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Thread-safe session blacklist
var (
	sessionBlacklist = make(map[string]bool)
	blacklistMu      sync.RWMutex
)

func blacklistAdd(sessionID string) {
	blacklistMu.Lock()
	defer blacklistMu.Unlock()
	sessionBlacklist[sessionID] = true
	log.Printf("[Sentinel] Session %s added to blacklist", sessionID)
}

func blacklistHas(sessionID string) bool {
	blacklistMu.RLock()
	defer blacklistMu.RUnlock()
	return sessionBlacklist[sessionID]
}

// SentinelGuard middleware intercepts protected requests and evaluates behavioral telemetry
func SentinelGuard() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Get session ID (token) from Authorization header
		authHeader := c.GetHeader("Authorization")
		var sessionID string
		if strings.HasPrefix(authHeader, "Bearer ") {
			sessionID = strings.TrimPrefix(authHeader, "Bearer ")
		}

		// 2. Check blacklist
		if sessionID != "" && blacklistHas(sessionID) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success":         false,
				"sentinelVerdict": "TERMINATE_SESSION",
				"error":           "Session terminated by security policy",
			})
			return
		}

		// 3. Read telemetry header
		telemetryBase64 := c.GetHeader("X-Sentinel-Telemetry")
		if telemetryBase64 == "" {
			log.Println("[Sentinel] Telemetry header X-Sentinel-Telemetry is missing. Failing open.")
			c.Next()
			return
		}

		// 5. Decode telemetry
		telemetryJSON, err := base64.StdEncoding.DecodeString(telemetryBase64)
		if err != nil {
			log.Printf("[Sentinel] Failed to decode telemetry: %v", err)
			c.Next()
			return
		}

		// 6. Unmarshal telemetry to inject metadata
		var telemetry map[string]interface{}
		if err := json.Unmarshal(telemetryJSON, &telemetry); err != nil {
			log.Printf("[Sentinel] Failed to parse telemetry JSON: %v", err)
			c.Next()
			return
		}

		// Add server-side network details
		network, ok := telemetry["network"].(map[string]interface{})
		if !ok {
			network = make(map[string]interface{})
		}
		network["ip_address"] = c.ClientIP()
		network["user_agent"] = c.GetHeader("User-Agent")
		telemetry["network"] = network

		// Inject active user id and session id from backend context
		if userID, exists := c.Get("userID"); exists {
			telemetry["user_id"] = fmt.Sprintf("%v", userID)
		}
		if sessionID != "" {
			telemetry["session_id"] = sessionID
		}

		// 7. Call Sentinel API
		sentinelURL := os.Getenv("SENTINEL_API_URL")
		if sentinelURL == "" {
			sentinelURL = "https://api.sentinellayer.in/evaluate"
		} else {
			if !strings.HasPrefix(sentinelURL, "http://") && !strings.HasPrefix(sentinelURL, "https://") {
				sentinelURL = "https://" + sentinelURL
			}
			if !strings.HasSuffix(sentinelURL, "/evaluate") {
				sentinelURL = sentinelURL + "/evaluate"
			}
		}
		secretKey := os.Getenv("SENTINEL_SECRET_KEY")
		if secretKey == "" {
			secretKey = os.Getenv("SENTINEL_API_KEY")
		}

		payloadBytes, err := json.Marshal(telemetry)
		if err != nil {
			log.Printf("[Sentinel] Failed to marshal telemetry payload: %v", err)
			c.Next()
			return
		}

		req, err := http.NewRequest("POST", sentinelURL, bytes.NewBuffer(payloadBytes))
		if err != nil {
			log.Printf("[Sentinel] Failed to create HTTP request: %v", err)
			c.Next()
			return
		}
		req.Header.Set("Content-Type", "application/json")
		if secretKey != "" {
			req.Header.Set("X-Sentinel-Key", secretKey)
		}

		log.Printf("[Sentinel] Initiating evaluation call to %s (User: %v, Session: %s)", sentinelURL, telemetry["user_id"], sessionID)
		startTime := time.Now()

		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[Sentinel] Evaluation service connection error: %v (Took %v)", err, time.Since(startTime))
			c.Next()
			return
		}
		defer resp.Body.Close()

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Printf("[Sentinel] Failed to read response body: %v (Took %v)", err, time.Since(startTime))
			c.Next()
			return
		}

		if resp.StatusCode != http.StatusOK {
			log.Printf("[Sentinel] Evaluation service returned status %d. Response body: %s (Took %v)", resp.StatusCode, string(bodyBytes), time.Since(startTime))
			c.Next()
			return
		}

		var evaluationResp struct {
			RecommendedAction string `json:"recommended_action"`
		}
		if err := json.Unmarshal(bodyBytes, &evaluationResp); err != nil {
			log.Printf("[Sentinel] Failed to parse evaluation response JSON: %v (Took %v)", err, time.Since(startTime))
			c.Next()
			return
		}

		verdict := evaluationResp.RecommendedAction
		log.Printf("[Sentinel] Session evaluated successfully: verdict = %s (Took %v)", verdict, time.Since(startTime))

		// 8. Enforce verdict
		if os.Getenv("SENTINEL_SHADOW_MODE") == "true" {
			log.Printf("[Sentinel] [SHADOW MODE] Verdict '%s' evaluated but not enforced. Allowing request.", verdict)
			c.Next()
			return
		}

		if verdict == "TERMINATE_SESSION" || verdict == "ALERT" {
			if sessionID != "" {
				blacklistAdd(sessionID)
			}
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success":         false,
				"sentinelVerdict": "TERMINATE_SESSION",
				"error":           "Session terminated by security policy",
			})
			return
		}
		if verdict == "BLOCK" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success":         false,
				"sentinelVerdict": "BLOCK",
				"error":           "Action blocked by security policy",
			})
			return
		}
		if verdict == "STEP_UP_AUTH" || verdict == "REQUIRE_MFA" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success":         false,
				"sentinelVerdict": "STEP_UP_AUTH",
				"error":           "Step-up authentication required",
			})
			return
		}

		c.Next()
	}
}

// HandleSentinelWebhook receives asynchronous security webhooks from Sentinel and manages active session states
func HandleSentinelWebhook(c *gin.Context) {
	signatureHeader := c.GetHeader("X-Sentinel-Signature")
	if signatureHeader == "" {
		c.String(http.StatusUnauthorized, "Signature missing")
		c.Abort()
		return
	}

	secret := os.Getenv("SENTINEL_WEBHOOK_SECRET")
	
	// Read raw body bytes for HMAC computation
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		c.Abort()
		return
	}

	// Restore request body for potential subsequent reads
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// Recreate signature
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(bodyBytes)
	expectedSignature := "sha256=" + hex.EncodeToString(mac.Sum(nil))

	if signatureHeader != expectedSignature {
		c.String(http.StatusForbidden, "Signature verification failed")
		c.Abort()
		return
	}

	// Parse webhook payload
	var payload struct {
		Event             string `json:"event"`
		UserID            string `json:"user_id"`
		SessionID         string `json:"session_id"`
		RiskLevel         string `json:"risk_level"`
		RecommendedAction string `json:"recommended_action"`
	}

	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		c.String(http.StatusBadRequest, "Invalid payload")
		c.Abort()
		return
	}

	log.Printf("[Sentinel Webhook] Received risk update: action = %s, risk = %s", payload.RecommendedAction, payload.RiskLevel)

	if payload.RecommendedAction == "TERMINATE_SESSION" || payload.RiskLevel == "CRITICAL" {
		if payload.SessionID != "" {
			blacklistAdd(payload.SessionID)
		}
	}

	c.String(http.StatusOK, "Webhook processed")
}
