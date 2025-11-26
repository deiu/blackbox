# Multi-stage build for production deployment
FROM node:20-alpine AS client-builder

# Build the client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm i
COPY client/ ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm i --only=production

COPY server/ ./

# Copy built client files to be served by the server
COPY --from=client-builder /app/client/dist ./public

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
