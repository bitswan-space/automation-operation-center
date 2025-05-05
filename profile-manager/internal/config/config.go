package config

import (
	"fmt"
	"os"
)

type Configuration struct {
	MQTTBrokerUrl    string `yaml:"mqtt-broker-url"`
	MQTTBrokerSecret string `yaml:"mqtt-broker-secret"`
}

var cfg *Configuration

func LoadConfig(filename string) error {

	brokerUrl := os.Getenv("MQTT_BROKER_URL")
	brokerSecret := os.Getenv("MQTT_BROKER_SECRET")

	if brokerUrl == "" || brokerSecret == "" {
		return fmt.Errorf("MQTT_BROKER_URL and MQTT_BROKER_SECRET must be set")
	}

	cfg.MQTTBrokerUrl = brokerUrl
	cfg.MQTTBrokerSecret = brokerSecret

	return nil
}

func GetConfig() *Configuration {
	return cfg
}
