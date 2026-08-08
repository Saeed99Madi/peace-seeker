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
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json package.json package-lock.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @peace/shared \
 && npx prisma generate --schema apps/api/prisma/schema \
 && npm run build --workspace @peace/api \
 && npm prune --omit=dev

# ---- runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production

# S-3 — the metadata stripper shells out to ffmpeg for audio and video. Without
# it in the image, every recording upload is refused (the stripper fails closed
# by design), so it is a runtime dependency and not an optional extra.
RUN apk add --no-cache ffmpeg tini \
 && addgroup -S peace && adduser -S -G peace -h /app peace

COPY --from=build --chown=peace:peace /app/node_modules ./node_modules
COPY --from=build --chown=peace:peace /app/packages/shared/dist ./packages/shared/dist
COPY --from=build --chown=peace:peace /app/packages/shared/package.json ./packages/shared/
COPY --from=build --chown=peace:peace /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=peace:peace /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=peace:peace /app/apps/api/package.json ./apps/api/

USER peace
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# tini reaps the ffmpeg children the stripper spawns, so they cannot accumulate
# as zombies over the life of the container.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/main.js"]
