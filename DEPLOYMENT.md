# 🚀 Deployment Guide - Scrum Poker App

This guide will help you deploy the Scrum Poker application to free hosting services.

## 📋 Prerequisites

- GitHub account
- Render account (free) or Docker Hub account

## 🎯 Deployment Strategy

### Option 1: Full-Stack Deployment (Recommended)
- **Frontend + Backend**: Render (Full-stack deployment with Docker)

### Option 2: Docker Hub Deployment
- **Frontend + Backend**: Docker Hub (Universal deployment)

### Option 3: Separate Services
- **Frontend**: Netlify, Vercel, or GitHub Pages (React app)
- **Backend**: Render or Heroku (Node.js + Socket.IO)

## 🔧 Step 1: Prepare Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## 🚀 Step 2: Deploy to Cloud Platform

Choose one of the following deployment options:

### Option 0: Automated CI/CD with GitHub Actions

Use GitHub Actions to automatically build and publish Docker images:

**Features:**
- ✅ **Automatic Builds**: Triggers on push, PR, and tags
- ✅ **Multi-Platform**: Supports linux/amd64 and linux/arm64
- ✅ **Security Scanning**: Vulnerability scanning with Trivy
- ✅ **Version Management**: Automatic tagging based on git tags
- ✅ **GHCR Integration**: Publishes to GitHub Container Registry

**Setup:**
1. Push your code to GitHub
2. Workflows automatically trigger
3. Images published to `ghcr.io/your-username/scrum-poker`

### Option 1: Manual Docker Hub Deployment

Push your app to Docker Hub for universal deployment:

```bash
# Quick deployment
./dockerhub-push.sh yourusername

# Full deployment with options
./push-to-dockerhub.sh -u yourusername -t v1.0.0 -f Dockerfile.render
```

**Benefits:**
- ✅ **Universal**: Deploy anywhere Docker is supported
- ✅ **Version Control**: Tag and manage different versions
- ✅ **Easy Sharing**: Share your app with others
- ✅ **CI/CD Ready**: Integrate with automated pipelines

### Option 2: Deploy to Cloud Platforms

Choose one of the following platforms:

### Option A: Deploy to Render (Recommended)

Render offers excellent Docker support with a generous free tier:

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Click "New +" → "Web Service"**
4. **Connect your GitHub repository**
5. **Configure the Service**:
   - **Name**: `scrum-poker-app`
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile.render`
   - **Plan**: `Free`
6. **Environment Variables**:
   - `NODE_ENV=production`
   - `PORT=10000`
7. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: `Yes`
8. **Deploy**: Render will build and deploy automatically
9. **Get your app URL**: Render will provide a URL like `https://your-app-name.onrender.com`

**Render Benefits:**
- ✅ **Free Tier**: 15min sleep, 512MB RAM
- ✅ **Docker Support**: Full Docker container support
- ✅ **Auto-Deploy**: Automatic deployments on git push
- ✅ **Health Monitoring**: Built-in health checks
- ✅ **Custom Domains**: Easy custom domain setup
- ✅ **WebSocket Support**: Full WebSocket support for Socket.io

- ✅ Custom domain support
- ✅ Built-in monitoring

### Option B: Backend Only (For separate frontend deployment)

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Configure Backend Service**:
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (auto-detects Node.js)
   - **Start Command**: `./start.sh` (or leave empty)
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=5000`
   
6. **Get Backend URL**:
   - Copy the backend URL (e.g., `https://scrumpoker-production-xxxx.up.render.com`)
   - You'll need this for the frontend configuration

## 🌐 Step 3: Deploy Frontend to Netlify

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up with GitHub**
3. **Click "New site from Git"**
4. **Choose GitHub and select your repository**
5. **Configure the deployment**:
   - **Base directory**: `frontend` (or leave empty if using netlify.toml)
   - **Build command**: `cd frontend && npm install && npm run build` (or leave empty if using netlify.toml)
   - **Publish directory**: `frontend/build` (or leave empty if using netlify.toml)
6. **Add Environment Variables**:
   - `REACT_APP_API_URL` = `https://your-backend-url.render.com`
7. **Click "Deploy site"**

### Option B: Separate Backend Deployment

