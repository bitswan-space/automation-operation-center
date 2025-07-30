# Update Webhook Service

A Go-based webhook service that triggers AOC updates when called with proper authentication and timestamp validation. The webhook is designed to work with GitHub Actions workflows. See `.github/workflows/trigger-aoc-update.yml`.

## Features

- **Signature Validation**: Validates webhook requests using HMAC-SHA256 signatures
- **Timestamp Validation**: Ensures requests are within 5 minutes of current time to prevent replay attacks
- **AOC Update Trigger**: Executes `bitswan on-prem-aoc update` command
- **Structured Logging**: JSON-formatted logs with detailed request information

## API Endpoints

### POST /update
Triggers an AOC update when called with valid signature and timestamp.

**Headers:**
- `Content-Type`: Must be `application/json`
- `X-Hub-Signature-256`: HMAC-SHA256 signature of the JSON request body

**Request Body:**
```json
{
  "timestamp": <timestamp>
}
```

**Response:**
- `200 OK`: Update completed successfully
- `400 Bad Request`: Invalid JSON payload or failed to read request body
- `401 Unauthorized`: Missing signature, invalid signature, or timestamp validation failed
- `500 Internal Server Error`: Update failed or configuration error

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `UPDATE_WEBHOOK_SECRET` | Secret for signature validation | Required |
| `PORT` | Server port | `8080` |
| `LOG_MODE` | Log level mode (`debug`/`release`) | `debug` |

## Setup

### Local Development

1. Create a `.env` file:
   ```bash
   UPDATE_WEBHOOK_SECRET=your-webhook-secret-here
   PORT=8080
   LOG_MODE=debug
   ```
2. Install dependencies:
   ```bash
   go mod download
   ```
3. Run the service:
   ```bash
   go run main.go
   ```

## Testing

### Test the webhook endpoint:

```bash
# Create JSON payload with current timestamp
TIMESTAMP=$(date +%s)
PAYLOAD="{\"timestamp\": $TIMESTAMP}"

# Generate signature for the JSON payload
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "your-webhook-secret" | cut -d' ' -f2)

# Send request
curl -X POST http://localhost:8080/update \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```
