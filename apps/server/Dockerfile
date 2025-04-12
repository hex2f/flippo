FROM oven/bun:1 as base

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY bun.lockb ./

# Install dependencies
RUN bun install --production

# Build the app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Don't run as root
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 bunuser

# Copy only necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/node_modules ./node_modules

# Make all files accessible to non-root user
RUN chown -R bunuser:bunjs /app

WORKDIR /app/apps/server
USER bunuser

EXPOSE 3001

CMD ["bun", "index.ts"] 