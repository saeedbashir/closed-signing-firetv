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
as such (`generatedBy` names the assistant that wrote it, `reviewed: false`). The
day the form clears, `stm run --simplify` is the only step needed to produce a
`generatedBy: amazon-bedrock`, `reviewed: false` track for a real title — nothing
else in the pipeline or the app changes.

**Re-checked 2026-09-23, after the account was upgraded to a paid plan** with a
$20 project spend limit and $250 of credits ($150 "Amazon Devices Global Hackathon
- Teams A4", $100 Free Tier). The upgrade changed billing, not permissions:

- The same policy, `p-o59ka7dj` in organisation `<management-account>` (the hackathon's,
  not this account's), still explicitly denies CloudFormation, EC2, Batch, ECR,
  Lambda, DynamoDB and IAM. `s3 ls` now succeeds (no buckets). The processing
  stack cannot be deployed in this account by anyone in it; that is disclosed, not
  worked around.
- Bedrock is closed at the account level, not per model: `get-foundation-model-
  availability` reports `authorizationStatus: NOT_AUTHORIZED` and
  `agreementAvailability: NOT_AVAILABLE` for every model tried — Anthropic
  (`claude-opus-5`, `claude-haiku-4-5`) **and** Amazon Nova (lite, pro, micro) —
  and every `converse` call, plain id or `us.` inference profile, fails with
  `ValidationException: Operation not allowed`. The two APIs behind the console's
  "Request access" form, `bedrock:GetUseCaseForModelAccess` and
  `bedrock:ListFoundationModelAgreementOffers`, are themselves denied by the SCP.
  What the console shows on the Model access page is the remaining unknown.

**Resolved 2026-09-23, later.** The organisation was AWS's own, for the
"simplified" account experience; activating advanced features made Saeed its
management account, and the deny turned out to be
`AdvancedModeRegionRestrictionSecurityControlPolicy` (`p-2p6va4gc`) attached at
Root. Detached; CloudFormation, ECR, Batch, EC2, Lambda and IAM answer within a
minute. Bedrock's form API now returns `ResourceNotFoundException` — no use-case
form on file. But the console refuses the form itself: *"Your account is not
authorized to perform this action. Please create a support case … with details
about your use case."* Every model of every provider — Anthropic and Amazon Nova
alike — reports `authorizationStatus: NOT_AUTHORIZED`, and `create-foundation-
model-agreement` answers "You have not filled out the request form". That is
AWS's gate on Bedrock for accounts without history, lifted only by a support
case. Filed 2026-09-23 (Account and billing → Account → Other Account Issues), after
setting the payment currency, which had been unset, to USD — AWS's own diagnostic
named card authorisation as the cause. Until it is lifted the simplified track
stays hand-written and labelled as such. friction-log/015 has the sequence.

The CDK stacks in `infra/` are still the infrastructure story. They synthesise
with or without credentials and describe what this deploys to on an account
outside that organisation. R2 stands in for S3 and CloudFront on the Free Plan.

**Deployed 2026-09-23, later still:** with the guardrail policy gone, all four
CDK stacks are up in us-east-1 (`-c cdn=false`: the assets bucket without the
CloudFront distribution, which the unverified account may not create). The
pipeline image is built by CI in `signed-track-manifest` and pushed to the
stack's ECR repository; `infra/README.md` has the state. Hosting for the player
stays on R2.

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
