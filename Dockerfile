# Multi-stage Dockerfile for Scrum Poker App
# Stage 1: Build the frontend React app
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy all frontend files (node_modules will be overwritten by the installed ones)
COPY frontend/ ./

# Build the frontend for production
RUN npm run build

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

# Copy Railway start script
COPY start-railway.sh ./
RUN chmod +x start-railway.sh

# Expose port (Railway will set PORT environment variable)
EXPOSE $PORT

# Health check (Railway will handle this via railway.json)
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Start the backend server (which now also serves the frontend)
CMD ["node", "server.js"]
