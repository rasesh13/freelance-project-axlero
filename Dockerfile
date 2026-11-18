# ==============================================================================
# WORKVERSE PLATFORM — PRODUCTION MULTI-STAGE DOCKERFILE
# ==============================================================================

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install backend dependencies
COPY backend/package.json ./backend/
RUN cd backend && npm install --omit=dev

# Copy backend application source
COPY backend/ ./backend/

# Copy compiled frontend distribution
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose backend REST API port
EXPOSE 5000

# Healthcheck probe against SQLite WAL backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "backend/server.js"]
