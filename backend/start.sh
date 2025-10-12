#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci

echo "Starting backend server on port ${PORT:-5000}..."
npm start
