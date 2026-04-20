import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from 'aws-cdk-lib/pipelines';
import { BuildEnvironmentVariableType } from 'aws-cdk-lib/aws-codebuild';
import { EnvironmentConfig } from '../../../shared/types/environment';
import { DevStage } from '../stages/dev-stage';

export interface PipelineStackProps extends StackProps {
  /** GitHub repository owner (e.g., "elprince-dev") */
  readonly githubOwner: string;
  /** GitHub repository name */
  readonly githubRepo: string;
  /** Branch to track (e.g., "main") */
  readonly branch: string;
  /** ARN of the CodeStar Connection to GitHub */
  readonly connectionArn: string;
  /** Environment config for the dev stage */
  readonly devConfig: EnvironmentConfig;
}

/**
 * Pipeline Stack
 *
 * Self-mutating CI/CD pipeline that builds, tests, and deploys
 * all YasMade infrastructure stacks to the dev environment.
 */
export class PipelineStack extends Stack {
  public readonly pipeline: CodePipeline;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // GitHub source via CodeStar Connection
    const source = CodePipelineSource.connection(
      `${props.githubOwner}/${props.githubRepo}`,
      props.branch,
      { connectionArn: props.connectionArn }
    );

    // Synth step: install, lint, test, build, synth the pipeline app
    const synthStep = new ShellStep('Synth', {
      input: source,
      commands: [
        'npm ci',
        'npm run lint',
        'npm run test',
        'npm run build',
        'npm run synth:pipeline',
      ],
      primaryOutputDirectory: 'packages/cdk/cdk.out',
    });

    this.pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'YasMade-Pipeline',
      selfMutation: true,
      crossAccountKeys: false,
      synth: synthStep,
      synthCodeBuildDefaults: {
        buildEnvironment: {
          environmentVariables: {
            VITE_SUPABASE_URL: {
              type: BuildEnvironmentVariableType.PARAMETER_STORE,
              value: '/yasmade/dev/supabase-url',
            },
            VITE_SUPABASE_ANON_KEY: {
              type: BuildEnvironmentVariableType.PARAMETER_STORE,
              value: '/yasmade/dev/supabase-anon-key',
            },
          },
        },
      },
    });

    // Add dev stage with all infrastructure stacks
    const devStage = new DevStage(this, 'Dev', {
      environmentConfig: props.devConfig,
      env: { account: props.devConfig.account, region: props.devConfig.region },
    });

    const stage = this.pipeline.addStage(devStage);

    // Post-deployment smoke test
    stage.addPost(
      new ShellStep('SmokeTest', {
        commands: [`curl -f https://${props.devConfig.domain.name} || exit 1`],
      })
    );
  }
}
