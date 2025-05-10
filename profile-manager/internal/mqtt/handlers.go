package mqtt

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"bitswan.space/profile-manager/internal/logger"
	"bitswan.space/profile-manager/internal/profilemanager"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

var (
	profileManager = profilemanager.GetInstance()
)

func HandleTopologyRequest(client mqtt.Client, message mqtt.Message) {
	if !json.Valid([]byte(message.Payload())) {
		logger.Error.Println("Invalid JSON")
		return
	}

	// Identify the topic from the message
	topic := message.Topic()

	// Parse topic string using regex
	pattern := regexp.MustCompile(`^/orgs/([^/]+)/automation-servers/([^/]+)/c/([^/]+)/topology$`)
	matches := pattern.FindStringSubmatch(topic)

	if len(matches) != 4 {
		logger.Error.Printf("Invalid topic format: %s", topic)
		return
	}

	orgID := matches[1]
	automationServerID := matches[2]
	workspaceID := matches[3]

	// Get active profiles for the organization
	profiles := profileManager.GetActiveProfiles(orgID)
	if len(profiles) == 0 {
		logger.Info.Printf("No active profiles found for organization %s", orgID)
		return
	}

	// Forward message to all active profiles
	for _, profile := range profiles {
		targetTopic := fmt.Sprintf("/orgs/%s/profiles/%s/automation-servers/%s/c/%s/topology",
			orgID, profile, automationServerID, workspaceID)
		client.Publish(targetTopic, 0, true, message.Payload())
	}
}

func HandleProfilesMessage(client mqtt.Client, message mqtt.Message) {
	// Parse topic to get org_id
	topic := message.Topic()
	pattern := regexp.MustCompile(`^/orgs/([^/]+)/profiles$`)
	matches := pattern.FindStringSubmatch(topic)

	if len(matches) != 2 {
		logger.Error.Printf("Invalid profiles topic format: %s", topic)
		return
	}

	orgID := matches[1]
	var profiles []string
	if err := json.Unmarshal([]byte(message.Payload()), &profiles); err != nil {
		logger.Error.Printf("Failed to unmarshal profiles message: %v", err)
		return
	}

	profileManager.UpdateProfiles(orgID, profiles)
	logger.Info.Printf("Successfully updated profiles for organization %s", orgID)
}

func HandleAutomationProfileRequest(client mqtt.Client, message mqtt.Message) {
	topic := message.Topic()
	// requests topic from AOC must end with /subscribe
	if !strings.HasSuffix(topic, "/subscribe") {
		return
	}

	pattern := regexp.MustCompile(`^/orgs/([^/]+)/profiles/([^/]+)/automation-servers/([^/]+)/c/([^/]+)/c/([^/]+)/(.+)$`)
	matches := pattern.FindStringSubmatch(topic)

	if len(matches) != 7 {
		logger.Error.Printf("Invalid automations profiles topic format: %s", topic)
		return
	}

	orgID := matches[1]
	automationServerID := matches[3]
	workspaceID := matches[4]
	automationID := matches[5]
	restTopicName := matches[6]

	publishTopic := fmt.Sprintf("/orgs/%s/automation-servers/%s/c/%s/c/%s/%s",
		orgID, automationServerID, workspaceID, automationID, restTopicName)

	client.Publish(publishTopic, 0, true, message.Payload())
}

func HandleAutomationMessage(client mqtt.Client, message mqtt.Message) {
	topic := message.Topic()

	// skip subscribe requests
	if strings.HasSuffix(topic, "/subscribe") {
		return
	}

	pattern := regexp.MustCompile(`^/orgs/([^/]+)/automation-servers/([^/]+)/c/([^/]+)/c/([^/]+)/(.+)$`)
	matches := pattern.FindStringSubmatch(topic)

	if len(matches) != 6 {
		logger.Error.Printf("Invalid automations message topic format: %s", topic)
		return
	}

	orgID := matches[1]
	automationServerID := matches[2]
	workspaceID := matches[3]
	automationID := matches[4]
	restTopicName := matches[5]

	profiles := profileManager.GetActiveProfiles(orgID)
	if len(profiles) == 0 {
		logger.Info.Printf("No active profiles found for organization %s", orgID)
		return
	}

	for _, profile := range profiles {
		publishTopic := fmt.Sprintf("/orgs/%s/profiles/%s/automation-servers/%s/c/%s/c/%s/%s",
			orgID, profile, automationServerID, workspaceID, automationID, restTopicName)
		client.Publish(publishTopic, 0, true, message.Payload())
	}	
}
