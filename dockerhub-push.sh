#!/bin/bash

# Quick Docker Hub Push Script
# Usage: ./dockerhub-push.sh <username> [tag] [dockerfile]

set -e

USERNAME=${1:-}
TAG=${2:-latest}
DOCKERFILE=${3:-Dockerfile}
IMAGE_NAME="scrum-poker"

if [ -z "$USERNAME" ]; then
    echo "Usage: $0 <username> [tag] [dockerfile]"
    echo "Example: $0 myusername"
    echo "Example: $0 myusername v1.0.0"
    echo "Example: $0 myusername latest Dockerfile.render"
    exit 1
fi

FULL_IMAGE_NAME="${USERNAME}/${IMAGE_NAME}:${TAG}"

echo "Building and pushing ${FULL_IMAGE_NAME}..."

# Build
docker build -f "$DOCKERFILE" -t "$FULL_IMAGE_NAME" .

# Push
docker push "$FULL_IMAGE_NAME"

echo "✅ Successfully pushed to Docker Hub!"
echo "Image: ${FULL_IMAGE_NAME}"
echo "Pull: docker pull ${FULL_IMAGE_NAME}"
