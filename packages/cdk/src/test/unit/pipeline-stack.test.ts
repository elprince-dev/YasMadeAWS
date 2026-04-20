import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import {
  PipelineStack,
  PipelineStackProps,
} from '../../domains/pipeline/stacks/pipeline-stack';
import { EnvironmentConfig } from '../../shared/types/environment';

const testConfig: EnvironmentConfig = {
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
    comment: 'Test Distribution',
    defaultRootObject: 'index.html',
    errorConfigurations: [],
  },
  tags: {
    Environment: 'test',
    Project: 'yasmade',
    Owner: 'test',
  },
};

const defaultProps: PipelineStackProps = {
  env: { account: '123456789012', region: 'us-east-1' },
  githubOwner: 'test-owner',
  githubRepo: 'test-repo',
  branch: 'main',
  connectionArn:
    'arn:aws:codestar-connections:us-east-1:123456789012:connection/test-connection-id',
  devConfig: testConfig,
};

describe('PipelineStack', () => {
  let app: cdk.App;
  let stack: PipelineStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new PipelineStack(app, 'TestPipeline', defaultProps);
    // Force pipeline construction so all resources are synthesized
    stack.pipeline.buildPipeline();
    template = Template.fromStack(stack);
  });

  test('synthesizes without errors', () => {
    expect(template.toJSON()).toBeDefined();
  });

  test('creates a CodePipeline with CodeStar source connection', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Source',
          Actions: Match.arrayWith([
            Match.objectLike({
              ActionTypeId: Match.objectLike({
                Provider: 'CodeStarSourceConnection',
              }),
              Configuration: Match.objectLike({
                ConnectionArn: defaultProps.connectionArn,
                FullRepositoryId: `${defaultProps.githubOwner}/${defaultProps.githubRepo}`,
                BranchName: defaultProps.branch,
              }),
            }),
          ]),
        }),
      ]),
    });
  });

  test('synth step contains expected build commands', () => {
    // The synth step runs in a CodeBuild project. Verify the build commands
    // are present in the BuildSpec of the synth CodeBuild project.
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: Match.objectLike({
        BuildSpec: Match.serializedJson(
          Match.objectLike({
            phases: Match.objectLike({
              build: Match.objectLike({
                commands: Match.arrayWith([
                  'npm ci',
                  'npm run lint',
                  'npm run test',
                  'npm run build',
                  'npm run synth:pipeline',
                ]),
              }),
            }),
          })
        ),
      }),
    });
  });

  test('self-mutation is enabled (UpdatePipeline stage exists)', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'UpdatePipeline',
        }),
      ]),
    });
  });

  test('dev stage is present in the pipeline', () => {
    template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
      Stages: Match.arrayWith([
        Match.objectLike({
          Name: 'Dev',
        }),
      ]),
    });
  });

  test('post-deployment smoke test step exists', () => {
    // The smoke test is a CodeBuild project with curl command
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Source: Match.objectLike({
        BuildSpec: Match.serializedJson(
          Match.objectLike({
            phases: Match.objectLike({
              build: Match.objectLike({
                commands: Match.arrayWith([
                  `curl -f https://${testConfig.domain.name} || exit 1`,
                ]),
              }),
            }),
          })
        ),
      }),
    });
  });

  test('SSM parameter references are present for Supabase env vars', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project', {
      Environment: Match.objectLike({
        EnvironmentVariables: Match.arrayWith([
          Match.objectLike({
            Name: 'VITE_SUPABASE_URL',
            Type: 'PARAMETER_STORE',
            Value: '/yasmade/dev/supabase-url',
          }),
          Match.objectLike({
            Name: 'VITE_SUPABASE_ANON_KEY',
            Type: 'PARAMETER_STORE',
            Value: '/yasmade/dev/supabase-anon-key',
          }),
        ]),
      }),
    });
  });
});
