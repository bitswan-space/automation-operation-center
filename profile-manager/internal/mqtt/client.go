package mqtt

import (
	"fmt"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)


var client mqtt.Client

func Init() {
	cfg := config.GetConfig()
	opts := mqtt.NewClientOptions()
	opts.AddBroker("mqtt://" + cfg.MQTTBrokerHost + ":" + fmt.Sprint(cfg.MQTTBrokerPort))
	opts.SetClientID("container-discovery-service")

	client = mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		logger.Error.Fatalf("Failed to connect to MQTT broker: %v", token.Error())
		panic(token.Error())
	}
	logger.Info.Println("Connected to MQTT broker")

	logger.Info.Println("Subscribing to " + cfg.MQTTTopologySub)
	client.Subscribe(cfg.MQTTTopologySub, 0, HandleTopologyRequest)
}