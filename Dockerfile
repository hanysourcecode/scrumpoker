# Multi-stage Dockerfile for Scrum Poker App
# Stage 1: Build the frontend React app
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy entire project structure
COPY . .

# Change to frontend directory
WORKDIR /app/frontend

# Install frontend dependencies
RUN npm install --no-audit --no-fund

# Build the frontend for production
RUN npx react-scripts build

# Stage 2: Build the backend and serve both frontend and backend
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY backend/ ./

# Copy the built frontend from the previous stage
COPY --from=frontend-builder /app/frontend/build ./public

# Copy start script
COPY start-server.sh ./
RUN chmod +x start-server.sh

# Expose port (will be set by deployment platform)
EXPOSE $PORT

# Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Start the backend server (which now also serves the frontend)
CMD ["node", "server.js"]
