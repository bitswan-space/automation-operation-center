package main

import (
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
		panic(err)
    }
	mqtt.Init()

	select {}
}