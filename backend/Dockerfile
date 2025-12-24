# ===========================================
# MomX Backend Dockerfile
# Node.js API Server
# ===========================================

# Use Node 20 LTS Alpine for smaller image
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ===========================================
# Dependencies Stage
# ===========================================
FROM base AS deps

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# ===========================================
# Builder Stage (for development)
# ===========================================
FROM base AS builder

COPY package*.json ./
RUN npm ci

COPY . .

# ===========================================
# Production Stage
# ===========================================
FROM base AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Set environment
ENV NODE_ENV=production
ENV PORT=4455

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 4455

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q --spider http://localhost:4455/health || exit 1

# Start application
CMD ["node", "src/index.js"]

# ===========================================
# Development Stage
# ===========================================
FROM base AS development

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
ENV PORT=4455

EXPOSE 4455

# Use nodemon for hot reload in development
CMD ["npm", "run", "dev"]
