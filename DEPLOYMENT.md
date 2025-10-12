# 🚀 Deployment Guide - Scrum Poker App

This guide will help you deploy the Scrum Poker application to free hosting services.

## 📋 Prerequisites

- GitHub account
- Netlify account (free) or GitHub account
- Railway account (free) or Render account (free)

## 🎯 Deployment Strategy

### Option 1: All-in-One Railway (Recommended for Simplicity)
- **Frontend + Backend**: Railway (Full-stack deployment)

### Option 2: Separate Services
- **Frontend**: Netlify, GitHub Pages, or Surge.sh (React app)
- **Backend**: Railway or Render (Node.js + Socket.IO)

## 🔧 Step 1: Prepare Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## 🚀 Step 2: Deploy to Railway

### Option A: All-in-One Railway Deployment (Recommended)

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Add Two Services**:
   
   **Service 1 - Backend:**
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (auto-detects Node.js)
   - **Start Command**: `./start.sh` (or leave empty)
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=5000`
   
   **Service 2 - Frontend:**
   - **Root Directory**: `frontend`
   - **Build Command**: Leave empty (auto-detects)
   - **Start Command**: Leave empty (auto-detects)
   - **Environment Variables**:
     - `REACT_APP_API_URL=https://your-backend-service.railway.app`
     - `PORT=3000`
   
6. **Configuration files are already included**:
   - `start.sh` - Start script for both frontend and backend services
   - `nixpacks.toml` - Railway's preferred build configuration
   - `Procfile` - Alternative deployment method
   - `Dockerfile` - Docker configuration fallback
   - `serve` package already added to frontend dependencies

### Option B: Separate Backend Deployment

If you prefer to deploy backend separately:

1. **Go to [Railway.app](https://railway.app)**
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
   - `REACT_APP_API_URL=https://your-backend-url.railway.app` (or .render.com)
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
   - Value: `https://your-backend-url.railway.app`

### Option C: Surge.sh

1. **Install Surge globally**: `npm install -g surge`
2. **Build your app**: `cd frontend && npm run build`
3. **Deploy**: `surge build/ your-app-name.surge.sh`
4. **Set environment variable**: Create `frontend/.env.production`:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
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

4. **Railway Build Issues**:
   - If you get "Script start.sh not found" error, Railway will now use Dockerfile instead
   - If Railpack can't determine how to build, Dockerfile provides explicit build steps
   - Make sure PORT environment variable is set correctly
   - Docker approach is more reliable than shell scripts

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

### Railway:
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
- Backend: `https://scrum-poker-backend.railway.app`

## 💰 Cost Breakdown

### Option 1: All-in-One Railway (Recommended)
- **Railway**: $0/month (free $5 credit covers both services)
- **Total**: **Completely free!**

### Option 2: Separate Services
- **Frontend**: $0/month (Netlify/GitHub Pages/Surge.sh)
- **Backend**: $0/month (Railway free credit)
- **Total**: **Completely free!**

## 🔄 Updates

To update your deployed app:
1. Push changes to GitHub
2. Both your frontend and backend services will automatically redeploy
3. No manual intervention needed!
