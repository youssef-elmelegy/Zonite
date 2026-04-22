FROM node:22-alpine AS dev
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /workspace
EXPOSE 5173
CMD ["sh", "-c", "pnpm install --frozen-lockfile && pnpm --filter @zonite/frontend dev"]
