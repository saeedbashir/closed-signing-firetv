# Infrastructure

Four CDK stacks. `cdk synth` works on a fresh clone with **no AWS account**, and
gives the same result on a machine that has one: the stacks are
environment-agnostic on purpose, so nothing asks the account a question at synth
time. (The earlier version pinned the environment when credentials were present,
which made the VPC look up availability zones through the account — and on an
account whose organisation policy denies that call, synth reported errors for
exactly the people who had configured AWS. Fixed 2026-09-22; see `bin/app.ts`.)

```sh
cd infra
npm ci
npx cdk synth          # no credentials needed, and identical with them
npx jest               # stack tests
npx cdk deploy --all   # needs credentials on an account that permits CloudFormation
```

**Deployment status, 2026-09-23: deployed** to account <project-account>, us-east-1,
with `-c cdn=false`. The account had sat under AWS's simplified-experience
guardrails (a service control policy denying CloudFormation, EC2, Batch, ECR and
more); activating advanced features and detaching that policy opened them all
(`friction-log/015`). Two things the account still cannot do, both waiting on
AWS's verification of a new account: create CloudFront resources — hence
`cdn=false`, the assets bucket without the distribution — and invoke Bedrock
models, so `--simplify` runs nowhere yet and the simplified track in the
catalogue is hand-written and labelled as such. `HOSTING.md` records the exact
errors; the player is served from R2 regardless.

The container image is built by `.github/workflows/container.yml` in the
`signed-track-manifest` repository (where the Dockerfile lives) and pushed to
this stack's ECR repository over GitHub's OIDC token; the role it assumes,
`closed-signing-ci-ecr-push`, can push to one repository prefix and nothing
else.

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

Before any of that, the account itself has to have the **Anthropic use case
form** accepted. Until it is, every Anthropic model returns `Model use case
details have not been submitted for this account` on the runtime API and a 403
`not available for this account` on the Messages API endpoint — measured
2026-09-22. That is an account-level gate, not a policy one, and no IAM change
opens it.

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

The sources file lives in the `sources` bucket and its entries carry
`media: s3://…` for the staged video (`url` stays the publisher's page, which is
what the manifest records). The job definition sets `STM_ASSETS_BUCKET`, so the
finished title is uploaded to `s3://<assets>/titles/<id>/` without further
flags; `STM_PUBLIC_BASE`, when set, makes the manifest's URLs absolute under it.

Locally, the same work is just `stm run catalogue/sources.yaml --out out`.

**First run, 2026-09-23:** job `extract-sp-fmqs-backbench-2026-09-15`
(`f97417a3…`) on the Backbench session, 32 minutes of video: `RUNNING` at 12:17,
`SUCCEEDED` at 12:55 — 38 minutes on 4 Fargate vCPUs, about $0.15 of compute.
It fetched the 500 MB source from the sources bucket, cropped, filled, measured
activity, fetched the Official Report, ran faster-whisper (the `small` model
downloaded from Hugging Face on first use) and aligned, and uploaded five files to
`s3://<assets>/titles/sp-fmqs-backbench-bsl-2026-09-15-full/` with the right
content types. The manifest validates. Since 2026-10-01 the job uses Amazon
Transcribe for the caption timings (`STM_ASR=transcribe` on the job definition;
the job role may start and poll Transcribe jobs, and nothing else was added):
Bedrock is closed to the account, so Transcribe is the AWS AI service in the
pipeline. Second run, the same session with Transcribe as the clock (job
definition revision 2): `SUCCEEDED` in 29 minutes, 3,866 of 4,615 Report words
anchored (84 %), 461 cues, five files uploaded. Its 458 caption cues differ from the
Mac-built 459 only at cue boundaries: word timestamps from CTranslate2 on a
different CPU move by a few hundred milliseconds, and the segmenter cuts
accordingly; the text is the same Report.
