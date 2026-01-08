package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

var log = logrus.New()
var webhookSecret string

// WebhookPayload represents the expected webhook payload
type WebhookPayload struct {
	Timestamp int64 `json:"timestamp"`
}

func init() {
	// Load environment variables from .env file if it exists
	godotenv.Load()

	// Configure logging
	log.SetFormatter(&logrus.JSONFormatter{})
	log.SetOutput(os.Stdout)

	// Set log level based on environment
	if os.Getenv("LOG_MODE") == "release" {
		log.SetLevel(logrus.InfoLevel)
	} else {
		log.SetLevel(logrus.DebugLevel)
	}

	// Validate webhook secret at startup
	webhookSecret = os.Getenv("UPDATE_WEBHOOK_SECRET")
	if webhookSecret == "" {
		log.Fatal("UPDATE_WEBHOOK_SECRET not configured - application cannot start")
	}
	log.Info("Webhook secret configured successfully")
}

func main() {
	// Create HTTP server
	mux := http.NewServeMux()

	// Add routes
	mux.HandleFunc("POST /update", updateWebhookHandler)

	// Add logging middleware
	handler := loggingMiddleware(mux)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Infof("Starting update webhook server on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Create a response writer wrapper to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		// Log the request
		log.WithFields(logrus.Fields{
			"status":     wrapped.statusCode,
			"latency":    time.Since(start),
			"client_ip":  r.RemoteAddr,
			"method":     r.Method,
			"path":       r.URL.Path,
			"user_agent": r.UserAgent(),
		}).Info("HTTP Request")
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func updateWebhookHandler(w http.ResponseWriter, r *http.Request) {
	// Set content type
	w.Header().Set("Content-Type", "application/json")

	// Validate webhook signature
	signature := r.Header.Get("X-Hub-Signature-256")
	if signature == "" {
		log.Warn("Update webhook called without signature")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Missing signature",
		})
		return
	}

	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Errorf("Failed to read request body: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to read request body",
		})
		return
	}

	// Validate signature
	expectedSignature := "sha256=" + generateHMAC(body, webhookSecret)
	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		log.Warn("Invalid update webhook signature")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid signature",
		})
		return
	}

	// Parse JSON payload
	var payload WebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Errorf("Failed to parse JSON payload: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Invalid JSON payload",
		})
		return
	}

	// Validate timestamp (within 5 minutes)
	currentTime := time.Now().Unix()
	timeDiff := currentTime - payload.Timestamp
	if timeDiff < -300 || timeDiff > 300 { // 5 minutes = 300 seconds
		log.Warnf("Webhook timestamp validation failed: current=%d, received=%d, diff=%d",
			currentTime, payload.Timestamp, timeDiff)
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Timestamp validation failed",
		})
		return
	}

	// Trigger the AOC update
	log.Info("Triggering AOC update via webhook")

	// Get virtual environment path from environment variable
	venvPath := os.Getenv("AOC_VENV_PATH")
	if venvPath == "" {
		log.Error("AOC_VENV_PATH environment variable not set")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "AOC_VENV_PATH environment variable not configured",
		})
		return
	}

	// Construct command to activate venv and run update
	// Source the activation script and then run the bitswan command
	updateCommand := "source " + venvPath + "/bin/activate && bitswan on-prem-aoc update"
	
	// Run the update command using nsenter to execute in host context
	cmd := exec.Command("nsenter", "-t", "1", "-m", "-u", "-n", "-i", "sh", "-c", updateCommand)
	output, err := cmd.CombinedOutput()

	if err != nil {
		log.Errorf("AOC update failed: %v, output: %s", err, string(output))
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error":  "AOC update failed",
			"stderr": string(output),
		})
		return
	}

	log.Info("AOC update completed successfully")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "AOC update triggered successfully",
		"output":  string(output),
	})
}

func generateHMAC(data []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}
