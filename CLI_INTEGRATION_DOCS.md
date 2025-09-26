# CLI Integration Documentation

This document describes the new OTP-based authentication system for automation servers.

## Overview

The new system provides a secure, user-friendly way to connect automation servers to the platform using one-time passwords (OTPs).

## API Endpoints

### 1. Create Automation Server with OTP

**Endpoint:** `POST /api/automation-servers/create-with-otp/`

**Description:** Creates a new automation server and generates an OTP for CLI registration.

**Authentication:** Required (Keycloak JWT)

**Request Body:**
```json
{
  "name": "my-production-server"
}
```

**Response (201 Created):**
```json
{
  "automation_server_id": "123e4567-e89b-12d3-a456-426614174000",
  "otp": "ABC12345",
  "message": "Automation server created successfully. Use the OTP with the CLI command."
}
```

**Error Responses:**
- `400 Bad Request`: Server name already exists or missing
- `401 Unauthorized`: Invalid or missing authentication token

### 2. Exchange OTP for Access Token

**Endpoint:** `POST /api/automation-servers/exchange-otp/`

**Description:** Exchanges a one-time password (OTP) for a long-lived access token.

**Authentication:** None required

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

### 3. Check OTP Redemption Status

**Endpoint:** `GET /api/automation-servers/check-otp-status/?automation_server_id={id}`

**Description:** Checks whether an OTP has been redeemed by the CLI.

**Authentication:** Required (Keycloak JWT)

**Query Parameters:**
- `automation_server_id` (required): UUID of the automation server

**Response (200 OK) - Not Redeemed:**
```json
{
  "redeemed": false,
  "otp": "ABC12345",
  "expires_at": "2025-09-26T17:44:42.123456Z"
}
```

**Response (200 OK) - Redeemed:**
```json
{
  "redeemed": true,
  "redeemed_at": "2025-09-26T17:35:15.789012Z"
}
```

## CLI Usage

### Registration Command

```bash
bitswan register --aoc-api "https://api.example.com" --otp "ABC12345"
```

### Command Parameters


- `--aoc-api`: Base URL of the AOC API
- `--otp`: One-time password received from the web interface

### Workflow

1. User opens the web interface and clicks "Connect Automation Server"
2. User enters a server name and clicks "Create Server"
3. System creates automation server and generates OTP
4. Web interface displays OTP and CLI command
5. User runs the CLI command on their automation server
6. CLI exchanges OTP for access token
7. CLI stores token for subsequent API calls
8. Web interface detects OTP redemption and closes modal

## Security Features

### OTP Security
- **Expiration**: 10 minutes
- **Single Use**: Can only be used once
- **Random Generation**: Cryptographically secure random generation
- **Case Insensitive**: OTP comparison is case-insensitive

### Access Token Security
- **Long-lived**: 1 year expiration for convenience
- **Scoped Access**: Limited to specific automation server only
- **Database Storage**: Stored securely in database
- **No External Dependencies**: No reliance on Keycloak device flow

### API Security
- **Rate Limiting**: Recommended on OTP endpoints
- **HTTPS Required**: All communications encrypted
- **Input Validation**: Comprehensive validation of all inputs
- **Error Handling**: Secure error messages without information leakage

## Token Permissions

The access token obtained through OTP exchange has the following permissions:

### Allowed Operations
- Create and manage workspaces within the specific automation server
- Read automation server information
- Access MQTT tokens for the automation server
- Manage workspace groups within the automation server

### Restricted Operations
- Cannot access other automation servers
- Cannot perform administrative operations outside automation server scope
- Cannot modify automation server settings
- Cannot access user management functions

## Error Handling

### Common Error Scenarios

1. **OTP Expired**
   - Error: "Invalid or expired OTP"
   - Solution: Generate new OTP in web interface

2. **OTP Already Used**
   - Error: "Invalid or expired OTP"
   - Solution: Generate new OTP in web interface

3. **Server Name Already Exists**
   - Error: "Automation server with this name already exists"
   - Solution: Use different server name

4. **Invalid Server ID**
   - Error: "Invalid automation server ID"
   - Solution: Check server ID in web interface

### Troubleshooting

1. **CLI Registration Fails**
   - Verify OTP is correct and not expired
   - Check API URL is accessible
   - Ensure server name matches exactly

2. **Web Interface Issues**
   - Check authentication token is valid
   - Verify API connectivity
   - Clear browser cache if needed

3. **Token Issues**
   - Verify token hasn't expired
   - Check token is for correct automation server
   - Regenerate token if necessary