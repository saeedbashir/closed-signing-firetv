# Infrastructure

Four CDK stacks. `cdk synth` works on a fresh clone with **no AWS account**, so
the templates can be read without deploying anything.

```sh
cd infra
npm ci
npx cdk synth          # no credentials needed
npx jest               # stack tests
npx cdk deploy --all   # needs credentials
```

| Stack | What it holds |
| --- | --- |
| `ClosedSigningStorage` | The `sources` bucket: material downloaded from publishers, before processing. |
| `ClosedSigningDelivery` | The `assets` bucket and the CloudFront distribution that serves it. |
| `ClosedSigningCaptions` | The Bedrock permission used to generate simplified caption tracks. |
| `ClosedSigningProcessing` | VPC, ECR repository, and AWS Batch on Fargate running the extraction container. |

The asset bucket sits in the delivery stack rather than with `sources` because a
bucket fronted by an origin access control and the distribution that reaches it
reference each other; splitting them across stacks is a dependency cycle.

## AWS services, and why each one

This is the AWS Builder mini challenge answer in short form.

- **Amazon Bedrock** — generates the simplified caption track from the verbatim
  transcript, using Claude through the Messages API endpoint. Not decoration:
  for a viewer whose first language is a signed language, written English is a
  second language, and verbatim caption speed routinely outruns their reading
  rate. Permission lives in `lib/captions-stack.ts`; the call site is
  `src/stm_pipeline/simplify.py` in the pipeline repository.
- **AWS Batch on Fargate** — runs the extraction container once per title.
  `lib/processing-stack.ts`.
- **Amazon S3** — source material, renditions, signer crops, manifests, posters.
  `lib/storage-stack.ts` and `lib/delivery-stack.ts`.
- **Amazon CloudFront** — asset delivery to the device, with a short TTL on
  manifests and captions so a reprocessed title appears quickly, and a long TTL
  on media, which never changes once written. `lib/delivery-stack.ts`.
- **Amazon ECR** — the pipeline image, built in CI. `lib/processing-stack.ts`.
- **AWS CDK** — the whole stack as code, synthesisable without an account.

## Cost choices

- **No NAT gateway.** Tasks run in public subnets with a public IP and reach S3,
  ECR and Bedrock directly. A NAT gateway would cost more per month than this
  project's entire compute bill.
- **CloudFront price class 100.**
- **Nothing is retained by default**, so `cdk destroy --all` leaves no orphaned
  buckets or images. Pass `-c retainData=true` for a deployment you intend to keep.

## Context flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `retainData` | `false` | Keep S3 objects and container images after `cdk destroy`. |
| `bedrockModels` | Opus 5, Sonnet 5, Haiku 4.5 | Comma-separated Bedrock model IDs the pipeline may call. |
| `bedrockResourceScope` | `models` | `models` scopes the Bedrock policy to those model ARNs; `any` widens the resource to `*`. |
| `maxVcpus` | `16` | Ceiling on concurrent Fargate vCPUs. |
| `jobVcpu` / `jobMemoryMib` / `jobStorageGib` | `4` / `16384` / `50` | Size of one extraction job. |

## Bedrock model access

Model access is granted per model in the Bedrock console, and the criteria
differ by model. Claude Sonnet 5 and Haiku 4.5 are open to all Bedrock
customers; Claude Opus 5 is gated. All three are permitted by the policy, so
switching is a pipeline flag (`--bedrock-model`) and needs no redeploy.

**Known uncertainty.** The pipeline calls the Messages API endpoint, so the IAM
action is `bedrock-mantle:CreateInference`, not `bedrock:InvokeModel`. The
action name is documented; the resource ARN template for that endpoint is not —
Anthropic's documentation says the policy grants the action "only on the allowed
model ARNs" without giving the ARN shape. This stack assumes the standard
foundation-model form. If a pipeline run fails with `AccessDenied` on Bedrock,
redeploy with `-c bedrockResourceScope=any`, and see `friction-log/002`.

## Running a title on Batch

The job definition's command is overridden per submission:

```sh
aws batch submit-job \
  --job-name extract-wh-briefing-2026-03-14 \
  --job-queue "$(aws cloudformation describe-stacks --stack-name ClosedSigningProcessing \
      --query "Stacks[0].Outputs[?OutputKey=='JobQueueName'].OutputValue" --output text)" \
  --job-definition "$(aws cloudformation describe-stacks --stack-name ClosedSigningProcessing \
      --query "Stacks[0].Outputs[?OutputKey=='JobDefinitionName'].OutputValue" --output text)" \
  --container-overrides '{"command":["run","s3://BUCKET/sources.yaml","--id","wh-briefing-2026-03-14","--simplify"]}'
```

Locally, the same work is just `stm run catalogue/sources.yaml --out out`.
