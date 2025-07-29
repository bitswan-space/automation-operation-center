# Update Webhook Service

A Go-based webhook service that triggers AOC updates when called with proper authentication.

## Features

- **Signature Validation**: Validates webhook requests using HMAC-SHA256 signatures
- **AOC Update Trigger**: Executes `bitswan on-prem-aoc update` command
- **Structured Logging**: JSON-formatted logs with detailed request information

## API Endpoints

### POST /update
Triggers an AOC update when called with valid signature.

**Headers:**
- `X-Hub-Signature-256`: HMAC-SHA256 signature of the request body

**Response:**
- `200 OK`: Update completed successfully
- `401 Unauthorized`: Missing or invalid signature
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
# Generate signature for empty payload
SIGNATURE=$(echo -n "" | openssl dgst -sha256 -hmac "your-webhook-secret" | cut -d' ' -f2)

# Send request
curl -X POST http://localhost:8080/update \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -H "Content-Type: application/json" \
  -d ""
```
