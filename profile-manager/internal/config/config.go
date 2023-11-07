package config

import (
	"os"

	"bitswan.space/container-discovery-service/internal/logger"
	"gopkg.in/yaml.v2"
)

type Configuration struct {
	PortainerURL    string `yaml:"portainer-url"`
	MQTTBrokerUrl  string `yaml:"mqtt-broker-url"`
	MQTTTopologyPub string `yaml:"mqtt-topology-topic-pub"`
	MQTTTopologySub string `yaml:"mqtt-topology-topic-sub"`
}

var cfg *Configuration

func LoadConfig(filename string) error {
	buf, err := os.ReadFile(filename)
	if err != nil {
		return err
	}

	if err := yaml.Unmarshal(buf, &cfg); err != nil {
		return err
	}
	logger.Info.Printf("Successfuly loaded configuration")
	return nil
}

func GetConfig() *Configuration {
	return cfg
}
