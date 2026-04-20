# YasMade AWS

Monorepo managed by [Nx](https://nx.dev/) with npm workspaces.

## Packages

| Package    | Path                | Description                   |
| ---------- | ------------------- | ----------------------------- |
| `frontend` | `packages/frontend` | React + Vite personal website |
| `cdk`      | `packages/cdk`      | AWS CDK infrastructure        |

## Scripts

All commands run from the root directory.

### Build & Quality

| Command          | What it does                                   |
| ---------------- | ---------------------------------------------- |
| `npm run build`  | Builds all packages (frontend first, then CDK) |
| `npm run test`   | Runs tests across all packages                 |
| `npm run lint`   | Lints all packages                             |
| `npm run format` | Formats code with Prettier via Nx              |

### Development

| Command       | What it does                        |
| ------------- | ----------------------------------- |
| `npm run dev` | Starts the frontend Vite dev server |

### AWS CDK (Infrastructure)

| Command                   | What it does                                        |
| ------------------------- | --------------------------------------------------- |
| `npm run synth`           | Synthesizes CloudFormation templates (builds first) |
| `npm run synth:pipeline`  | Synthesizes the CI/CD pipeline stack                |
| `npm run deploy`          | Builds + synths + deploys to AWS                    |
| `npm run deploy:pipeline` | Builds + deploys the CI/CD pipeline stack           |
| `npm run destroy`         | Tears down the CDK stack                            |

### Per-Package

| Command                  | What it does        |
| ------------------------ | ------------------- |
| `npm run build:frontend` | Build frontend only |
| `npm run build:cdk`      | Build CDK only      |
| `npm run test:frontend`  | Test frontend only  |
| `npm run test:cdk`       | Test CDK only       |
| `npm run lint:frontend`  | Lint frontend only  |
| `npm run lint:cdk`       | Lint CDK only       |

### CI / Affected (only changed packages)

| Command                  | What it does                 |
| ------------------------ | ---------------------------- |
| `npm run affected:build` | Build only affected packages |
| `npm run affected:test`  | Test only affected packages  |
| `npm run affected:lint`  | Lint only affected packages  |

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

## CI/CD Pipeline

The project includes a self-mutating AWS CodePipeline defined in CDK. Once deployed, it automatically:

1. Triggers on pushes to the `main` branch via CodeStar GitHub connection
2. Runs `npm ci`, lint, test, build, and synth
3. Updates its own pipeline definition if changed (self-mutation)
4. Deploys all infrastructure stacks to the dev environment
5. Runs a post-deployment smoke test against `https://dev.yasmade.net`

To bootstrap the pipeline for the first time:

```bash
npm run deploy:pipeline
```

After the initial deploy, the pipeline manages itself — just push to `main`.

## Setup

```bash
npm install
```

## Environment

Copy `.env.example` to `.env.local` and fill in the required values.
