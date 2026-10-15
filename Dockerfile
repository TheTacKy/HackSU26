FROM node:24-bookworm-slim AS frontend
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:24-bookworm-slim AS backend
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8000 STATIC_ROOT=/app/public REDIS_URL=""
WORKDIR /app
COPY --from=backend --chown=node:node /build/backend/package*.json ./
COPY --from=backend --chown=node:node /build/backend/node_modules ./node_modules
COPY --from=backend --chown=node:node /build/backend/dist ./dist
COPY --from=frontend --chown=node:node /build/frontend/dist ./public
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
