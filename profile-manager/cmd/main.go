package main

import (
	"os"
	"os/signal"
	"syscall"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	"bitswan.space/container-discovery-service/internal/mqtt"
	"github.com/joho/godotenv"
)

func main() {
	logger.Init()
	godotenv.Load(".env")

	err := config.LoadConfig("../config/config.yaml")
	if err != nil {
		logger.Error.Fatalf("Failed to load configuration: %v", err)
		os.Exit(1)
	}

	err = mqtt.Init()
	if err != nil {
		logger.Error.Fatalf("Failed to initialize MQTT client: %v", err)
		os.Exit(1)
	}
	defer mqtt.Close()

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Block until a signal is received
	<-sigChan
	logger.Info.Println("Shutting down gracefully...")
	// Perform any necessary cleanup here

	logger.Info.Println("Shutdown complete")
}
