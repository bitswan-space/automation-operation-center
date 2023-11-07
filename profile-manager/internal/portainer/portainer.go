package portainer

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"bitswan.space/container-discovery-service/internal/config"
	"bitswan.space/container-discovery-service/internal/logger"
)

var client *http.Client = &http.Client{Timeout: 10 * time.Second}

type Snapshot struct {
	DockerSnapshotRaw DockerSnapshotRaw `json:"DockerSnapshotRaw"`
}

type DockerSnapshotRaw struct {
	Containers []EndpointContainer `json:"Containers"`
}

type EndpointContainer struct {
	ID     string            `json:"Id"`
	Labels map[string]string `json:"Labels"`
	State  string            `json:"State"`
	Status string            `json:"Status"`
}

type Endpoint struct {
	ID        int        `json:"Id"`
	Name      string     `json:"Name"`
	SnapShots []Snapshot `json:"Snapshots"`
}

type ContainerDetail struct {
	Config struct {
		Env []string `json:"Env"`
	} `json:"Config"`
	CreatedAt time.Time `json:"Created"`
	Name      string    `json:"Name"`
}

type TopologyItem struct {
	Wires      []string           `json:"wires"`
	Properties TopologyProperties `json:"properties"`
	Metrics    []int              `json:"metrics"`
}

type TopologyProperties struct {
	EndpointID   int       `json:"endpoint-id"`
	ContainerID  string    `json:"container-id"`
	EndpointName string    `json:"endpoint-name"`
	DeploymentId string    `json:"deployment-id"`
	CreatedAt    time.Time `json:"created-at"`
	Name         string    `json:"name"`
	State        string    `json:"state"`
	Status       string    `json:"status"`
}

type Topology struct {
	Topology        map[string]TopologyItem `json:"topology"`
	DisplayStyle    string                  `json:"display-style"`
	DisplayPriority string                  `json:"display-priority"`
}

func GetTopology() (Topology, error) {
	var topology Topology = Topology{}

	// Get endpoints
	endpoints, err := GetEndpoints()
	if err != nil {
		return topology, err
	}

	// Get topology items
	topology.Topology = GetTopologyItems(endpoints)
	topology.DisplayStyle = "list"

	return topology, nil
}

func GetEndpoints() ([]Endpoint, error) {
	cfg := config.GetConfig()
	var endpoints []Endpoint
	req, err := http.NewRequest("GET", cfg.PortainerURL+"/api/endpoints", nil)
	if err != nil {
		return endpoints, err
	}

	api_key := os.Getenv("PORTAINER_ACCESS_TOKEN")
	req.Header.Set("X-API-Key", api_key)
	req.Header.Set("Content-Type", "application/json")
	res, err := client.Do(req)
	if err != nil {
		return endpoints, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		return endpoints, fmt.Errorf("failed to get container details, status code: %d", res.StatusCode)
	}

	err = json.NewDecoder(res.Body).Decode(&endpoints)
	if err != nil {
		return endpoints, err
	}
	return endpoints, nil
}

func GetTopologyItems(endpoints []Endpoint) map[string]TopologyItem {
	topologyItems := make(map[string]TopologyItem)
	for _, endpoint := range endpoints {
		for _, snapshot := range endpoint.SnapShots {
			for _, container := range snapshot.DockerSnapshotRaw.Containers {
				if _, exists := container.Labels["space.bitswan.pipeline.protocol-version"]; exists {
					detail, err := GetContainerDetail(endpoint.ID, container.ID)
					if err != nil {
						logger.Error.Println(err)
					}
					deploymentId := GetDeploymentId(detail.Config.Env)
					if deploymentId == "" {
						continue
					}

					topologyItem := TopologyItem{
						Wires:      []string{},
						Properties: TopologyProperties{},
						Metrics:    []int{},
					}
					topologyItem.Properties = TopologyProperties{
						EndpointID:   endpoint.ID,
						ContainerID:  container.ID,
						EndpointName: endpoint.Name,
						DeploymentId: deploymentId,
						CreatedAt:    detail.CreatedAt,
						Name:         strings.Replace(detail.Name, "/", "", -1),
						Status:       container.Status,
						State:        container.State,
					}

					topologyItems[deploymentId] = topologyItem
				}
			}
		}
	}

	return topologyItems
}

func GetContainerDetail(endpointId int, containerId string) (ContainerDetail, error) {
	cfg := config.GetConfig()
	containerDetail := ContainerDetail{}

	url := fmt.Sprintf("%s/api/endpoints/%d/docker/containers/%s/json", cfg.PortainerURL, endpointId, containerId)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return containerDetail, err
	}

	api_key := os.Getenv("PORTAINER_ACCESS_TOKEN")
	req.Header.Set("X-API-Key", api_key)
	req.Header.Set("Content-Type", "application/json")
	res, err := client.Do(req)
	if err != nil {
		return containerDetail, err
	}
	defer res.Body.Close()

	// Check the response status code
	if res.StatusCode != http.StatusOK {
		return containerDetail, fmt.Errorf("failed to get container details, status code: %d", res.StatusCode)
	}

	err = json.NewDecoder(res.Body).Decode(&containerDetail)
	if err != nil {
		return containerDetail, err
	}

	return containerDetail, nil
}

func GetDeploymentId(envVars []string) string {
	for _, envVar := range envVars {
		parts := strings.SplitN(envVar, "=", 2)
		if len(parts) == 2 && parts[0] == "DEPLOYMENT_ID" {
			return parts[1] // Return a pointer to the string
		}
	}
	return "" // DEPLOYMENT_ID not found, return nil
}
