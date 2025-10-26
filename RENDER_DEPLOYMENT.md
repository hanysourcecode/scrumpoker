# Deploy Scrum Poker App to Render

This guide will help you deploy your full-stack Scrum Poker application to Render, a modern cloud platform that makes it easy to deploy and scale applications.

## Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- Docker knowledge (optional, but helpful)

## Render Deployment Options

### Option 1: Docker Deployment (Recommended)

Render supports Docker deployments, which is perfect for our multi-stage Dockerfile.

#### Step 1: Prepare Your Repository

1. **Ensure all files are committed**:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Verify these files exist**:
   - `Dockerfile.render` - Render-optimized Dockerfile
   - `start-render.sh` - Render start script
   - `render.yaml` - Render configuration (optional)

#### Step 2: Deploy to Render

1. **Go to Render Dashboard**:
   - Visit [render.com](https://render.com)
   - Sign up/Login with GitHub

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your scrum-poker repository

3. **Configure the Service**:
   - **Name**: `scrum-poker-app` (or your preferred name)
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.render` (or `Dockerfile.render.alternative` if you encounter build issues)
   - **Plan**: `Free` (or upgrade as needed)

4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   ```

5. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes` (deploys on git push)

6. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy your app

### Option 2: Native Deployment (Alternative)

If you prefer not to use Docker, you can deploy the backend directly:

#### Step 1: Deploy Backend

1. **Create New Web Service**:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Environment**: `Node`

2. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   ```

#### Step 2: Deploy Frontend (Static Site)

1. **Create New Static Site**:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

2. **Configure Backend URL**:
   - Update frontend to use your Render backend URL
   - Update CORS settings in backend

## Configuration Files

### Dockerfile.render
```dockerfile
# Render-optimized Dockerfile for Scrum Poker App
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/ ./
RUN npm ci
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
COPY --from=frontend-builder /app/build ./public
COPY start-render.sh ./
RUN chmod +x start-render.sh
EXPOSE $PORT
CMD ["./start-render.sh"]
```

### render.yaml (Optional)
```yaml
services:
  - type: web
    name: scrum-poker-app
    env: docker
    dockerfilePath: ./Dockerfile.render
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /health
    autoDeploy: true
```

## Environment Variables

Set these in your Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `10000` | Port for the application |

## Health Check

Your app includes a health check endpoint at `/health` that returns:
```json
{
  "status": "OK",
  "timestamp": "2025-10-14T16:00:00.000Z",
  "rooms": 0,
  "users": 0
}
```

## Monitoring and Logs

1. **View Logs**:
   - Go to your service dashboard
   - Click "Logs" tab
   - Monitor real-time logs

2. **Health Monitoring**:
   - Render automatically monitors `/health` endpoint
   - Service will restart if health checks fail

## Custom Domain (Optional)

1. **Add Custom Domain**:
   - Go to service settings
   - Click "Custom Domains"
   - Add your domain
   - Configure DNS as instructed

## Scaling

### Free Tier Limitations:
- **Sleep after 15 minutes** of inactivity
- **512MB RAM**
- **0.1 CPU**

### Paid Plans:
- **Starter**: $7/month - Always on, 512MB RAM
- **Standard**: $25/month - 1GB RAM, better performance

## Troubleshooting

### Common Issues:

1. **Build Failures - "Could not find a required file. Name: index.html"**:
   - **Solution 1**: Use `Dockerfile.render.alternative` instead of `Dockerfile.render`
   - **Solution 2**: Ensure all files are committed to your repository
   - **Solution 3**: Check that the `frontend/public/index.html` file exists

2. **Build Failures - General**:
   - Check Dockerfile path is correct
   - Verify all files are committed
   - Check build logs for specific errors

3. **Health Check Failures**:
   - Ensure `/health` endpoint is working
   - Check if server is starting correctly
   - Verify PORT environment variable

4. **Socket.io Issues**:
   - Render handles WebSocket connections well
   - No additional configuration needed

### Alternative Dockerfiles:

If you encounter build issues, try these alternative approaches:

1. **Dockerfile.render.alternative**: More explicit file copying
2. **Dockerfile.railway**: Railway-optimized version (may work on Render)
3. **Dockerfile**: Main Dockerfile (fallback option)

### Debug Steps:

1. **Check Logs**:
   ```bash
   # View service logs in Render dashboard
   ```

2. **Test Locally**:
   ```bash
   # Test with Render environment
   PORT=10000 NODE_ENV=production node server.js
   ```

3. **Verify Health Endpoint**:
   ```bash
   curl https://your-app.onrender.com/health
   ```

## Benefits of Render

✅ **Easy Deployment**: Simple Git-based deployment  
✅ **Free Tier**: Generous free tier for development  
✅ **Docker Support**: Full Docker container support  
✅ **Auto-Deploy**: Automatic deployments on git push  
✅ **Health Monitoring**: Built-in health checks  
✅ **Custom Domains**: Easy custom domain setup  
✅ **SSL/HTTPS**: Automatic SSL certificates  
✅ **WebSocket Support**: Full WebSocket support for Socket.io  

## Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Render** | 15min sleep, 512MB RAM | $7/month starter |
| **Railway** | $5 credit/month | Pay-per-use |
| **Heroku** | No free tier | $7/month basic |

## Next Steps

1. **Deploy to Render** using the steps above
2. **Test your deployment** thoroughly
3. **Set up monitoring** and alerts
4. **Configure custom domain** if needed
5. **Scale up** when ready for production

Your Scrum Poker app will be live on Render with automatic deployments, health monitoring, and easy scaling options!
