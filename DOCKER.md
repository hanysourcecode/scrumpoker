# Docker Deployment Guide

This guide explains how to build and run the Scrum Poker application using Docker.

## Overview

The application uses a multi-stage Docker build that:
1. Builds the React frontend in the first stage
2. Combines the built frontend with the Node.js backend in the second stage
3. Serves both the API and frontend from a single container on port 5000

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the application
npm run docker:compose:up

# Or manually:
docker-compose up -d
```

The application will be available at `http://localhost:5000`

### Using Docker directly

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run

# Or manually:
docker build -t scrum-poker .
docker run -p 5000:5000 scrum-poker
```

## Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build the Docker image |
| `npm run docker:run` | Run the container on port 5000 |
| `npm run docker:compose:up` | Start with docker-compose |
| `npm run docker:compose:down` | Stop docker-compose services |
| `npm run docker:compose:build` | Build with docker-compose |

## Architecture

### Multi-stage Build

**Stage 1: Frontend Builder**
- Uses Node.js 18 Alpine
- Installs frontend dependencies
- Builds the React application for production

**Stage 2: Production**
- Uses Node.js 18 Alpine
- Installs backend dependencies
- Copies built frontend to `/app/public`
- Serves both API and frontend from port 5000

### File Structure in Container

```
/app/
├── server.js          # Backend server
├── package.json       # Backend dependencies
├── node_modules/      # Backend dependencies
└── public/           # Built React frontend
    ├── index.html
    ├── static/
    └── ...
```

## Environment Variables

The following environment variables can be configured:

- `NODE_ENV`: Set to `production` for production builds
- `PORT`: Server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS (production only)

## Health Check

The container includes a health check that:
- Checks the `/health` endpoint every 30 seconds
- Times out after 3 seconds
- Retries 3 times before marking as unhealthy
- Waits 5 seconds before starting checks

## Production Deployment

### Using Docker Compose

1. Copy `docker-compose.yml` to your server
2. Run: `docker-compose up -d`
3. The application will be available on port 5000

### Using Docker Swarm or Kubernetes

The image can be deployed to any container orchestration platform:

```yaml
# Example Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: scrum-poker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: scrum-poker
  template:
    metadata:
      labels:
        app: scrum-poker
    spec:
      containers:
      - name: scrum-poker
        image: scrum-poker:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
```

## Troubleshooting

### Build Issues

- Ensure Docker has enough memory allocated (at least 2GB)
- Clear Docker cache: `docker system prune -a`
- Check `.dockerignore` file for excluded files

### Runtime Issues

- Check container logs: `docker logs <container-id>`
- Verify port mapping: `docker port <container-id>`
- Test health endpoint: `curl http://localhost:5000/health`

### Performance

- The multi-stage build optimizes image size
- Frontend is served as static files for better performance
- Backend handles both API and frontend serving

## Development vs Production

### Development
- Frontend runs on port 3000 with hot reload
- Backend runs on port 5000
- Uses `npm run dev` for concurrent development

### Production (Docker)
- Single container serves everything on port 5000
- Frontend is built and served as static files
- Optimized for performance and deployment
