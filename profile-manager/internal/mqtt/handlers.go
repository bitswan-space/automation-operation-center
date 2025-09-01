package mqtt

import (
	"encoding/json"
	"fmt"
	"regexp"
	"slices"
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

	// Get filtered filteredProfiles for the organization, automation server, and workspace
	filteredProfiles := profileManager.GetFilteredProfiles(orgID, automationServerID, workspaceID)
	if len(filteredProfiles) == 0 {
		logger.Info.Printf("No matching profiles found for organization %s, server %s, workspace %s", orgID, automationServerID, workspaceID)
		return
	}

	allProfiles := profileManager.GetActiveProfiles(orgID)

	// Forward message to all matching profiles
	for _, profile := range allProfiles {
		targetTopic := fmt.Sprintf("/orgs/%s/profiles/%s/automation-servers/%s/c/%s/topology",
			orgID, profile, automationServerID, workspaceID)

		// If the profile is not in the filtered profiles, publish an empty message
		if !slices.Contains(filteredProfiles, profile) {
			client.Publish(targetTopic, 0, true, []byte{})
			continue
		}

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
	profileID := matches[2]
	automationServerID := matches[3]
	workspaceID := matches[4]
	automationID := matches[5]
	restTopicName := matches[6]

	// Get filtered profiles for the organization, automation server, and workspace
	profiles := profileManager.GetFilteredProfiles(orgID, automationServerID, workspaceID)
	if len(profiles) == 0 {
		logger.Info.Printf("No matching profiles found for organization %s, server %s, workspace %s", orgID, automationServerID, workspaceID)
		return
	}

	// Check if the profile is in the list of filtered profiles
	if !slices.Contains(profiles, profileID) {
		logger.Info.Printf("Profile %s not found in the list of filtered profiles", profileID)
		return
	}

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

	// Get filtered filteredProfiles for the organization, automation server, and workspace
	filteredProfiles := profileManager.GetFilteredProfiles(orgID, automationServerID, workspaceID)
	if len(filteredProfiles) == 0 {
		logger.Info.Printf("No matching profiles found for organization %s, server %s, workspace %s", orgID, automationServerID, workspaceID)
		return
	}

	allProfiles := profileManager.GetActiveProfiles(orgID)

	for _, profile := range allProfiles {
		publishTopic := fmt.Sprintf("/orgs/%s/profiles/%s/automation-servers/%s/c/%s/c/%s/%s",
			orgID, profile, automationServerID, workspaceID, automationID, restTopicName)

		// If the profile is not in the filtered profiles, publish an empty message
		if !slices.Contains(filteredProfiles, profile) {
			client.Publish(publishTopic, 0, true, []byte{})
			continue
		}

		client.Publish(publishTopic, 0, true, message.Payload())
	}
}

// HandleAutomationServerGroupsMessage handles automation server groups updates
func HandleAutomationServerGroupsMessage(client mqtt.Client, message mqtt.Message) {
	topic := message.Topic()
	pattern := regexp.MustCompile(`^/orgs/([^/]+)/automation-servers/([^/]+)/groups$`)
	matches := pattern.FindStringSubmatch(topic)

	if len(matches) != 3 {
		logger.Error.Printf("Invalid automation server groups topic format: %s", topic)
		return
	}

	orgID := matches[1]
	automationServerID := matches[2]

	var groups []string
	if err := json.Unmarshal(message.Payload(), &groups); err != nil {
		logger.Error.Printf("Failed to unmarshal automation server groups message: %v", err)
		return
	}

	profileManager.UpdateAutomationServerGroups(orgID, automationServerID, groups)
	logger.Info.Printf("Successfully updated automation server groups for org %s, server %s", orgID, automationServerID)
}

// HandleWorkspaceGroupsMessage handles workspace groups updates
func HandleWorkspaceGroupsMessage(client mqtt.Client, message mqtt.Message) {
	topic := message.Topic()
	pattern := regexp.MustCompile(`^/orgs/([^/]+)/automation-servers/([^/]+)/c/([^/]+)/groups$`)
	matches := pattern.FindStringSubmatch(topic)

	if len(matches) != 4 {
		logger.Error.Printf("Invalid workspace groups topic format: %s", topic)
		return
	}

	orgID := matches[1]
	automationServerID := matches[2]
	workspaceID := matches[3]

	var groups []string
	if err := json.Unmarshal(message.Payload(), &groups); err != nil {
		logger.Error.Printf("Failed to unmarshal workspace groups message: %v", err)
		return
	}

	profileManager.UpdateWorkspaceGroups(orgID, automationServerID, workspaceID, groups)
	logger.Info.Printf("Successfully updated workspace groups for org %s, server %s, workspace %s", orgID, automationServerID, workspaceID)
}
