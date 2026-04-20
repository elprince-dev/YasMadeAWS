/**
 * Property-based tests for the CDK Pipeline.
 * Library: fast-check
 * Feature: cdk-pipeline
 */
import * as fc from 'fast-check';
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { PipelineStack } from '../../domains/pipeline/stacks/pipeline-stack';
import { DevStage } from '../../domains/pipeline/stages/dev-stage';
import { EnvironmentConfig } from '../../shared/types/environment';

// ── Generators ─────────────────────────────────────────────────────────

const alphaNum = 'abcdefghijklmnopqrstuvwxyz0123456789';
const alpha = 'abcdefghijklmnopqrstuvwxyz';

const nonEmptyAlphaNum: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...alphaNum.split('')), {
    minLength: 1,
    maxLength: 15,
  })
  .map((chars) => chars.join(''));

const nonEmptyAlpha: fc.Arbitrary<string> = fc
  .array(fc.constantFrom(...alpha.split('')), { minLength: 1, maxLength: 10 })
  .map((chars) => chars.join(''));

/** Generate a valid GitHub owner (alphanumeric, non-empty) */
const githubOwnerArb: fc.Arbitrary<string> = nonEmptyAlphaNum;

/** Generate a valid GitHub repo name */
const githubRepoArb: fc.Arbitrary<string> = nonEmptyAlphaNum;

/** Generate a valid branch name */
const branchArb: fc.Arbitrary<string> = fc.constantFrom(
  'main',
  'develop',
  'staging',
  'release'
);

/** Generate a plausible CodeStar connection ARN */
const connectionArnArb: fc.Arbitrary<string> = nonEmptyAlphaNum.map(
  (id) => `arn:aws:codestar-connections:us-east-1:123456789012:connection/${id}`
);

/** Generate a valid EnvironmentConfig for testing */
const environmentConfigArb: fc.Arbitrary<EnvironmentConfig> = fc
  .tuple(nonEmptyAlpha, nonEmptyAlpha)
  .map(([envName, domainPrefix]) => ({
    environment: envName,
    account: '123456789012',
    region: 'us-east-1',
    domain: {
      name: `${domainPrefix}.example.com`,
      certificateRegion: 'us-east-1',
      createHostedZone: true,
    },
    buckets: {
      staticWebsite: `${envName}-static-website`,
      buildArtifacts: `${envName}-build-artifacts`,
    },
    cloudFront: {
      enabled: true,
      comment: `${envName} Distribution`,
      defaultRootObject: 'index.html',
      errorConfigurations: [],
    },
    tags: {
      Environment: envName,
      Project: 'yasmade',
      Owner: 'test',
    },
  }));

// ── Property 1: Config parameter passthrough ───────────────────────────
// Feature: cdk-pipeline, Property 1: Config parameter passthrough
// **Validates: Requirements 1.3**

