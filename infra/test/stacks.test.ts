import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CaptionsStack } from '../lib/captions-stack';
import { DEFAULT_BEDROCK_MODELS, readConfig } from '../lib/config';
import { DeliveryStack } from '../lib/delivery-stack';
import { ProcessingStack } from '../lib/processing-stack';
import { StorageStack } from '../lib/storage-stack';

function build(context: Record<string, unknown> = {}) {
  const app = new cdk.App({ context });
  const config = readConfig(app);
  const storage = new StorageStack(app, 'Storage', { retainData: config.retainData });
  const delivery = new DeliveryStack(app, 'Delivery', { retainData: config.retainData, cdn: config.cdn });
  const captions = new CaptionsStack(app, 'Captions', {
    models: config.bedrockModels,
    resourceScope: config.bedrockResourceScope,
  });
  const processing = new ProcessingStack(app, 'Processing', {
    sources: storage.sources,
    assets: delivery.assets,
    bedrockInvokePolicy: captions.bedrockInvokePolicy,
    retainData: config.retainData,
    maxVcpus: config.maxVcpus,
    jobVcpu: config.jobVcpu,
    jobMemoryMib: config.jobMemoryMib,
    jobStorageGib: config.jobStorageGib,
  });
  return {
    config,
    storage: Template.fromStack(storage),
    delivery: Template.fromStack(delivery),
    captions: Template.fromStack(captions),
    processing: Template.fromStack(processing),
  };
}

describe('storage', () => {
  test('the sources bucket is private and refuses plaintext', () => {
    const { storage } = build();
    storage.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
    storage.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({ Effect: 'Deny', Condition: { Bool: { 'aws:SecureTransport': 'false' } } }),
        ]),
      }),
    });
  });

  test('data is destroyed by default and retained on request', () => {
    build().storage.hasResource('AWS::S3::Bucket', { DeletionPolicy: 'Delete' });
    build({ retainData: 'true' }).storage.hasResource('AWS::S3::Bucket', { DeletionPolicy: 'Retain' });
  });
});

describe('delivery', () => {
  test('the asset bucket is reached only through an origin access control', () => {
    const { delivery } = build();
    delivery.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
    delivery.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: { Service: 'cloudfront.amazonaws.com' },
            Action: 's3:GetObject',
          }),
        ]),
      }),
    });
  });

  test('manifests and captions get their own short-lived cache behaviour', () => {
    const { delivery } = build();
    delivery.hasResourceProperties('AWS::CloudFront::CachePolicy', {
      CachePolicyConfig: Match.objectLike({ DefaultTTL: 60, MaxTTL: 300 }),
    });
    delivery.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: Match.objectLike({
        CacheBehaviors: Match.arrayWith([
          Match.objectLike({ PathPattern: '*.json' }),
          Match.objectLike({ PathPattern: '*.vtt' }),
        ]),
        DefaultCacheBehavior: Match.objectLike({ ViewerProtocolPolicy: 'redirect-to-https' }),
      }),
    });
  });
});

describe('captions', () => {
  test('grants exactly the Bedrock Messages-endpoint action, scoped to named models', () => {
    const { captions } = build();
    captions.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: [
          Match.objectLike({
            Sid: 'ClaudeMessagesInference',
            Action: 'bedrock-mantle:CreateInference',
            Effect: 'Allow',
            Resource: Match.arrayWith([
              Match.objectLike({
                'Fn::Join': Match.arrayWith([
                  Match.arrayWith([Match.stringLikeRegexp('foundation-model/anthropic\\.claude-opus-5')]),
                ]),
              }),
            ]),
          }),
        ],
      }),
    });
  });

  test('the escape hatch widens the resource but not the action', () => {
    const { captions } = build({ bedrockResourceScope: 'any' });
    captions.hasResourceProperties('AWS::IAM::ManagedPolicy', {
      PolicyDocument: Match.objectLike({
        Statement: [Match.objectLike({ Action: 'bedrock-mantle:CreateInference', Resource: '*' })],
      }),
    });
  });

  test('the model list is configurable', () => {
    const { config } = build({ bedrockModels: 'anthropic.claude-sonnet-5' });
    expect(config.bedrockModels).toEqual(['anthropic.claude-sonnet-5']);
    expect(readConfig(new cdk.App()).bedrockModels).toEqual(DEFAULT_BEDROCK_MODELS);
  });

  test('an empty model list is rejected rather than silently granting nothing', () => {
    const app = new cdk.App();
    expect(() => new CaptionsStack(app, 'Empty', { models: [], resourceScope: 'models' })).toThrow(
      /at least one Bedrock model/,
    );
  });
});

