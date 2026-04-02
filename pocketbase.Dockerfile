FROM alpine:latest

# Define the PocketBase version (current latest as of now)
ARG PB_VERSION=0.22.8

# Install dependencies
RUN apk add --no-cache \
    unzip \
    ca-certificates \
    wget

# Download and install PocketBase
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x /pocketbase \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Create the data directory
RUN mkdir /pb_data

EXPOSE 8090

# Start PocketBase
CMD ["/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb_data"]
