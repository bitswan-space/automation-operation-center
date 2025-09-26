# Automation Server Integration Documentation

This document describes the complete integration guide for automation servers, including authentication, API endpoints, and MQTT topics.

## Overview

The Bitswan platform provides two distinct API interfaces:

1. **Frontend API** (`/api/frontend/`) - For web interface with Keycloak authentication
2. **Automation Server API** (`/api/automation_server/`) - For automation servers with Bearer token authentication

## Authentication Flow

### Initial Setup (Web Interface)

1. User opens web interface and navigates to automation servers
2. User clicks "Connect Automation Server"
3. User enters server name and clicks "Create Server"
4. System generates OTP and displays CLI command
5. User copies and runs CLI command on automation server

### CLI Registration

```bash
bitswan register --aoc-api "https://api.example.com" --otp "ABC12345"
```

This command:
1. Exchanges OTP for long-lived access token
2. Stores token locally for subsequent API calls
3. Validates connection to the platform

## API Endpoints

#### OTP Management

- `POST /api/frontend/automation-servers/create-with-otp/` - Create server with OTP
- `GET /api/frontend/automation-servers/check-otp-status/` - Check OTP redemption status

### Automation Server API (CLI/Automation Servers)

**Base URL:** `/api/automation_server/`  
**Authentication:** Bearer Token (obtained via OTP exchange)  
**Used by:** Bitswan CLI and automation servers

#### Authentication

##### Exchange OTP for Access Token

**Endpoint:** `POST /api/automation_server/exchange-otp/`  
**Authentication:** None required  
**Description:** Exchanges a one-time password for a long-lived access token.

**Request Body:**
```json
{
  "otp": "ABC12345",
  "automation_server_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
  "expires_at": "2025-09-26T17:34:42.123456Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid or expired OTP
- `404 Not Found`: Automation server not found

##### Get Automation Server Information

**Endpoint:** `GET /api/automation_server/info/`  
**Authentication:** Bearer Token required  
**Description:** Get information about the authenticated automation server.

**Response (200 OK):**
```json
{
  "id": 123,
  "name": "my-production-server",
  "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
  "is_connected": true,
  "created_at": "2025-09-26T10:00:00Z",
  "updated_at": "2025-09-26T10:30:00Z"
}
```

#### Workspace Management

##### List Workspaces

**Endpoint:** `GET /api/automation_server/workspaces/`  
**Authentication:** Bearer Token required  
**Description:** List all workspaces belonging to the authenticated automation server.

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "workspace-uuid-1",
      "name": "Production Workspace",
      "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
      "created_at": "2025-09-26T10:00:00Z",
      "updated_at": "2025-09-26T10:30:00Z"
    }
  ]
}
```

##### Create Workspace

**Endpoint:** `POST /api/automation_server/workspaces/`  
**Authentication:** Bearer Token required  
**Description:** Create a new workspace in the authenticated automation server.

**Request Body:**
```json
{
  "name": "New Workspace",
  "description": "Optional description"
}
```

**Response (201 Created):**
```json
{
  "id": "workspace-uuid-2",
  "name": "New Workspace",
  "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
  "created_at": "2025-09-26T11:00:00Z",
  "updated_at": "2025-09-26T11:00:00Z"
}
```

##### Update Workspace

**Endpoint:** `PUT /api/automation_server/workspaces/{id}/`  
**Authentication:** Bearer Token required  
**Description:** Update an existing workspace.

##### Delete Workspace

**Endpoint:** `DELETE /api/automation_server/workspaces/{id}/`  
**Authentication:** Bearer Token required  
**Description:** Delete a workspace.

##### Get EMQX JWT for Workspace

**Endpoint:** `GET /api/automation_server/workspaces/{id}/emqx/jwt/`  
**Authentication:** Bearer Token required  
**Description:** Get MQTT JWT token for a specific workspace.

**Response (200 OK):**
```json
{
  "url": "mqtt://emqx.example.com:1883",
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## MQTT Integration

### Connection Details

- **Protocol:** MQTT v3.1.1
- **Authentication:** JWT tokens obtained via API
- **Client ID:** Auto-generated unique identifier
- **QoS:** 0 (At most once delivery)

### Topic Structure

All MQTT topics follow a hierarchical structure:
```
/orgs/{org_id}/automation-servers/{automation_server_id}/...
```

#### Group Management Topics

##### Automation Server Groups
**Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/groups`  
**Type:** Retained message  
**Purpose:** Publishes list of Keycloak group IDs that have access to this automation server  
**Payload:**
```json
["group-id-1", "group-id-2", "admin-group-id"]
```

