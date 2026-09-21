#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CaptionsStack } from '../lib/captions-stack';
import { readConfig } from '../lib/config';
import { DeliveryStack } from '../lib/delivery-stack';
import { ProcessingStack } from '../lib/processing-stack';
import { StorageStack } from '../lib/storage-stack';

const app = new cdk.App();
const config = readConfig(app);

// Left environment-agnostic when no credentials are configured, so `cdk synth`
// works on a fresh clone with no AWS account. `cdk deploy` picks up the
// account and region from the caller's usual AWS configuration.
const env =
  process.env.CDK_DEFAULT_ACCOUNT && process.env.CDK_DEFAULT_REGION
    ? { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
    : undefined;

const prefix = 'ClosedSigning';

const storage = new StorageStack(app, `${prefix}Storage`, {
  env,
  retainData: config.retainData,
  description: 'Closed Signing: source and asset buckets',
});

const delivery = new DeliveryStack(app, `${prefix}Delivery`, {
  env,
  retainData: config.retainData,
  description: 'Closed Signing: asset bucket and CloudFront delivery',
});

const captions = new CaptionsStack(app, `${prefix}Captions`, {
  env,
  models: config.bedrockModels,
  resourceScope: config.bedrockResourceScope,
  description: 'Closed Signing: Bedrock permission for simplified caption generation',
});

new ProcessingStack(app, `${prefix}Processing`, {
  env,
  sources: storage.sources,
  assets: delivery.assets,
  bedrockInvokePolicy: captions.bedrockInvokePolicy,
  retainData: config.retainData,
  maxVcpus: config.maxVcpus,
  jobVcpu: config.jobVcpu,
  jobMemoryMib: config.jobMemoryMib,
  jobStorageGib: config.jobStorageGib,
  description: 'Closed Signing: Batch extraction pipeline',
});

// Stack ordering is inferred from the cross-stack references above: Processing
// reads the buckets and attaches the Bedrock policy, so it deploys last.

cdk.Tags.of(app).add('project', 'closed-signing');

app.synth();
