#!/bin/bash

echo "🚀 Scrum Poker Deployment Script"
echo "================================"

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    exit 1
fi

echo "✅ Repository is ready for deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy backend to Render (see DEPLOYMENT.md)"
echo "3. Deploy frontend to Vercel (see DEPLOYMENT.md)"
echo "4. Update environment variables with deployed URLs"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
