# syntax=docker/dockerfile:1

# All three CFC frontends, in ONE image.
#
# ## Why one image and not three
#
# `turbo run build` builds consumer, pro and admin in a single pass, and the
# three apps take the *same* NEXT_PUBLIC_* values (same API host, same map
# provider). So one build produces all three, and the compose file starts the
# same image three times with a different command. Three Dockerfiles would mean
# installing 614 MB of node_modules three times for no gain.
#
# ## Why the API URL is a build ARG and not an environment variable
#
# This is the single most confusing thing about deploying Next.js, so it is
# worth stating plainly: anything named NEXT_PUBLIC_* is **baked into the
# JavaScript at build time**, not read when the server starts. Setting
# NEXT_PUBLIC_API_URL in docker-compose `environment:` does nothing — the value
# has already been compiled into the files the browser downloads.
#
# Changing any of these means REBUILDING the image. There is no restart that
# will pick them up.
FROM node:22-alpine

# Pinned to the version that actually wrote pnpm-lock.yaml. Note that
# package.json says `packageManager: pnpm@11.25.0`, which does not match what
# is installed locally (10.20.0) — the lockfile is v9 and 10.x reads it.
RUN npm install -g pnpm@10.20.0

WORKDIR /app

# Workspace manifests first so a source edit does not reinstall everything.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/consumer/package.json ./apps/consumer/
COPY apps/pro/package.json ./apps/pro/
COPY apps/admin/package.json ./apps/admin/
COPY packages/config/package.json ./packages/config/
COPY packages/mocks/package.json ./packages/mocks/
COPY packages/tokens/package.json ./packages/tokens/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

RUN pnpm install --frozen-lockfile

COPY . .

# ---------------------------------------------------------------------------
# Build-time configuration. Every one of these is compiled into the bundle.
# ---------------------------------------------------------------------------

# Where the browser reaches the API. In production this is your own domain
# (https://api.example.com/api) — NOT localhost, which would mean "the
# visitor's own computer" once the page is loaded on somebody's phone.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api

# `*` turns on every live endpoint. This is exactly equivalent to the long
# comma-separated list in the .env.local files — all 134 isLive()-gated
# functions are named in it, so there is nothing left on fixtures.
ARG NEXT_PUBLIC_LIVE_APIS=*

# `osm` (free, no key) or `google` (needs an activated billing account).
ARG NEXT_PUBLIC_MAP_PROVIDER=osm
ARG NEXT_PUBLIC_GEOAPIFY_API_KEY=
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_LIVE_APIS=$NEXT_PUBLIC_LIVE_APIS \
    NEXT_PUBLIC_MAP_PROVIDER=$NEXT_PUBLIC_MAP_PROVIDER \
    NEXT_PUBLIC_GEOAPIFY_API_KEY=$NEXT_PUBLIC_GEOAPIFY_API_KEY \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_TELEMETRY_DISABLED=1

# Building three Next apps at once needs roughly 4 GB of RAM. On a 2 GB VPS
# this step is killed with no useful message ("exit code 137" = out of
# memory). DEPLOY.md explains the two ways around that.
RUN pnpm build

ENV NODE_ENV=production

# API_URL is runtime, not build-time: it is only used by the /uploads rewrite
# in next.config.js, which runs on the server. Compose sets it.
ENV API_URL=http://api:4000

# Overridden per container in docker-compose.yml:
#   pnpm --filter @cfc/consumer start   (3000)
#   pnpm --filter @cfc/pro      start   (3001)
#   pnpm --filter @cfc/admin    start   (3002)
CMD ["pnpm", "--filter", "@cfc/consumer", "start"]
