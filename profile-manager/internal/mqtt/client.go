package mqtt

import (
	"time"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var client mqtt.Client

func Init() error {
	cfg := config.GetConfig()
	opts := mqtt.NewClientOptions()
	opts.AddBroker(cfg.MQTTBrokerUrl)
	opts.SetClientID("container-discovery-service")
	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)
	opts.SetConnectRetryInterval(2 * time.Second)

	opts.SetConnectionLostHandler(func(client mqtt.Client, err error) {
		logger.Error.Printf("MQTT Connection lost: %v", err)
	})

	// Set up reconnect handler with logging
	opts.SetReconnectingHandler(func(client mqtt.Client, options *mqtt.ClientOptions) {
		logger.Info.Println("Attempting to reconnect to MQTT broker...")
	})

	opts.SetOnConnectHandler(func(client mqtt.Client) {
		logger.Info.Println("Connected to MQTT broker subscribing to topics...")
		if token := client.Subscribe(cfg.MQTTTopologySub, 0, HandleTopologyRequest); token.Wait() && token.Error() != nil {
			logger.Error.Printf("Subscription failed: %v", token.Error())
		}
	})

	client = mqtt.NewClient(opts)
	logger.Info.Println("Connecting to MQTT broker...")
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		logger.Error.Fatalf("Failed to connect to MQTT broker: %v", token.Error())
		return token.Error()
	}

	return nil
}

// Properly close the MQTT connection
func Close() {
	if client != nil && client.IsConnected() {
		client.Disconnect(250) // Wait 250 milliseconds for disconnect
	}
}
