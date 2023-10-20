package main

import (
	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
)

func main() {
    logger.Init()

    cfg, err := config.LoadConfig("../config/config.yaml")
    if err != nil {
        logger.Error.Fatalf("Failed to load configuration: %v", err)
    }

    logger.Info.Printf("Loaded configuration: %+v", cfg)
}