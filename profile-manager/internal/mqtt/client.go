package mqtt

import (
	"fmt"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)


var client mqtt.Client

func NewClient(cfg *config.Configuration) {
	opts := mqtt.NewClientOptions()
	logger.Info.Printf("mqtt://" + cfg.MQTTBrokerHost + ":" + fmt.Sprint(cfg.MQTTBrokerPort))
	opts.AddBroker("mqtt://" + cfg.MQTTBrokerHost + ":" + fmt.Sprint(cfg.MQTTBrokerPort))
	opts.SetClientID("container-discovery-service")

	client = mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		logger.Error.Fatalf("Failed to connect to MQTT broker: %v", token.Error())
		panic(token.Error())
	}

	if client.IsConnected() {
		logger.Info.Println("Connected to MQTT broker")
	} else {
		logger.Error.Println("Failed to connect to MQTT broker")
	}
}

func GetClient() mqtt.Client {
	if client.IsConnected() {
		logger.Info.Println("MQTT client is connected")
		return client
	} else {
		logger.Error.Println("MQTT client is not connected")
		return nil
	}
}

func Disconnect(){
	client.Disconnect(250)
}