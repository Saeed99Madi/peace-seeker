# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --no-audit --no-fund

# ---- build ------------------------------------------------------------------
FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json package.json package-lock.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

# Baked into the bundle at build time, so it must be the production API origin.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build --workspace @peace/shared \
 && npm run build --workspace @peace/web

# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S peace && adduser -S -G peace -h /app peace

# `output: 'standalone'` traces only the files actually reached at runtime, so
# the image carries neither the build toolchain nor the other workspace.
COPY --from=build --chown=peace:peace /app/apps/web/.next-build/standalone ./
COPY --from=build --chown=peace:peace /app/apps/web/.next-build/static ./apps/web/.next-build/static
COPY --from=build --chown=peace:peace /app/apps/web/public ./apps/web/public

USER peace
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/en').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/web/server.js"]
