# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY .env.example ./.env

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Build backend
RUN cd backend && npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy node_modules and built code from builder
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY backend/package*.json ./backend/

# Create persistent directories
RUN mkdir -p backend/uploads backend/cache

# Environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

WORKDIR /app/backend

# Run migrations and start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
