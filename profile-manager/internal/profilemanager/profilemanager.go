package profilemanager

import (
	"sync"
	"time"
)

const (
	profileTimeout = 1 * time.Hour
)

// Profile represents a profile with its properties
type Profile struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// ProfileManager handles the management of organization profiles
type ProfileManager struct {
	profiles map[string][]string // map[orgID][]string
	mu       sync.RWMutex
}

var (
	instance *ProfileManager
	once     sync.Once
)

// GetInstance returns the singleton instance of ProfileManager
func GetInstance() *ProfileManager {
	once.Do(func() {
		instance = &ProfileManager{
			profiles: make(map[string][]string),
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
