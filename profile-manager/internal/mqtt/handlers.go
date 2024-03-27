package mqtt

import (
	"encoding/json"
	"os"
	"sync"

	"bitswan.space/container-discovery-service/internal/logger"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	"github.com/xeipuuv/gojsonschema"
)

type Message struct {
	Count uint64 `json:"count"`
}

type Topology struct {
	Topology     map[string]Pipeline `json:"topology"`
	DisplayStyle string              `json:"display-style"`
}

type Pipeline struct {
	Wires      []interface{} `json:"wires"`
	Properties Properties    `json:"properties"`
	Metrics    []interface{} `json:"metrics"`
}

type Properties struct {
	ContainerID  string `json:"container-id"`
	EndpointName string `json:"endpoint-name"`
	DeploymentID string `json:"deployment-id"`
	CreatedAt    string `json:"created-at"`
	Name         string `json:"name"`
	State        string `json:"state"`
	Status       string `json:"status"`
}

type TopologyEvent struct {
	Count                      uint64   `json:"count"`
	RemainingSubscriptionCount uint64   `json:"remaining_subscription_count"`
	Data                       Topology `json:"data"`
}

var (
	mergedTopology Topology
	lock           sync.Mutex
	pipelineSources = make(map[string]string)
)

func init() {
	mergedTopology = Topology{
		Topology: make(map[string]Pipeline),
	}
}

func HandleTopologyRequest(client mqtt.Client, message mqtt.Message) {
	var newTopology Topology

	if !json.Valid([]byte(message.Payload())) {
		logger.Error.Println("Invalid JSON")
	} else {
		json.Unmarshal([]byte(message.Payload()), &newTopology)

		// Identify the topic from the message
		topic := message.Topic()

		// Track pipelines received in this message
		receivedPipelines := make(map[string]struct{})

		lock.Lock()
		for key, value := range newTopology.Topology {
			mergedTopology.Topology[key] = value
			pipelineSources[key] = topic
			receivedPipelines[key] = struct{}{}
		}

		// Check for any pipelines that need to be removed
		// These are pipelines that were previously added by this topic but are not present in the new message
		for pipeline, srcTopic := range pipelineSources {
			if srcTopic == topic {
				if _, exists := receivedPipelines[pipeline]; !exists {
					// Pipeline was not in the received message; remove it
					delete(mergedTopology.Topology, pipeline)
					delete(pipelineSources, pipeline)
				}
			}
		}
		lock.Unlock()

		// TODO: remove this and return just topology
		topologyEvent := TopologyEvent{
			Count:                      1,
			RemainingSubscriptionCount: 1,
			Data:                       mergedTopology,
		}
		b, err := json.MarshalIndent(topologyEvent, "", "  ")
		if err != nil {
			logger.Error.Println(err)
			return
		}

		client.Publish(cfg.MQTTContainersPub, 0, true, string(b))
	}

}

func HandleNavigationSetRequest(client mqtt.Client, message mqtt.Message) {
	var msg json.RawMessage
	logger.Info.Println("Received navigation set request")
	documentLoader := gojsonschema.NewStringLoader(string(message.Payload()))

	logger.Info.Printf("Validating JSON schema...")
	result, err := gojsonschema.Validate(schemaLoader, documentLoader)
	if err != nil {
		logger.Error.Println(err)
		return
	}

	if !result.Valid() {
		logger.Error.Println("Invalid JSON schema. Errors:")
		for _, desc := range result.Errors() {
			logger.Error.Printf("- %s\n", desc)
		}
	} else {
		json.Unmarshal([]byte(message.Payload()), &msg)
		err := os.WriteFile(cfg.NavigationFile, msg, 0644)
		if err != nil {
			logger.Error.Println(err)
			return
		}

		// Send retained message with new navigation structure
		client.Publish(cfg.MQTTNavigationPub, 0, true, string(msg))
	}
}
