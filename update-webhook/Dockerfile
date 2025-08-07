FROM golang:latest
WORKDIR /app
COPY go.mod go.sum ./
COPY *.go ./
RUN go mod download
RUN go build -o update-webhook
EXPOSE 8081
CMD ["./update-webhook"]
