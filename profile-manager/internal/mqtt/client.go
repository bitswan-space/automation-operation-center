package mqtt

import (
	"os"
	"time"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/xeipuuv/gojsonschema"
)

var client mqtt.Client
var schemaLoader gojsonschema.JSONLoader
var cfg *config.Configuration

func Init() error {
	cfg = config.GetConfig()
	opts := mqtt.NewClientOptions()
	logger.Info.Printf("Schema file: %s", cfg.NavigationSchemaFile)
	schemaLoader = gojsonschema.NewReferenceLoader("file://" + cfg.NavigationSchemaFile)
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
		if token := client.Subscribe(cfg.MQTTContainersSub, 0, HandleContainersRequest); token.Wait() && token.Error() != nil {
			logger.Error.Printf("Subscription failed: %v", token.Error())
		}
		if token := client.Subscribe(cfg.MQTTNavigationSet, 0, HandleNavigationSetRequest); token.Wait() && token.Error() != nil {
			logger.Error.Printf("Subscription failed: %v", token.Error())
		}

		logger.Info.Println("Sending retained message with current navigation structure...")
		jsonData, err := os.ReadFile(cfg.NavigationFile)
		if err != nil {
			logger.Error.Println(err)
			return
		}
		client.Publish(cfg.MQTTNavigationPub, 0, true, string(jsonData))
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