##### Workspace Groups
**Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/groups`  
**Type:** Retained message  
**Purpose:** Publishes list of Keycloak group IDs that have access to this workspace  
**Payload:**
```json
["editor-group-id-1", "admin-group-id"]
```

#### Pipeline Communication Topics

##### Workspace Topology

**Request Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/topology/subscribe`  
**Response Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/topology`  
**Purpose:** Get the current topology/structure of pipelines in the workspace

**Request Payload:**
```json
{
  "count": 1
}
```

**Response Payload:**
```json
{
  "components": [
    {
      "id": "component-1",
      "type": "source",
      "properties": {...},
      "connections": [...]
    }
  ]
}
```

##### Component Events

**Request Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/c/{component_id}/events/subscribe`  
**Response Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/c/{component_id}/events`  
**Purpose:** Subscribe to real-time events from a specific pipeline component

**Request Payload:**
```json
{
  "count": 5
}
```

**Response Payload:**
```json
{
  "timestamp": 1727371482,
  "data": {...},
  "count": 1
}
```

##### Component Topology

**Request Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/c/{component_ids}/topology/subscribe`  
**Response Topic:** `/orgs/{org_id}/automation-servers/{automation_server_id}/c/{workspace_id}/c/{component_ids}/topology`  
**Purpose:** Get topology information for specific pipeline components

Where `{component_ids}` is a forward-slash separated list of component IDs.

### Connection Parameters

#### Frontend (Web Interface)
```javascript
{
  clientId: "bitswan-poc" + Math.random().toString(16).substring(2, 8),
  clean: true,
  reconnectPeriod: 60,
  connectTimeout: 30000,
  username: "bitswan-frontend",
  password: "<mqtt_jwt_token>"
}
```

#### Backend Services
```python
{
  username: "bitswan-backend",
  password: "<mqtt_jwt_token>"
}
```

#### Automation Servers
```
username: "<automation_server_id>"
password: "<mqtt_jwt_token>"
```

## Security Features

### OTP Security
- **Expiration:** 10 minutes from generation
- **Single Use:** Can only be exchanged once
- **Random Generation:** Cryptographically secure
- **Case Insensitive:** OTP comparison ignores case

### Access Token Security
- **Expiration:** 1 year (configurable)
- **Scoped Access:** Limited to specific automation server
- **Secure Storage:** Stored in database with validation
- **Automatic Cleanup:** Expired tokens are invalidated

### API Security
- **HTTPS Required:** All API communications must use TLS
- **Rate Limiting:** Recommended on OTP endpoints
- **Input Validation:** Comprehensive validation on all inputs
- **Error Handling:** Secure error messages without information leakage

### MQTT Security
- **TLS Encryption:** All MQTT communications encrypted
- **JWT Authentication:** Token-based authentication
- **Topic ACL:** Access control based on organization and automation server
- **Mountpoint Isolation:** Each automation server isolated to its own topic namespace

## Token Permissions

### Frontend API Tokens (Keycloak JWT)
- Full access to organization resources
- User and group management
- Automation server administration
- Workspace management across all automation servers

### Automation Server API Tokens (Bearer)
- **Allowed Operations:**
  - Create and manage workspaces within the specific automation server
  - Read automation server information
  - Access MQTT tokens for workspaces
  - Subscribe to MQTT topics within automation server scope

- **Restricted Operations:**
  - Cannot access other automation servers
  - Cannot perform user/group management
  - Cannot modify automation server settings
  - Cannot access admin functions

## Error Handling

### Common Error Scenarios

#### OTP Expired
```json
{
  "error": "Invalid or expired OTP."
}
```
**Solution:** Generate new OTP in web interface

#### OTP Already Used
```json
{
  "error": "Invalid or expired OTP."
}
```
**Solution:** Generate new OTP in web interface

#### Server Name Exists
```json
{
  "error": "Automation server with this name already exists."
}
```
**Solution:** Use different server name