describe('Property 1: Config parameter passthrough', () => {
  test('for any valid GitHub config, the synthesized pipeline source action references those exact values', () => {
    fc.assert(
      fc.property(
        githubOwnerArb,
        githubRepoArb,
        branchArb,
        connectionArnArb,
        (owner, repo, branch, connectionArn) => {
          const app = new cdk.App();
          const stack = new PipelineStack(app, 'PropTestPipeline', {
            env: { account: '123456789012', region: 'us-east-1' },
            githubOwner: owner,
            githubRepo: repo,
            branch,
            connectionArn,
            devConfig: {
              environment: 'test',
              account: '123456789012',
              region: 'us-east-1',
              domain: {
                name: 'test.example.com',
                certificateRegion: 'us-east-1',
                createHostedZone: true,
              },
              buckets: {
                staticWebsite: 'test-static-website',
                buildArtifacts: 'test-build-artifacts',
              },
              cloudFront: {
                enabled: true,
                comment: 'Test',
                defaultRootObject: 'index.html',
                errorConfigurations: [],
              },
              tags: { Environment: 'test', Project: 'yasmade', Owner: 'test' },
            },
          });
          stack.pipeline.buildPipeline();
          const template = Template.fromStack(stack);

          template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
            Stages: Match.arrayWith([
              Match.objectLike({
                Name: 'Source',
                Actions: Match.arrayWith([
                  Match.objectLike({
                    Configuration: Match.objectLike({
                      ConnectionArn: connectionArn,
                      FullRepositoryId: `${owner}/${repo}`,
                      BranchName: branch,
                    }),
                  }),
                ]),
              }),
            ]),
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 2: Dev stage contains all required stacks ─────────────────
// Feature: cdk-pipeline, Property 2: Dev stage contains all required stacks
// **Validates: Requirements 3.1, 3.2**

describe('Property 2: Dev stage contains all required stacks', () => {
  const REQUIRED_STACKS = [
    'StaticHosting',
    'Certificate',
    'CDN',
    'DNS',
    'Email',
  ];

  test('for any valid EnvironmentConfig, the DevStage contains exactly the five required stacks', () => {
    fc.assert(
      fc.property(environmentConfigArb, (config) => {
        const app = new cdk.App();
        const stage = new DevStage(app, 'PropTestDevStage', {
          environmentConfig: config,
          env: { account: config.account, region: config.region },
        });

        // Synth the stage to get all stacks
        const assembly = app.synth();
        const stageAssembly = assembly.getNestedAssembly(
          `assembly-PropTestDevStage`
        );
        const stackNames = stageAssembly.stacks.map((s) => s.stackName);

        // Each required stack should be present (stack names include the stage prefix)
        for (const required of REQUIRED_STACKS) {
          const found = stackNames.some((name) => name.includes(required));
          expect(found).toBe(true);
        }

        // Exactly 5 stacks
        expect(stageAssembly.stacks.length).toBe(5);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: Stack dependency ordering in DevStage ──────────────────
// Feature: cdk-pipeline, Property 3: Stack dependency ordering in DevStage
// **Validates: Requirements 3.3**

describe('Property 3: Stack dependency ordering in DevStage', () => {
  test('for any valid EnvironmentConfig, CDN depends on StaticHosting and Certificate, DNS and Email depend on Certificate', () => {
    fc.assert(
      fc.property(environmentConfigArb, (config) => {
        const app = new cdk.App();
        const stage = new DevStage(app, 'DepTestDevStage', {
          environmentConfig: config,
          env: { account: config.account, region: config.region },
        });

        // Synth the stage to get the cloud assembly with dependency info
        const assembly = app.synth();
        const stageAssembly = assembly.getNestedAssembly(
          `assembly-DepTestDevStage`
        );

        // Build a map of stackName -> artifact for dependency lookup
        const stackArtifacts = stageAssembly.stacks;
        const findStack = (partial: string) =>
          stackArtifacts.find((s) => s.stackName.includes(partial));

        const cdnStack = findStack('CDN');
        const staticHostingStack = findStack('StaticHosting');
        const certificateStack = findStack('Certificate');
        const dnsStack = findStack('DNS');
        const emailStack = findStack('Email');

        expect(cdnStack).toBeDefined();
        expect(staticHostingStack).toBeDefined();
        expect(certificateStack).toBeDefined();
        expect(dnsStack).toBeDefined();
        expect(emailStack).toBeDefined();

        // CDN depends on StaticHosting and Certificate
        expect(cdnStack!.dependencies.map((d) => d.id)).toEqual(
          expect.arrayContaining([staticHostingStack!.id, certificateStack!.id])
        );

        // DNS depends on CDN and Certificate
        expect(dnsStack!.dependencies.map((d) => d.id)).toEqual(
          expect.arrayContaining([cdnStack!.id, certificateStack!.id])
        );

        // Email depends on CDN and Certificate
        expect(emailStack!.dependencies.map((d) => d.id)).toEqual(
          expect.arrayContaining([cdnStack!.id, certificateStack!.id])
        );
      }),
      { numRuns: 100 }
    );
  });
});
