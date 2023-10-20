package mqtt

import (
	"bitswan.space/container-discovery-service/internal/logger"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

func HandleTopologyRequest(client mqtt.Client, message mqtt.Message) {
	logger.Info.Printf("Received topology request..."  + string(message.Payload()))
	// ... your logic here
}

func HandleTriggerRequest(client mqtt.Client, message mqtt.Message) {
	logger.Info.Printf("Received trigger request..." + string(message.Payload()))
	// ... your logic here
}