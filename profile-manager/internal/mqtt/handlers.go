package mqtt

import (
	"encoding/json"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	"bitswan.space/container-discovery-service/internal/portainer"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type Message struct {
	Method string `json:"method"`
}

func HandleTopologyRequest(client mqtt.Client, message mqtt.Message) {
	var msg Message;
	cfg := config.GetConfig()
	
	logger.Info.Printf("Received message: " + string(message.Payload()))
	if !json.Valid([]byte(message.Payload())) {
		logger.Error.Println("Invalid JSON")
	} else {
		json.Unmarshal([]byte(message.Payload()), &msg)
		logger.Info.Printf("Method: " + msg.Method)
		if msg.Method == "get" {
			topology, err := portainer.GetTopology()
			if err != nil {
				logger.Error.Println(err)
			}
			b, err := json.MarshalIndent(topology, "", "  ")
			if err != nil {
				logger.Error.Println(err)
			}
			client.Publish(cfg.MQTTTopologyPub, 0, false, string(b))
		}
	}
	
}