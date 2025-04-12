FROM oven/bun:latest as base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY apps/server/package.json ./
COPY package.json bun.lockb ./
RUN bun install

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN adduser --system --uid 1001 bunjs
USER bunjs

COPY --from=builder --chown=bunjs:bunjs /app/apps/server ./apps/server
COPY --from=builder --chown=bunjs:bunjs /app/node_modules ./node_modules
COPY --from=builder --chown=bunjs:bunjs /app/package.json ./package.json

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["bun", "index.ts"] 