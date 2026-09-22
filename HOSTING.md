# Asset hosting

Media is served from **Cloudflare R2**, not S3.

## Why not AWS

The AWS account available to this project (<project-account>) is on the Free Plan,
which places it inside an AWS-managed organisation whose service control policy
denies `s3:CreateBucket`, CloudFormation, EC2, Batch and ECR. A service control
policy overrides IAM, so the AdministratorAccess on the IAM user makes no
difference. Re-checked 2026-09-22: `cloudformation:ListStacks` is an explicit
deny by `p-o59ka7dj`, and the account holds no buckets.

Bedrock is a separate, narrower block, and it is **pending rather than closed**.
The control plane answers — `bedrock list-foundation-models` returns the
Anthropic models — but invoking one fails on the Anthropic use case form, which
has to be accepted for the account:

```
bedrock-runtime invoke-model (us.anthropic.claude-haiku-4-5-20251001-v1:0):
  ResourceNotFoundException: Model use case details have not been submitted for
  this account. Fill out the Anthropic use case details form before using the
  model. If you have already filled out the form, try again in 15 minutes.

Messages API endpoint (AnthropicBedrockMantle, the pipeline's path):
  403 permission_error: anthropic.claude-haiku-4-5 is not available for this account.
```

Measured 2026-09-22 with one-token probes. The form has been requested; until it
is accepted the simplifier in `signed-track-manifest` cannot run against this
account, and the simplified track in the catalogue is hand-written and labelled
as such (no `generatedBy`). The day the form clears, `stm run --simplify` is the
only step needed to produce a `generatedBy: amazon-bedrock`, `reviewed: false`
track for a real title — nothing else in the pipeline or the app changes.

The CDK stacks in `infra/` are still the infrastructure story. They synthesise
with or without credentials and describe what this deploys to on an account
outside that organisation. R2 stands in for S3 and CloudFront on the Free Plan.

## Why R2 suits this project anyway

- **HTTPS by default**, which is not optional: Vega's media player refuses
  plain HTTP and cannot read a local file path from inside the app sandbox.
  See `friction-log/003`.
- **No egress charges.** The thing being served is video.
- 10 GB of free storage, comfortably more than a dozen processed titles.

## Setup

Bucket `closed-signing`, public development URL enabled:

```
https://pub-b84145f82da443da96042c47410ab8cd.r2.dev
```

The r2.dev URL is rate-limited and Cloudflare marks it as unsuitable for
production. That is fine for a hackathon; a custom domain is the answer if this
goes further.

Credentials live in the `cloudflare-r2` profile in `~/.aws/credentials`. The
endpoint is not stored in the profile, so pass it explicitly:

```sh
export R2=https://<r2-account-id>.r2.cloudflarestorage.com
aws s3 ls s3://closed-signing --profile cloudflare-r2 --endpoint-url "$R2" --region auto
```

## Publishing a processed title

```sh
# 1. process (from the signed-track-manifest checkout)
stm run ../closed-signing-firetv/catalogue/sources.yaml --id <id> --out out --work work

# 2. make the manifest's URLs absolute, validate, upload, and check every file answers
tools/publish-title.sh out <id>

# 3. regenerate app/src/catalogue.ts from the published manifests and rebuild
node tools/build-catalogue.mjs https://pub-…r2.dev/titles/<id>/manifest.json [...]
```

Step 2 was three lines of prose here until 2026-09-22; it is a script now because
the two full-length titles were the first time it was done twice.

Verify the device can actually reach it before assuming it works — the failure
mode is silent and looks like a codec error:

```sh
vega device run-cmd -d VirtualDevice \
  --command "curl -sI https://pub-b84145f82da443da96042c47410ab8cd.r2.dev/titles/<id>/main.mp4"
```

## Layout

```
closed-signing/
  titles/<id>/main.mp4        programme with the interpreter removed and the hole filled
  titles/<id>/signer-<lang>.mp4   the extracted interpreter layer
  titles/<id>/poster.jpg
  titles/<id>/manifest.json   Signed Track Manifest for the title
```
