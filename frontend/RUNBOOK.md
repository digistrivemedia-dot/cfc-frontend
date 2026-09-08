
# CFC Frontend Runbook

This monorepo uses [Turborepo](https://turbo.build/) to manage multiple Next.js apps (`consumer`, `admin`, `pro`) and shared packages (`ui`, `types`, `tokens`, `mocks`).

All commands should be run from the root directory (`c:\Users\muska\Downloads\cfc\frontend`).

## Running the Servers (Development)

You can run the apps individually or all at once.

**To run only the Consumer app:**
```bash
pnpm dev:consumer
```
*(Runs on `http://localhost:3000`)*

**To run only the Admin app:**
```bash
pnpm dev:admin
```
*(Runs on `http://localhost:3002`)*

**To run only the Pro app (when built):**
```bash
pnpm dev:pro
```

**To run ALL apps simultaneously:**
```bash
pnpm dev
```
*(Turborepo will start all three development servers in parallel)*

## Code Quality & Verification

Before considering a feature complete, run typechecking and linting. You can run these commands from the root to check the entire monorepo, or filter them to a specific app.

**Typecheck:**
```bash
# Check the entire monorepo
pnpm typecheck

# Check only the Consumer app
pnpm --filter @cfc/consumer typecheck
```

**Lint:**
```bash
# Lint the entire monorepo
pnpm lint

# Lint only the Consumer app
pnpm --filter @cfc/consumer lint
```

## Adding Dependencies

Because this is a pnpm workspace, use the `--filter` flag when installing packages to a specific app or package.

```bash
# Example: Add 'date-fns' to the Consumer app only
pnpm add date-fns --filter @cfc/consumer

# Example: Add a dev dependency to the shared UI package
pnpm add -D some-tool --filter @cfc/ui
```

## Production Build

To test the production build locally:

```bash
# Build all apps
pnpm build

# Build only the Consumer app
pnpm --filter @cfc/consumer build
```