describe('processing', () => {
  test('no NAT gateway: tasks reach S3 and Bedrock from public subnets', () => {
    const { processing } = build();
    processing.resourceCountIs('AWS::EC2::NatGateway', 0);
    processing.resourceCountIs('AWS::EC2::Subnet', 2);
    processing.hasResourceProperties('AWS::EC2::Subnet', { MapPublicIpOnLaunch: true });
  });

  /** `Match.arrayWith` matches a subsequence in order, so each requirement is
   * asserted separately rather than depending on how CDK orders them. */
  function expectResourceRequirement(
    template: Template,
    type: 'VCPU' | 'MEMORY',
    value: string,
  ): void {
    template.hasResourceProperties('AWS::Batch::JobDefinition', {
      ContainerProperties: Match.objectLike({
        ResourceRequirements: Match.arrayWith([{ Type: type, Value: value }]),
      }),
    });
  }

  test('the job runs on Fargate with a public IP and the configured size', () => {
    const { processing } = build();
    processing.hasResourceProperties('AWS::Batch::JobDefinition', {
      PlatformCapabilities: ['FARGATE'],
      ContainerProperties: Match.objectLike({
        NetworkConfiguration: { AssignPublicIp: 'ENABLED' },
        EphemeralStorage: { SizeInGiB: 50 },
      }),
      RetryStrategy: { Attempts: 2 },
    });
    expectResourceRequirement(processing, 'VCPU', '4');
    expectResourceRequirement(processing, 'MEMORY', '16384');
  });

  test('the job role can read sources, write assets and call Bedrock', () => {
    const { processing } = build();
    processing.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: [Match.objectLike({ Principal: { Service: 'ecs-tasks.amazonaws.com' } })],
      }),
      ManagedPolicyArns: Match.anyValue(),
    });
    processing.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([Match.objectLike({ Action: Match.arrayWith(['s3:PutObject']) })]),
      }),
    });
  });

  test('images are garbage collected and scanned', () => {
    const { processing } = build();
    processing.hasResourceProperties('AWS::ECR::Repository', {
      ImageScanningConfiguration: { ScanOnPush: true },
      LifecyclePolicy: Match.objectLike({
        LifecyclePolicyText: Match.stringLikeRegexp('"countType":"imageCountMoreThan".*"countNumber":5'),
      }),
    });
  });

  test('job size is configurable', () => {
    const { processing } = build({ jobVcpu: '2', jobMemoryMib: '8192', jobStorageGib: '30' });
    processing.hasResourceProperties('AWS::Batch::JobDefinition', {
      ContainerProperties: Match.objectLike({ EphemeralStorage: { SizeInGiB: 30 } }),
    });
    expectResourceRequirement(processing, 'VCPU', '2');
    expectResourceRequirement(processing, 'MEMORY', '8192');
  });
});

test('cdn=false deploys the assets bucket without a CloudFront distribution', () => {
  const app = new cdk.App();
  const stack = new DeliveryStack(app, 'DeliveryNoCdn', { retainData: false, cdn: false });
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::S3::Bucket', 1);
  template.resourceCountIs('AWS::CloudFront::Distribution', 0);
  template.hasOutput('AssetsBucketName', {});
});
