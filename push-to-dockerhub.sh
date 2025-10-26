#!/bin/bash

# Docker Hub Push Script for Scrum Poker App
# This script builds and pushes the Docker image to Docker Hub

set -e  # Exit on any error

# Configuration
IMAGE_NAME="scrum-poker"
DOCKERHUB_USERNAME=""
TAG="latest"
DOCKERFILE="Dockerfile"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --username USERNAME    Docker Hub username (required)"
    echo "  -t, --tag TAG             Image tag (default: latest)"
    echo "  -f, --dockerfile FILE     Dockerfile to use (default: Dockerfile)"
    echo "  -h, --help                Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -u myusername"
    echo "  $0 -u myusername -t v1.0.0"
    echo "  $0 -u myusername -f Dockerfile.render -t render"
    echo ""
    echo "Available Dockerfiles:"
    echo "  - Dockerfile (main)"
    echo "  - Dockerfile.render (Render optimized)"
    echo "  - Dockerfile.render.alternative (Render alternative)"
    echo "  - Dockerfile.railway (Railway optimized)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--username)
            DOCKERHUB_USERNAME="$2"
            shift 2
            ;;
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -f|--dockerfile)
            DOCKERFILE="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$DOCKERHUB_USERNAME" ]; then
    print_error "Docker Hub username is required!"
    show_usage
    exit 1
fi

# Check if Dockerfile exists
if [ ! -f "$DOCKERFILE" ]; then
    print_error "Dockerfile '$DOCKERFILE' not found!"
    exit 1
fi

# Full image name
FULL_IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${TAG}"

print_status "Starting Docker Hub push process..."
print_status "Image: $FULL_IMAGE_NAME"
print_status "Dockerfile: $DOCKERFILE"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if user is logged in to Docker Hub
if ! docker info | grep -q "Username:"; then
    print_warning "You are not logged in to Docker Hub."
    print_status "Please run: docker login"
    read -p "Press Enter to continue after logging in..."
fi

# Build the image
print_status "Building Docker image..."
if docker build -f "$DOCKERFILE" -t "$FULL_IMAGE_NAME" .; then
    print_success "Docker image built successfully!"
else
    print_error "Failed to build Docker image!"
    exit 1
fi

# Tag the image as latest if not already
if [ "$TAG" != "latest" ]; then
    LATEST_IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest"
    print_status "Tagging image as latest..."
    docker tag "$FULL_IMAGE_NAME" "$LATEST_IMAGE_NAME"
fi

# Push the image
print_status "Pushing image to Docker Hub..."
if docker push "$FULL_IMAGE_NAME"; then
    print_success "Image pushed successfully!"
else
    print_error "Failed to push image to Docker Hub!"
    exit 1
fi

# Push latest tag if different from current tag
if [ "$TAG" != "latest" ]; then
    print_status "Pushing latest tag..."
    if docker push "$LATEST_IMAGE_NAME"; then
        print_success "Latest tag pushed successfully!"
    else
        print_warning "Failed to push latest tag, but main tag was successful."
    fi
fi

print_success "Docker Hub push completed successfully!"
print_status "Your image is available at: https://hub.docker.com/r/${DOCKERHUB_USERNAME}/${IMAGE_NAME}"
print_status "Pull command: docker pull ${FULL_IMAGE_NAME}"

# Show usage examples
echo ""
print_status "Usage examples:"
echo "  # Run the image locally:"
echo "  docker run -p 5000:5000 -e PORT=5000 ${FULL_IMAGE_NAME}"
echo ""
echo "  # Run with custom port:"
echo "  docker run -p 3000:5000 -e PORT=5000 ${FULL_IMAGE_NAME}"
echo ""
echo "  # Run in background:"
echo "  docker run -d -p 5000:5000 -e PORT=5000 --name scrum-poker ${FULL_IMAGE_NAME}"
