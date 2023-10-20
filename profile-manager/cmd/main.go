package main

import (
	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	"bitswan.space/container-discovery-service/internal/mqtt"
)

func main() {
    logger.Init()

    cfg, err := config.LoadConfig("../config/config.yaml")
    if err != nil {
        logger.Error.Fatalf("Failed to load configuration: %v", err)
    }

    logger.Info.Printf("Loaded configuration: %+v", cfg)

	mqtt.NewClient(cfg)

	client:=mqtt.GetClient()

	if (client!=nil){
		client.Subscribe("c/topology/get", 0, mqtt.HandleTopologyRequest)
		client.Subscribe("c/trigger/get", 0, mqtt.HandleTriggerRequest)
	} else {
		logger.Error.Println("MQTT client is nil")
	}

	select {}
}