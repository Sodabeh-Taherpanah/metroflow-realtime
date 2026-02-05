FROM node:18-alpine AS builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init
RUN apk add --no-cache dumb-init

# Copy built app from builder
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY backend/package.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
