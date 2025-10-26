# GitHub Actions CI/CD Pipeline

This document describes the GitHub Actions workflows for building and publishing Docker images to GitHub Container Registry (GHCR).

## Available Workflows

### 1. Simple Pipeline (`docker-simple.yml`)
**Purpose**: Basic Docker build and push for the main Dockerfile

**Triggers**:
- Push to `main` branch
- Git tags starting with `v` (e.g., `v1.0.0`)
- Manual trigger via `workflow_dispatch`

**Features**:
- ✅ Builds single Docker image
- ✅ Pushes to GHCR
- ✅ Multi-platform support (linux/amd64, linux/arm64)
- ✅ Build caching
- ✅ Automatic tagging
- ✅ Summary output

### 2. Multi-Build Pipeline (`docker-multi-build.yml`)
**Purpose**: Builds multiple Docker images for different deployment targets

**Triggers**:
- Push to `main` or `develop` branches
- Git tags starting with `v`
- Pull requests to `main`
- Manual trigger with options

**Features**:
- ✅ Builds all Dockerfiles:
  - `Dockerfile` (main)
  - `Dockerfile.render` (Render optimized)
  - `Dockerfile.render.alternative` (Render fallback)
- ✅ Security scanning with Trivy
- ✅ Automatic releases on tags
- ✅ Artifact attestation
- ✅ Manual workflow with options

### 3. Advanced Pipeline (`docker-publish.yml`)
**Purpose**: Comprehensive pipeline with security scanning and notifications

**Triggers**:
- Push to `main` or `develop` branches
- Git tags starting with `v`
- Pull requests to `main`
- Manual trigger

**Features**:
- ✅ Single Dockerfile build
- ✅ Security vulnerability scanning
- ✅ Build provenance attestation
- ✅ Notifications
- ✅ SARIF upload for security tab

## Image Tags

The pipelines automatically create the following tags:

| Tag Pattern | Description | Example |
|-------------|-------------|---------|
| `latest` | Latest from main branch | `ghcr.io/username/scrum-poker:latest` |
| `main` | Branch name | `ghcr.io/username/scrum-poker:main` |
| `v1.0.0` | Semantic version | `ghcr.io/username/scrum-poker:v1.0.0` |
| `v1.0` | Major.minor version | `ghcr.io/username/scrum-poker:v1.0` |
| `develop` | Develop branch | `ghcr.io/username/scrum-poker:develop` |

## Usage

### Pull and Run Images

```bash
# Pull the latest image
docker pull ghcr.io/your-username/scrum-poker:latest

# Run the application
docker run -p 5000:5000 -e PORT=5000 ghcr.io/your-username/scrum-poker:latest

# Run with custom port
docker run -p 3000:5000 -e PORT=5000 ghcr.io/your-username/scrum-poker:latest

# Run in background
docker run -d -p 5000:5000 -e PORT=5000 --name scrum-poker ghcr.io/your-username/scrum-poker:latest
```

### Using Different Variants

```bash
# Render optimized
docker pull ghcr.io/your-username/scrum-poker-render:latest

# Render alternative
docker pull ghcr.io/your-username/scrum-poker-render-alt:latest
```

## Setup Instructions

### 1. Enable GitHub Container Registry

1. Go to your repository settings
2. Navigate to "Actions" → "General"
3. Under "Workflow permissions", select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"

### 2. Configure Package Visibility

1. Go to your repository's packages
2. Click on the package name
3. Go to "Package settings"
4. Change visibility to "Public" or "Private" as needed

### 3. Set Up Secrets (if needed)

The workflows use `GITHUB_TOKEN` which is automatically provided. No additional secrets are required for basic functionality.

## Workflow Configuration

### Manual Trigger Options

The `docker-multi-build.yml` workflow supports manual triggers with options:

- **Dockerfile**: Choose which Dockerfile to build
- **Push**: Whether to push to registry or just build locally

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REGISTRY` | Container registry URL | `ghcr.io` |
| `IMAGE_NAME` | Image name | `${{ github.repository }}` |

## Security Features

### Vulnerability Scanning
- Uses Trivy to scan images for vulnerabilities
- Results uploaded to GitHub Security tab
- Scans run on main branch pushes

### Build Provenance
- Generates build attestations
- Links builds to source code
- Provides tamper-proof build records

### Multi-Platform Support
- Builds for `linux/amd64` and `linux/arm64`
- Ensures compatibility across different architectures

## Monitoring and Notifications

### Workflow Status
- Check workflow runs in the "Actions" tab
- View build logs and artifacts
- Monitor security scan results

### Release Management
- Automatic releases created on version tags
- Release notes include usage instructions
- Links to security scan results

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure repository has write permissions for packages
   - Check that `GITHUB_TOKEN` has necessary permissions

2. **Build Failures**
   - Check Dockerfile syntax
   - Verify all required files are present
   - Review build logs for specific errors

3. **Push Failures**
   - Ensure package visibility is set correctly
   - Check if package name conflicts exist
   - Verify authentication is working

### Debug Steps

1. **Check Workflow Logs**
   ```bash
   # View workflow runs
   gh run list --repo your-username/scrum-poker
   
   # View specific run logs
   gh run view <run-id> --log
   ```

2. **Test Locally**
   ```bash
   # Test Docker build locally
   docker build -t scrum-poker-test .
   
   # Test with specific Dockerfile
   docker build -f Dockerfile.render -t scrum-poker-render-test .
   ```

3. **Verify Registry Access**
   ```bash
   # Login to GHCR
   echo $GITHUB_TOKEN | docker login ghcr.io -u your-username --password-stdin
   
   # Test pull
   docker pull ghcr.io/your-username/scrum-poker:latest
   ```

## Best Practices

### 1. Use Semantic Versioning
```bash
# Create a new release
git tag v1.0.0
git push origin v1.0.0
```

### 2. Test Before Release
- Use `develop` branch for testing
- Create pull requests for changes
- Test images locally before pushing

### 3. Monitor Security
- Regularly check security scan results
- Update base images when vulnerabilities are found
- Review and address security alerts

### 4. Optimize Builds
- Use `.dockerignore` to exclude unnecessary files
- Leverage build caching
- Use multi-stage builds for smaller images

## Advanced Configuration

### Custom Registry
To use a different registry, update the `REGISTRY` environment variable:

```yaml
env:
  REGISTRY: your-registry.com
  IMAGE_NAME: your-org/scrum-poker
```

### Additional Platforms
To support more platforms, update the `platforms` setting:

```yaml
platforms: linux/amd64,linux/arm64,linux/arm/v7
```

### Custom Tags
To add custom tags, modify the metadata action:

```yaml
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=raw,value=stable
  type=raw,value=production,enable={{is_default_branch}}
```

This comprehensive CI/CD setup ensures reliable, secure, and automated Docker image builds for your Scrum Poker application!
