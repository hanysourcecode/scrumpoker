# Deploy Scrum Poker App to Docker Hub

This guide will help you build and push your Scrum Poker application to Docker Hub, making it available for deployment anywhere.

## Prerequisites

- Docker installed and running
- Docker Hub account
- Git repository with your code

## Quick Start

### Option 1: Using the Quick Script

```bash
# Make script executable
chmod +x dockerhub-push.sh

# Push with your Docker Hub username
./dockerhub-push.sh yourusername

# Push with custom tag
./dockerhub-push.sh yourusername v1.0.0

# Push with specific Dockerfile
./dockerhub-push.sh yourusername latest Dockerfile.render
```

### Option 2: Using the Full Script

```bash
# Make script executable
chmod +x push-to-dockerhub.sh

# Show help
./push-to-dockerhub.sh --help

# Push with username
./push-to-dockerhub.sh -u yourusername

# Push with custom tag and Dockerfile
./push-to-dockerhub.sh -u yourusername -t v1.0.0 -f Dockerfile.render
```

## Manual Docker Hub Deployment

### Step 1: Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

### Step 2: Build the Image

Choose the appropriate Dockerfile for your deployment target:

```bash
# For general deployment
docker build -f Dockerfile -t yourusername/scrum-poker:latest .

# For Render deployment
docker build -f Dockerfile.render -t yourusername/scrum-poker:render .

# For Railway deployment
docker build -f Dockerfile.railway -t yourusername/scrum-poker:railway .

# For alternative Render deployment
docker build -f Dockerfile.render.alternative -t yourusername/scrum-poker:render-alt .
```

### Step 3: Push to Docker Hub

```bash
# Push the image
docker push yourusername/scrum-poker:latest

# Push multiple tags
docker tag yourusername/scrum-poker:latest yourusername/scrum-poker:v1.0.0
docker push yourusername/scrum-poker:v1.0.0
```

## Available Dockerfiles

| Dockerfile | Purpose | Best For |
|------------|---------|----------|
| `Dockerfile` | Main Dockerfile | General deployment |
| `Dockerfile.render` | Render optimized | Render.com deployment |
| `Dockerfile.render.alternative` | Render alternative | Render fallback |
| `Dockerfile.railway` | Railway optimized | Railway.app deployment |

## Deployment Options

### 1. Deploy from Docker Hub to Any Platform

Once your image is on Docker Hub, you can deploy it to:

- **Render**: Use Docker deployment with your image
- **Railway**: Use Docker deployment with your image
- **Heroku**: Use Docker deployment with your image
- **AWS ECS**: Use your Docker Hub image
- **Google Cloud Run**: Use your Docker Hub image
- **Azure Container Instances**: Use your Docker Hub image

### 2. Local Deployment

```bash
# Pull and run your image
docker pull yourusername/scrum-poker:latest
docker run -p 5000:5000 -e PORT=5000 yourusername/scrum-poker:latest

# Run with custom port
docker run -p 3000:5000 -e PORT=5000 yourusername/scrum-poker:latest

# Run in background
docker run -d -p 5000:5000 -e PORT=5000 --name scrum-poker yourusername/scrum-poker:latest
```

### 3. Docker Compose Deployment

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  scrum-poker:
    image: yourusername/scrum-poker:latest
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - PORT=5000
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `5000` | Port for the application |

## Scripts Overview

### `push-to-dockerhub.sh` (Full Script)

**Features:**
- ✅ Comprehensive error handling
- ✅ Colored output
- ✅ Multiple Dockerfile support
- ✅ Tag management
- ✅ Usage examples
- ✅ Validation checks

**Usage:**
```bash
./push-to-dockerhub.sh -u yourusername -t v1.0.0 -f Dockerfile.render
```

### `dockerhub-push.sh` (Quick Script)

**Features:**
- ✅ Simple and fast
- ✅ Minimal configuration
- ✅ Quick deployment

**Usage:**
```bash
./dockerhub-push.sh yourusername latest Dockerfile.render
```

## Best Practices

### 1. Tag Management

```bash
# Use semantic versioning
docker tag yourusername/scrum-poker:latest yourusername/scrum-poker:v1.0.0
docker tag yourusername/scrum-poker:latest yourusername/scrum-poker:v1.0.1

# Use environment-specific tags
docker tag yourusername/scrum-poker:latest yourusername/scrum-poker:production
docker tag yourusername/scrum-poker:latest yourusername/scrum-poker:staging
```

### 2. Multi-Platform Builds

```bash
# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t yourusername/scrum-poker:latest --push .
```

### 3. Automated Builds

Set up automated builds on Docker Hub:

1. Go to Docker Hub → Create Repository
2. Connect your GitHub repository
3. Configure build rules
4. Enable automated builds

## Troubleshooting

### Common Issues:

1. **Authentication Failed**:
   ```bash
   docker login
   # Enter correct credentials
   ```

2. **Build Failures**:
   - Check Dockerfile path
   - Verify all files are committed
   - Check build logs

3. **Push Failures**:
   - Verify Docker Hub credentials
   - Check internet connection
   - Ensure repository exists

### Debug Commands:

```bash
# Check Docker info
docker info

# Check logged in user
docker system info | grep Username

# List local images
docker images

# Check image details
docker inspect yourusername/scrum-poker:latest
```

## Benefits of Docker Hub Deployment

✅ **Universal Deployment**: Works on any Docker-compatible platform  
✅ **Version Control**: Tag and manage different versions  
✅ **Easy Sharing**: Share your app with others  
✅ **CI/CD Integration**: Integrate with automated deployment pipelines  
✅ **Rollback Support**: Easy rollback to previous versions  
✅ **Multi-Platform**: Deploy to any cloud provider  

## Next Steps

1. **Push your image** to Docker Hub using the scripts
2. **Deploy to your preferred platform** using the Docker Hub image
3. **Set up automated builds** for continuous deployment
4. **Configure monitoring** and health checks
5. **Scale your application** as needed

Your Scrum Poker app will be available on Docker Hub and can be deployed anywhere Docker is supported!
