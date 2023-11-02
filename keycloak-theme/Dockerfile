# Build stage for creating the theme JAR
FROM node:16 as builder

# Copy the repository contents into the Docker image
COPY . /usr/src/app
WORKDIR /usr/src/app

# Install dependencies and build the JAR
RUN yarn install && \
    yarn build && \
    npx keycloakify

# Base image for Keycloak server
FROM quay.io/keycloak/keycloak:22.0.2

# Copy the theme JAR from the build stage into the Keycloak server image
COPY --from=builder /usr/src/app/build_keycloak/target/*keycloak-theme*.jar /opt/keycloak/providers/
