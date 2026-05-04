# Frontend Dockerfile build stage
FROM node:18-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
COPY frontend/ ./
RUN npm run build

# Backend Dockerfile build stage
FROM node:18-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./
RUN npx prisma generate && npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Create uploads directory
RUN mkdir -p /app/uploads

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Create nextjs user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose ports
EXPOSE 3000 3001

# Health checks
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start both frontend and backend
CMD ["sh", "-c", "cd backend && npm run start:prod & cd frontend && npm run start"]