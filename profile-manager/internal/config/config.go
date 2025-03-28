package config

import (
	"os"

	"bitswan.space/profile-manager/internal/logger"
	"gopkg.in/yaml.v2"
)

type Configuration struct {
	MQTTBrokerUrl        string   `yaml:"mqtt-broker-url"`
	MQTTBrokerSecret     string   `yaml:"mqtt-broker-secret"`
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
