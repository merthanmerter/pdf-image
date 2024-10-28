#!/bin/bash

IMAGE_NAME="pdf-to-image"

# Build the Docker image
echo "Building the Docker image..."
docker build -t $IMAGE_NAME .

# Check if a container with the same name is already running, and stop/remove it
if [ "$(docker ps -q -f name=$IMAGE_NAME)" ]; then
    echo "Stopping and removing existing container..."
    docker stop $IMAGE_NAME
    docker rm $IMAGE_NAME
fi

# Run the Docker container
echo "Starting the Docker container..."
docker run -d -p 3000:3000 --name $IMAGE_NAME $IMAGE_NAME

echo "Docker container started! Access the app at http://localhost:3000"
