#!/bin/bash

echo "🎯 Starting Scrum Poker Application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""
echo "🚀 Starting the application..."
echo "   Backend will run on: http://localhost:5000"
echo "   Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start both backend and frontend
npm run dev
