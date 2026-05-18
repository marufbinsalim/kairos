FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/types ./packages/types
COPY packages/crypto ./packages/crypto
COPY packages/db ./packages/db
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @kairos/types build
RUN pnpm --filter @kairos/db build
RUN pnpm --filter @kairos/api build

FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

RUN npm install -g pnpm

COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/tsconfig.base.json ./

RUN pnpm install --prod --no-frozen-lockfile

USER nestjs

EXPOSE 3001

CMD ["sh", "-c", "node /app/apps/api/dist/migrate-runner.js && node /app/apps/api/dist/main.js"]
