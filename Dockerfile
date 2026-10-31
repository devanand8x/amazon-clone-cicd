FROM node:latest

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy application files
COPY server/ ./server/
COPY public/ ./public/

# Data directory permissions
RUN mkdir -p /app/server/data && chown -R node:node /app

USER node

EXPOSE 5000

CMD ["node", "server/server.js"]
