# Implementation Plan: CDK Pipeline

## Overview

Implement a self-mutating CI/CD pipeline using AWS CDK Pipelines. The implementation follows the existing domain-based directory structure, creates a DevStage grouping all infrastructure stacks, and wires everything through a dedicated pipeline app entry point.

## Tasks

- [x] 1. Create pipeline domain directory and PipelineStack

  - [x] 1.1 Create `packages/cdk/src/domains/pipeline/stacks/pipeline-stack.ts` with the `PipelineStack` class

    - Define `PipelineStackProps` extending `StackProps` with `githubOwner`, `githubRepo`, `branch`, `connectionArn`, and `devConfig`
    - Create `CodePipeline` with `selfMutation: true` and `crossAccountKeys: false`
    - Configure `CodePipelineSource.connection()` for GitHub source
    - Define `ShellStep` synth with commands: `npm ci`, `npx nx run-many -t lint --all`, `npx nx run-many -t test --all`, `npx nx run frontend:build`, `npx nx run cdk:build`, `npx cdk synth`
    - Pass Supabase env vars from SSM Parameter Store to the synth step build environment
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 6.1, 6.2_

  - [x] 1.2 Create `packages/cdk/src/domains/pipeline/stages/dev-stage.ts` with the `DevStage` class

    - Define `DevStageProps` extending `StageProps` with `environmentConfig`
    - Instantiate StaticHostingStack, CertificateStack, CdnStack, DnsStack, and EmailStack
    - Wire inter-stack dependencies (CDN depends on StaticHosting + Certificate, DNS + Email depend on CDN + Certificate)
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 1.3 Wire DevStage into PipelineStack and add post-deployment validation
    - Add `DevStage` to the pipeline via `pipeline.addStage()`
    - Add a post-deployment `ShellStep` that runs `curl -f https://dev.yasmade.net || exit 1`
    - _Requirements: 5.1, 5.2_

- [x] 2. Create pipeline app entry point and update CDK config

  - [x] 2.1 Create `packages/cdk/src/bin/pipeline-app.ts`

    - Import `devConfig` and `PipelineStack`
    - Instantiate `PipelineStack` with GitHub config from CDK context or environment variables
    - _Requirements: 7.3_

  - [x] 2.2 Update `packages/cdk/cdk.json` to add a pipeline app entry point
    - Add a `pipeline` context key or document how to use `-a` flag to point to `pipeline-app.js`
    - _Requirements: 7.1, 7.2_

- [x] 3. Checkpoint - Ensure the pipeline stack synthesizes

  - Run `npx cdk synth -a "node packages/cdk/src/bin/pipeline-app.js"` to verify synthesis
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write unit tests for PipelineStack and DevStage

  - [x] 4.1 Create `packages/cdk/src/test/unit/pipeline-stack.test.ts`

    - Test that PipelineStack synthesizes without errors
    - Test that the pipeline has a CodeStar source connection
    - Test that synth step contains expected build commands in correct order
    - Test that self-mutation is enabled
    - Test that the dev stage is present
    - Test that post-deployment validation step exists
    - Test that SSM parameter references are present
    - _Requirements: 1.2, 2.1-2.5, 4.1, 5.1, 5.2, 6.1, 6.2_

  - [x] 4.2 Write property test: Config parameter passthrough

    - **Property 1: Config parameter passthrough**
    - **Validates: Requirements 1.3**

  - [x] 4.3 Write property test: Dev stage contains all required stacks

    - **Property 2: Dev stage contains all required stacks**
    - **Validates: Requirements 3.1, 3.2**

  - [x] 4.4 Write property test: Stack dependency ordering in DevStage
    - **Property 3: Stack dependency ordering in DevStage**
    - **Validates: Requirements 3.3**

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property tests are required
- The `connectionArn` for CodeStar must be created manually in the AWS Console and authorized with GitHub before the pipeline can run
- The AWS account must be bootstrapped with `cdk bootstrap` before deploying the pipeline stack
- SSM parameters (`/yasmade/dev/supabase-url` and `/yasmade/dev/supabase-anon-key`) must be created manually before the first pipeline run
- Property tests use `fast-check` which is already a dev dependency in the CDK package
