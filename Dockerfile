# Build AWS's adapter from pinned source to avoid anonymous public ECR pull limits.
# The builder and runtime both use Debian bookworm for libc compatibility.
FROM rust:1-bookworm AS lambda-adapter
WORKDIR /build/adapter
RUN curl --fail --location --retry 5 --retry-all-errors \
      https://codeload.github.com/aws/aws-lambda-web-adapter/tar.gz/596bdbcea78a89084fd0b522807d04cd2f1f3f7e \
      --output /tmp/adapter.tar.gz \
    && echo '41e437baff00539d5cd4bf6c7a9f9f6106386b9cf5461c38c19b969b94b568ea  /tmp/adapter.tar.gz' | sha256sum --check - \
    && tar -xzf /tmp/adapter.tar.gz --strip-components=1 \
    && cargo build --locked --release --bin lambda-adapter

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
# Bridges Lambda invocation events to the existing Fastify HTTP server.
COPY --from=lambda-adapter /build/adapter/target/release/lambda-adapter /opt/extensions/lambda-adapter
ENV NODE_ENV=production PORT=8000 STATIC_ROOT=/app/public REDIS_URL=""
ENV AWS_LWA_PORT=8000 AWS_LWA_READINESS_CHECK_PATH=/health AWS_LWA_READINESS_CHECK_HEALTHY_STATUS=200
WORKDIR /app
COPY --from=backend --chown=node:node /build/backend/package*.json ./
COPY --from=backend --chown=node:node /build/backend/node_modules ./node_modules
COPY --from=backend --chown=node:node /build/backend/dist ./dist
COPY --from=frontend --chown=node:node /build/frontend/dist ./public
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/server.js"]
