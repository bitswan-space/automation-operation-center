package config

import (
	"os"

	"gopkg.in/yaml.v2"
)

type Configuration struct {
    PortainerURL	string    `yaml:"portainer-url"`
    MQTTBrokerHost	string `yaml:"mqtt-broker-host"`
	MQTTBrokerPort	int    `yaml:"mqtt-broker-port"`
}

func LoadConfig(filename string) (*Configuration, error) {
    buf, err := os.ReadFile(filename)
    if err != nil {
        return nil, err
    }

    var cfg Configuration
    if err := yaml.Unmarshal(buf, &cfg); err != nil {
        return nil, err
    }
    
    return &cfg, nil
}