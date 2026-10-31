# Stage 1: Build & Production Environment
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install curl/wget for healthchecks
RUN apk --no-cache add curl

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies cleanly
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY server/ ./server/
COPY public/ ./public/

# Ensure write permissions for persistent data storage
RUN mkdir -p /app/server/data && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose server port
EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server/server.js"]
