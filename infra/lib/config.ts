import * as cdk from 'aws-cdk-lib';

/**
 * Deploy-time configuration, all overridable with `-c key=value`.
 *
 * Defaults are chosen for a judge who clones the repo and runs `cdk deploy --all`
 * once: nothing is retained, nothing needs a quota increase, and `cdk destroy --all`
 * leaves no orphaned buckets or images behind.
 */
export interface AppConfig {
  /** Keep S3 objects and container images after `cdk destroy`. Default false. */
  readonly retainData: boolean;
  /** Bedrock model IDs the pipeline is allowed to call. */
  readonly bedrockModels: string[];
  /**
   * How tightly the Bedrock policy is scoped.
   *
   * `models` (default) restricts `bedrock-mantle:CreateInference` to ARNs built
   * from {@link bedrockModels}. Anthropic's docs say the policy grants that action
   * "only on the allowed model ARNs" but do not publish the ARN template for the
   * `bedrock-mantle` endpoint, so the foundation-model form is an assumption. If a
   * pipeline run fails with AccessDenied on Bedrock, redeploy with
   * `-c bedrockResourceScope=any` and open a friction-log entry.
   */
  readonly bedrockResourceScope: 'models' | 'any';
  /** Ceiling on concurrent Fargate vCPUs across the compute environment. */
  readonly maxVcpus: number;
  /** vCPUs per extraction job. Fargate pairs this with a valid memory range. */
  readonly jobVcpu: number;
  /** MiB per extraction job. */
  readonly jobMemoryMib: number;
  /** GiB of task storage. ffmpeg needs room for the source plus both renditions. */
  readonly jobStorageGib: number;
  /**
   * Create the CloudFront distribution in front of the assets bucket. Default true.
   *
   * `-c cdn=false` deploys the bucket alone. A new AWS account cannot create
   * CloudFront resources until AWS has verified it ("Your account must be
   * verified before you can add new CloudFront resources"), and the pipeline
   * does not need the CDN to run — only the player does, and this project's
   * player is served from R2 (HOSTING.md). Measured 2026-09-23.
   */
  readonly cdn: boolean;
}

function bool(app: cdk.App, key: string, fallback: boolean): boolean {
  const raw = app.node.tryGetContext(key);
  if (raw === undefined || raw === null || raw === '') return fallback;
  return raw === true || raw === 'true' || raw === '1';
}

function num(app: cdk.App, key: string, fallback: number): number {
  const raw = app.node.tryGetContext(key);
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const DEFAULT_BEDROCK_MODELS = [
  // Access is granted per model in the Bedrock console. Opus 5 is gated; Sonnet 5
  // and Haiku 4.5 are open to all Bedrock customers, so both are permitted here
  // and the pipeline can fall back with `--bedrock-model` alone, no redeploy.
  'anthropic.claude-opus-5',
  'anthropic.claude-sonnet-5',
  'anthropic.claude-haiku-4-5',
];

export function readConfig(app: cdk.App): AppConfig {
  const modelsRaw = app.node.tryGetContext('bedrockModels');
  const bedrockModels =
    typeof modelsRaw === 'string' && modelsRaw.trim() !== ''
      ? modelsRaw.split(',').map((m) => m.trim()).filter(Boolean)
      : DEFAULT_BEDROCK_MODELS;

  const scopeRaw = String(app.node.tryGetContext('bedrockResourceScope') ?? 'models');
  const bedrockResourceScope: 'models' | 'any' = scopeRaw === 'any' ? 'any' : 'models';

  return {
    retainData: bool(app, 'retainData', false),
    bedrockModels,
    bedrockResourceScope,
    maxVcpus: num(app, 'maxVcpus', 16),
    jobVcpu: num(app, 'jobVcpu', 4),
    jobMemoryMib: num(app, 'jobMemoryMib', 16384),
    jobStorageGib: num(app, 'jobStorageGib', 50),
    cdn: bool(app, 'cdn', true),
  };
}
