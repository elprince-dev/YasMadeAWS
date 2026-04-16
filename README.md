# YasMade AWS

Monorepo managed by [Nx](https://nx.dev/) with npm workspaces.

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `frontend` | `packages/frontend` | React + Vite personal website |
| `cdk` | `packages/cdk` | AWS CDK infrastructure |

## Scripts

All commands run from the root directory.

### Build & Quality

| Command | What it does |
|---------|-------------|
| `npm run build` | Builds all packages (frontend first, then CDK) |
| `npm run test` | Runs tests across all packages |
| `npm run lint` | Lints all packages |
| `npm run format` | Formats code with Prettier via Nx |

### Development

| Command | What it does |
|---------|-------------|
| `npm run dev` | Starts the frontend Vite dev server |

### AWS CDK (Infrastructure)

| Command | What it does |
|---------|-------------|
| `npm run synth` | Synthesizes CloudFormation templates (builds first) |
| `npm run deploy` | Builds + synths + deploys to AWS |
| `npm run destroy` | Tears down the CDK stack |

### Per-Package

| Command | What it does |
|---------|-------------|
| `npm run build:frontend` | Build frontend only |
| `npm run build:cdk` | Build CDK only |
| `npm run test:frontend` | Test frontend only |
| `npm run test:cdk` | Test CDK only |
| `npm run lint:frontend` | Lint frontend only |
| `npm run lint:cdk` | Lint CDK only |

### CI / Affected (only changed packages)

| Command | What it does |
|---------|-------------|
| `npm run affected:build` | Build only affected packages |
| `npm run affected:test` | Test only affected packages |
| `npm run affected:lint` | Lint only affected packages |

## Dependency Graph

Nx automatically resolves the build order:

```
frontend:lint ─┐
frontend:test ─┤
               ├─► frontend:build ─► cdk:build ─► cdk:synth ─► cdk:deploy
               │
```

- `cdk:build` waits for `frontend:build` (CDK bundles the frontend assets)
- `cdk:synth` waits for `cdk:build`
- `cdk:deploy` waits for both `cdk:build` and `cdk:synth`

## Setup

```bash
npm install
```

## Environment

Copy `.env.example` to `.env.local` and fill in the required values.
