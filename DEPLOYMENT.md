# 🚀 Deployment Guide - Scrum Poker App

This guide will help you deploy the Scrum Poker application to free hosting services.

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Railway account (free) or Render account (free)

## 🎯 Deployment Strategy

- **Frontend**: Vercel (React app)
- **Backend**: Railway or Render (Node.js + Socket.IO)

## 🔧 Step 1: Prepare Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## 🖥️ Step 2: Deploy Backend (Railway)

### Option A: Railway (Recommended)

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
   - `FRONTEND_URL=https://your-frontend-url.vercel.app` (update after frontend deployment)

### Option B: Render

1. **Go to [Render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Click "New" → "Web Service"**
4. **Connect your repository**
5. **Configure**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
6. **Add Environment Variables**:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend-url.vercel.app`

## 🌐 Step 3: Deploy Frontend (Vercel)

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up with GitHub**
3. **Click "New Project"**
4. **Import your repository**
5. **Configure**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Create React App`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. **Add Environment Variables**:
   - `REACT_APP_API_URL=https://your-backend-url.railway.app` (or .render.com)

## 🔄 Step 4: Update URLs

After both deployments:

1. **Update Backend CORS**:
   - Go to your backend deployment settings
   - Update `FRONTEND_URL` to your Vercel URL

2. **Update Frontend API URL**:
   - Go to your Vercel project settings
   - Update `REACT_APP_API_URL` to your backend URL

## 🧪 Step 5: Test Deployment

1. **Visit your Vercel URL**
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

## 📊 Free Tier Limits

### Vercel:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Perfect for React apps

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
- Frontend: `https://scrum-poker-app.vercel.app`
- Backend: `https://scrum-poker-backend.railway.app`

## 🔄 Updates

To update your deployed app:
1. Push changes to GitHub
2. Both Vercel and Railway will automatically redeploy
3. No manual intervention needed!
