package mqtt

import (
	"fmt"
	"math/rand"
	"time"

	"bitswan.space/profile-manager/internal/config"
	"bitswan.space/profile-manager/internal/logger"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/golang-jwt/jwt/v5"
	"github.com/xeipuuv/gojsonschema"
)

var client mqtt.Client
var schemaLoader gojsonschema.JSONLoader
var cfg *config.Configuration

func GenerateJWTToken(secret string) string {
	// Create the token claims with expiration to 20 years
	claims := jwt.MapClaims{
		"exp":      time.Now().Add(20 * 365 * 24 * time.Hour).Unix(),
		"username": "profile-manager",
		"client_attrs": map[string]string{
			"mountpoint": "",
		},
	}

	// Create the token with HS256 algorithm
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign and get the complete encoded token as a string
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		logger.Error.Printf("Error generating JWT token: %v", err)
		return ""
	}

	return tokenString
}

func Init() error {
	cfg = config.GetConfig()
	opts := mqtt.NewClientOptions()
	opts.AddBroker(cfg.MQTTBrokerUrl)
	clientID := fmt.Sprintf("profile-manager-%d", rand.Intn(10000))
	opts.SetClientID(clientID)
	opts.SetAutoReconnect(true)
	opts.SetConnectRetry(true)
	opts.SetConnectRetryInterval(2 * time.Second)
	opts.SetUsername("profile-manager")
	opts.SetPassword(GenerateJWTToken(cfg.MQTTBrokerSecret))
	opts.SetConnectionLostHandler(func(client mqtt.Client, err error) {
		logger.Error.Printf("MQTT Connection lost: %v", err)
	})

	// Set up reconnect handler with logging
	opts.SetReconnectingHandler(func(client mqtt.Client, options *mqtt.ClientOptions) {
		logger.Info.Println("Attempting to reconnect to MQTT broker...")
	})

	opts.SetOnConnectHandler(func(client mqtt.Client) {
		logger.Info.Println("Connected to MQTT broker subscribing to topics...")

		// Organizations profiles
		// /orgs/{org id}/profiles
		profilesTopic := "/orgs/+/profiles"
		if token := client.Subscribe(profilesTopic, 0, HandleProfilesMessage); token.Wait() && token.Error() != nil {
			logger.Error.Printf("Subscription failed: %v", token.Error())
		}

		// List of automations for each workspace
		// /orgs/{org id}/automation-servers/{automation server id}/c/{workspace id}/topology
		topologyTopic := "/orgs/+/automation-servers/+/c/+/topology"
		if token := client.Subscribe(topologyTopic, 0, HandleTopologyRequest); token.Wait() && token.Error() != nil {
			logger.Error.Printf("Subscription failed: %v", token.Error())
		}

		// Requests from AOC to the automations
		// /orgs/{org id}/profiles/{profile id}/automation-servers/{automation server id}/c/{workspace id}/c/{automation id}/+
		automationsProfilesTopic := "/orgs/+/profiles/+/automation-servers/+/c/+/c/#"
		if token := client.Subscribe(automationsProfilesTopic, 0, HandleAutomationProfileRequest); token.Wait() && token.Error() != nil {
			logger.Error.Printf("Subscription failed: %v", token.Error())
		}

		// Data from the automations
		// /orgs/{org id}/automation-servers/{automation server id}/c/{workspace id}/c/{automation id}/+
		automationsTopic := "/orgs/+/automation-servers/+/c/+/c/#"
		if token := client.Subscribe(automationsTopic, 0, HandleAutomationMessage); token.Wait() && token.Error() != nil {
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
