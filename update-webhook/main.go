package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"os/exec"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

var log = logrus.New()
var webhookSecret string

func init() {
	// Load environment variables from .env file if it exists
	godotenv.Load()

	// Configure logging
	log.SetFormatter(&logrus.JSONFormatter{})
	log.SetOutput(os.Stdout)

	// Set log level based on environment
	if os.Getenv("GIN_MODE") == "release" {
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
	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Add logging middleware
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		log.WithFields(logrus.Fields{
			"status":     param.StatusCode,
			"latency":    param.Latency,
			"client_ip":  param.ClientIP,
			"method":     param.Method,
			"path":       param.Path,
			"user_agent": param.Request.UserAgent(),
		}).Info("HTTP Request")
		return ""
	}))

	// Update webhook endpoint
	r.POST("/update", updateWebhookHandler)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Infof("Starting update webhook server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func updateWebhookHandler(c *gin.Context) {
	// Validate webhook signature
	signature := c.GetHeader("X-Hub-Signature-256")
	if signature == "" {
		log.Warn("Update webhook called without signature")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Missing signature",
		})
		return
	}

	// Read request body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Errorf("Failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read request body",
		})
		return
	}

	// Validate signature
	expectedSignature := "sha256=" + generateHMAC(body, webhookSecret)
	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		log.Warn("Invalid update webhook signature")
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid signature",
		})
		return
	}

	// Trigger the AOC update
	log.Info("Triggering AOC update via webhook")

	// Run the update command
	cmd := exec.Command("bitswan", "on-prem-aoc", "update")
	output, err := cmd.CombinedOutput()

	if err != nil {
		log.Errorf("AOC update failed: %v, output: %s", err, string(output))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "AOC update failed",
			"stderr": string(output),
		})
		return
	}

	log.Info("AOC update completed successfully")
	c.JSON(http.StatusOK, gin.H{
		"message": "AOC update triggered successfully",
		"output":  string(output),
	})
}

func generateHMAC(data []byte, secret string) string {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}
