package mqtt

import (
	"encoding/json"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	"bitswan.space/container-discovery-service/internal/portainer"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type Message struct {
	Count uint64 `json:"count"`
}

type TopologyEvent struct {
	Count uint64 `json:"count"`
	RemainingSubscriptionCount uint64 `json:"remaining_subscription_count"`
	Data portainer.Topology `json:"data"`
}

func HandleTopologyRequest(client mqtt.Client, message mqtt.Message) {
	var msg Message
	cfg := config.GetConfig()

	logger.Info.Printf("Received message: " + string(message.Payload()))
	if !json.Valid([]byte(message.Payload())) {
		logger.Error.Println("Invalid JSON")
	} else {
		json.Unmarshal([]byte(message.Payload()), &msg)
		go func(){
			topology, err := portainer.GetTopology()
			if err != nil {
				logger.Error.Println(err)
				return
			}
			topologyEvent := TopologyEvent{
				Count: 1,
				RemainingSubscriptionCount: msg.Count-1,
				Data: topology,
			}
			b, err := json.MarshalIndent(topologyEvent, "", "  ")
			if err != nil {
				logger.Error.Println(err)
				return
			}
			client.Publish(cfg.MQTTTopologyPub, 0, false, string(b))
		}()
	}

}
