# Railway Deployment Guide

This guide will help you deploy your Scrum Poker application to Railway.

## Prerequisites

1. A GitHub account
2. Your code pushed to a GitHub repository
3. A Railway account (sign up at https://railway.app)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is pushed to GitHub with the following files:
- `Dockerfile` ✅
- `railway.json` ✅
- `package.json` ✅
- All source code ✅

### 2. Deploy to Railway

1. **Sign up/Login to Railway**
   - Go to https://railway.app
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your scrum-poker repository

3. **Configure Deployment**
   - Railway will automatically detect your `Dockerfile.railway`
   - The `railway.json` file will configure the deployment settings
   - Railway will assign a random port (use `PORT` environment variable)
   - The Railway-specific Dockerfile includes debug output to help troubleshoot build issues

4. **Set Environment Variables**
   In the Railway dashboard, go to Variables tab and add:
   ```
   NODE_ENV=production
   PORT=5000
   ```

5. **Deploy**
   - Railway will automatically build and deploy your application
   - You'll get a URL like: `https://your-app-name.railway.app`

### 3. Custom Domain (Optional)

1. In Railway dashboard, go to Settings
2. Click "Custom Domain"
3. Add your domain name
4. Railway will provide DNS instructions

## Environment Variables

Railway will automatically set:
- `PORT` - The port Railway assigns (usually 5000)
- `RAILWAY_PUBLIC_DOMAIN` - Your app's public URL

You can set these in Railway dashboard:
- `NODE_ENV=production`
- `DEBUG=false` (optional)

## Monitoring

Railway provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, and network usage
- **Health Checks**: Automatic health monitoring via `/health` endpoint

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check Railway logs for build errors
   - Ensure `Dockerfile` is in the root directory
   - Verify all dependencies are properly installed

2. **App Won't Start**
   - Check that `PORT` environment variable is set
   - Verify the start command in `railway.json`
   - Check application logs for runtime errors

3. **Health Check Fails**
   - Ensure `/health` endpoint is working
   - Check that the app is listening on the correct port

### Useful Commands:

```bash
# Check Railway CLI (optional)
npm install -g @railway/cli
railway login
railway status
```

## Cost

Railway offers:
- **Free Tier**: $5 credit monthly (usually enough for small apps)
- **Pro Plan**: $5/month for additional resources
- **Team Plan**: $20/month for team features

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Support: https://railway.app/support

## Next Steps

After deployment:
1. Test your application at the provided URL
2. Set up a custom domain if needed
3. Configure monitoring and alerts
4. Set up automatic deployments from your main branch