#### Invalid Authentication
```json
{
  "error": "Invalid or expired access token"
}
```
**Solution:** Re-register automation server with new OTP

#### Workspace Access Denied
```json
{
  "error": "Workspace does not belong to this automation server"
}
```
**Solution:** Verify workspace belongs to authenticated automation server

### Troubleshooting

#### CLI Registration Issues
1. Verify OTP is correct and not expired (10-minute limit)
2. Check API URL is accessible and correct
3. Ensure automation server ID matches exactly
4. Verify network connectivity to API endpoint

#### MQTT Connection Issues
1. Verify JWT token is valid and not expired
2. Check MQTT broker URL and port
3. Ensure topic permissions are correct
4. Verify TLS/SSL configuration

#### API Access Issues
1. Check Bearer token is included in Authorization header
2. Verify token hasn't expired (1-year limit)
3. Ensure requesting resources within automation server scope
4. Check API endpoint URLs are correct

## Integration Examples

### CLI Registration Flow

```bash
# 1. User gets OTP from web interface
# 2. Run registration command
bitswan register --aoc-api "https://api.bitswan.io" --otp "ABC12345"

# 3. CLI stores token and displays success
# 4. Subsequent CLI commands use stored token automatically
bitswan workspace create --name "Production Environment"
```

### Programmatic API Usage

```python
import requests

# Exchange OTP for token
response = requests.post(
    "https://api.bitswan.io/api/automation_server/exchange-otp/",
    json={
        "otp": "ABC12345",
        "automation_server_id": "123e4567-e89b-12d3-a456-426614174000"
    }
)

token_data = response.json()
access_token = token_data["access_token"]

# Use token for API calls
headers = {"Authorization": f"Bearer {access_token}"}

# Create workspace
workspace_response = requests.post(
    "https://api.bitswan.io/api/automation_server/workspaces/",
    json={"name": "New Workspace"},
    headers=headers
)

# Get MQTT token for workspace
workspace_id = workspace_response.json()["id"]
mqtt_response = requests.get(
    f"https://api.bitswan.io/api/automation_server/workspaces/{workspace_id}/emqx/jwt/",
    headers=headers
)

mqtt_config = mqtt_response.json()
```

### MQTT Integration

```python
import paho.mqtt.client as mqtt
import json

# Connect to MQTT broker
client = mqtt.Client()
client.username_pw_set("automation-server-id", "jwt-token")
client.connect("mqtt.bitswan.io", 1883, 60)

# Subscribe to workspace topology
topic = "/orgs/org-id/automation-servers/server-id/c/workspace-id/topology"
client.subscribe(topic)

# Publish topology subscription request
request_topic = "/orgs/org-id/automation-servers/server-id/c/workspace-id/topology/subscribe"
client.publish(request_topic, json.dumps({"count": 1}))

# Handle incoming messages
def on_message(client, userdata, msg):
    topic = msg.topic
    payload = json.loads(msg.payload.decode())
    print(f"Received on {topic}: {payload}")

client.on_message = on_message
client.loop_forever()
```

## API Reference Summary

### Frontend API Endpoints
- Organizations: `/api/frontend/orgs/`
- Users: `/api/frontend/org-users/`
- Groups: `/api/frontend/user-groups/`
- Automation Servers: `/api/frontend/automation-servers/`
- Workspaces: `/api/frontend/workspaces/`
- MQTT Tokens: `/api/frontend/user/emqx/jwts/`

### Automation Server API Endpoints
- Authentication: `/api/automation_server/exchange-otp/`
- Server Info: `/api/automation_server/info/`
- Workspaces: `/api/automation_server/workspaces/`
- MQTT Tokens: `/api/automation_server/workspaces/{id}/emqx/jwt/`

### MQTT Topic Patterns
- Groups: `/orgs/{org_id}/automation-servers/{server_id}/groups`
- Workspace Groups: `/orgs/{org_id}/automation-servers/{server_id}/c/{workspace_id}/groups`
- Topology: `/orgs/{org_id}/automation-servers/{server_id}/c/{workspace_id}/topology`
- Component Events: `/orgs/{org_id}/automation-servers/{server_id}/c/{workspace_id}/c/{component_id}/events`
- Component Topology: `/orgs/{org_id}/automation-servers/{server_id}/c/{workspace_id}/c/{component_ids}/topology`