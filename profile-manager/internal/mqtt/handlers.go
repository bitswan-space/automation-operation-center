package mqtt

import (
	"encoding/json"
	"os"

	"bitswan.space/container-discovery-service/internal/logger"
	"bitswan.space/container-discovery-service/internal/portainer"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/xeipuuv/gojsonschema"
)

type Message struct {
	Method string `json:"method"`
	Body  json.RawMessage `json:"body"`
}

func HandleContainersRequest(client mqtt.Client, message mqtt.Message) {
	var msg Message

	logger.Info.Printf("Received message: " + string(message.Payload()))
	if !json.Valid([]byte(message.Payload())) {
		logger.Error.Println("Invalid JSON")
	} else {
		json.Unmarshal([]byte(message.Payload()), &msg)
		logger.Info.Printf("Method: " + msg.Method)
		if msg.Method == "get" {
			go func(){
				topology, err := portainer.GetTopology()
				if err != nil {
					logger.Error.Println(err)
					return
				}
				b, err := json.MarshalIndent(topology, "", "  ")
				if err != nil {
					logger.Error.Println(err)
					return
				}
	
				client.Publish(cfg.MQTTContainersPub, 0, false, string(b))
			}()
		}
	}

}

func HandleNavigationSetRequest(client mqtt.Client, message mqtt.Message){
	var msg json.RawMessage

	documentLoader := gojsonschema.NewStringLoader(string(message.Payload()))
	
	result, err := gojsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		logger.Error.Println(err)
		return
	}

	if !result.Valid() {
		logger.Error.Println("Invalid JSON schema. Errors:")
		for _, desc := range result.Errors() {
            logger.Error.Printf("- %s\n", desc)
        }
	} else {
		json.Unmarshal([]byte(message.Payload()), &msg)
		err := os.WriteFile(cfg.NavigationFile, msg, 0644)
		if err != nil {
			logger.Error.Println(err)
			return
		}

		// Send retained message with new navigation structure
		client.Publish(cfg.MQTTNavigationPub, 0, true, string(msg))
	}
}
