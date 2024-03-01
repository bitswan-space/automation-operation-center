FROM alpine:3.15 as extractor
RUN apk add --no-cache curl unzip
WORKDIR /download
RUN curl -sL https://github.com/rapiz1/rathole/releases/download/v0.5.0/rathole-arm-unknown-linux-musleabi.zip -o rathole.zip \
    && unzip rathole.zip

FROM gcr.io/distroless/cc-debian12
WORKDIR /app
COPY --from=extractor /download/rathole .
USER 1000:1000
ENTRYPOINT ["./rathole", "server.toml"]
