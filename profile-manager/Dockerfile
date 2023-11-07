# Start from the official Golang image to build the binary.
FROM golang:1.21 as builder

# Set the Current Working Directory inside the container.
WORKDIR /app

# Copy go mod and sum files.
COPY go.mod go.sum ./

# Download all dependencies.
RUN go mod download

# Copy the source from the current directory to the Working Directory inside the container.
COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o container-discovery-service ./cmd/main.go

# Start a new stage from scratch.
FROM alpine:latest  

WORKDIR /app

# Copy the Pre-built binary file from the previous stage.
COPY --from=builder /app/container-discovery-service .


# Command to run the executable.
CMD ["/app/container-discovery-service", "-c", "/conf/config.yaml"]