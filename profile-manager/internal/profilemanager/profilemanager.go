package profilemanager

import (
	"strings"
	"sync"
	"time"

	"bitswan.space/profile-manager/internal/logger"
)

const (
	profileTimeout = 1 * time.Hour
)

// Profile represents a profile with its properties
type Profile struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ProfileManager handles the management of organization profiles and groups
type ProfileManager struct {
	profiles               map[string][]string                       // map[orgID][]string
	automationServerGroups map[string]map[string][]string            // map[orgID]map[automationServerID][]string
	workspaceGroups        map[string]map[string]map[string][]string // map[orgID]map[automationServerID]map[workspaceID][]string
	mu                     sync.RWMutex
}

var (
	instance *ProfileManager
	once     sync.Once
)

// GetInstance returns the singleton instance of ProfileManager
func GetInstance() *ProfileManager {
	once.Do(func() {
		instance = &ProfileManager{
			profiles:               make(map[string][]string),
			automationServerGroups: make(map[string]map[string][]string),
			workspaceGroups:        make(map[string]map[string]map[string][]string),
		}
	})
	return instance
}

// UpdateProfiles updates the profiles for an organization
func (pm *ProfileManager) UpdateProfiles(orgID string, profiles []string) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	pm.profiles[orgID] = profiles
}

// GetActiveProfiles returns all active profiles for an organization
func (pm *ProfileManager) GetActiveProfiles(orgID string) []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	return pm.profiles[orgID]
}

// UpdateAutomationServerGroups updates the groups for an automation server
func (pm *ProfileManager) UpdateAutomationServerGroups(orgID, automationServerID string, groups []string) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.automationServerGroups[orgID] == nil {
		pm.automationServerGroups[orgID] = make(map[string][]string)
	}
	pm.automationServerGroups[orgID][automationServerID] = groups
}

// GetAutomationServerGroups returns the groups for an automation server
func (pm *ProfileManager) GetAutomationServerGroups(orgID, automationServerID string) []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.automationServerGroups[orgID] == nil {
		return []string{}
	}
	return pm.automationServerGroups[orgID][automationServerID]
}

// UpdateWorkspaceGroups updates the groups for a workspace
func (pm *ProfileManager) UpdateWorkspaceGroups(orgID, automationServerID, workspaceID string, groups []string) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	if pm.workspaceGroups[orgID] == nil {
		pm.workspaceGroups[orgID] = make(map[string]map[string][]string)
	}
	if pm.workspaceGroups[orgID][automationServerID] == nil {
		pm.workspaceGroups[orgID][automationServerID] = make(map[string][]string)
	}
	pm.workspaceGroups[orgID][automationServerID][workspaceID] = groups
}

// GetWorkspaceGroups returns the groups for a workspace
func (pm *ProfileManager) GetWorkspaceGroups(orgID, automationServerID, workspaceID string) []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	if pm.workspaceGroups[orgID] == nil || pm.workspaceGroups[orgID][automationServerID] == nil {
		return []string{}
	}
	return pm.workspaceGroups[orgID][automationServerID][workspaceID]
}

// GetFilteredProfiles returns profiles filtered by automation server and workspace groups
func (pm *ProfileManager) GetFilteredProfiles(orgID, automationServerID, workspaceID string) []string {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	// Get all profiles for the organization
	allProfiles := pm.profiles[orgID]
	if len(allProfiles) == 0 {
		return []string{}
	}

	// Get automation server groups
	automationServerGroups := pm.automationServerGroups[orgID][automationServerID]

	// Get workspace groups
	var workspaceGroups []string
	if pm.workspaceGroups[orgID] != nil && pm.workspaceGroups[orgID][automationServerID] != nil {
		workspaceGroups = pm.workspaceGroups[orgID][automationServerID][workspaceID]
	}

	// Filter profiles based on groups
	var filteredProfiles []string
	for _, profile := range allProfiles {
		// Check if profile matches automation server groups
		automationServerMatch := len(automationServerGroups) == 0 // If no groups, allow all
		for _, group := range automationServerGroups {
			if profile == orgID+"_group_"+group || strings.HasSuffix(profile, "_admin") {
				automationServerMatch = true
				break
			}
		}

		// Check if profile matches workspace groups
		workspaceMatch := len(workspaceGroups) == 0 // If no groups, allow all
		for _, group := range workspaceGroups {
			if profile == orgID+"_group_"+group || strings.HasSuffix(profile, "_admin") {
				workspaceMatch = true
				break
			}
		}

		// Profile must match both automation server and workspace groups
		if automationServerMatch && workspaceMatch {
			filteredProfiles = append(filteredProfiles, profile)
		}
	}

	logger.Info.Printf("Filtered profiles: %v, orgID: %s, automationServerID: %s, workspaceID: %s", filteredProfiles, orgID, automationServerID, workspaceID)
	return filteredProfiles
}