If you prefer to deploy backend separately:

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Configure the deployment**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. **Add Environment Variables**:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend-url.netlify.app`

## 🌐 Step 3: Deploy Frontend

### Option A: Netlify (Recommended)

1. **Go to [Netlify.com](https://netlify.com)**
2. **Sign up with GitHub**
3. **Click "New site from Git"**
4. **Choose GitHub and select your repository**
5. **Configure**:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
6. **Add Environment Variables**:
   - `REACT_APP_API_URL=https://your-backend-url.render.com` (or .render.com)
7. **Click "Deploy site"**

### Option B: GitHub Pages

1. **Go to your GitHub repository**
2. **Click "Settings" → "Pages"**
3. **Source**: "GitHub Actions"
4. **Create `.github/workflows/deploy.yml`**:
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [ main ]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Install dependencies
           run: |
             cd frontend
             npm install
         - name: Build
           run: |
             cd frontend
             npm run build
           env:
             REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
         - name: Deploy
           uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./frontend/build
   ```
5. **Add secret**: Go to Settings → Secrets → Actions → New repository secret
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend-url.render.com`

### Option C: Surge.sh

1. **Install Surge globally**: `npm install -g surge`
2. **Build your app**: `cd frontend && npm run build`
3. **Deploy**: `surge build/ your-app-name.surge.sh`
4. **Set environment variable**: Create `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.render.com
   ```

## 🔄 Step 4: Update URLs

After both deployments:

1. **Update Backend CORS**:
   - Go to your backend deployment settings
   - Update `FRONTEND_URL` to your Vercel URL

2. **Update Frontend API URL**:
   - **Netlify**: Go to Site settings → Environment variables
   - **GitHub Pages**: Update the secret in repository settings
   - **Surge.sh**: Update `.env.production` file and redeploy

## 🧪 Step 5: Test Deployment

1. **Visit your deployed frontend URL**
2. **Create a room**
3. **Test real-time features**:
   - Join room from another browser/device
   - Cast votes
   - Reveal votes
   - Test all features

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Ensure `FRONTEND_URL` is set correctly in backend
   - Check that the frontend URL is in the CORS origins list

2. **Socket.IO Connection Issues**:
   - Verify backend URL is correct in frontend
   - Check that both services are running

3. **Environment Variables**:
   - Make sure all environment variables are set
   - Redeploy after changing environment variables

4. **Render Build Issues**:
   - If you get "Script start.sh not found" error, Render will now use package.json scripts
   - If Railpack can't determine how to build, package.json provides explicit scripts
   - Make sure PORT environment variable is set correctly
   - Package.json approach is Render's most reliable method

5. **Netlify Build Issues**:
   - If you get "No url found for submodule" error, use the netlify.toml configuration
   - Make sure to set the correct base directory as `frontend`
   - Use the build command: `cd frontend && npm install && npm run build`
   - Ensure REACT_APP_API_URL environment variable is set correctly

## 📊 Free Tier Limits

### Netlify:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Perfect for React apps
- ✅ Custom domains

### GitHub Pages:
- ✅ Unlimited deployments
- ✅ 1GB storage
- ✅ Perfect for static sites
- ✅ Custom domains

### Surge.sh:
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ Simple command-line deployment

### Render:
- ✅ $5 credit monthly (usually enough for small apps)
- ✅ Automatic deployments
- ✅ Custom domains

### Render:
- ✅ 750 hours/month free
- ✅ Automatic deployments
- ✅ Custom domains

## 🎉 Success!

Your Scrum Poker app should now be live and accessible to anyone on the internet!

**Example URLs**:
- Frontend: `https://scrum-poker-app.netlify.app` or `https://username.github.io/scrum-poker`
- Backend: `https://scrum-poker-backend.render.com`

## 💰 Cost Breakdown

### Option 1: Hybrid Approach (Recommended)
- **Netlify**: $0/month (completely free)
- **Render**: $0/month (free $5 credit)
- **Total**: **Completely free!**

### Option 2: All-in-One Render
- **Render**: $0/month (free $5 credit covers both services)
- **Total**: **Completely free!**

### Option 3: Separate Services
- **Frontend**: $0/month (GitHub Pages/Surge.sh)
- **Backend**: $0/month (Render free credit)
- **Total**: **Completely free!**

## 🔄 Updates

To update your deployed app:
1. Push changes to GitHub
2. Both your frontend and backend services will automatically redeploy
3. No manual intervention needed!
