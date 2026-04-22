FROM node:22-alpine AS dev
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /workspace
# Install deps from the repo root (monorepo context).
# docker-compose mounts the repo, so we don't COPY source here.
EXPOSE 3000
ENV CHOKIDAR_USEPOLLING=true
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm --filter @zonite/shared build && pnpm --filter @zonite/backend start:dev"]
