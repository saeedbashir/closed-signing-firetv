# Asset hosting

Media is served from **Cloudflare R2**, not S3.

## Why not AWS

The AWS account available to this project is on the Free Plan, which places it
inside an AWS-managed organisation whose service control policy denies
`s3:CreateBucket`, CloudFormation, EC2, Batch and ECR. A service control policy
overrides IAM, so the AdministratorAccess on the IAM user makes no difference.
Bedrock is blocked separately: the Anthropic use case form must be submitted by
the organisation's management account, which this account is not.

The CDK stacks in `infra/` are still the infrastructure story and still
synthesise without an account. They describe what this would deploy to on a
normal AWS account. R2 stands in for S3 and CloudFront on the Free Plan.

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
# 1. process
stm run catalogue/sources.yaml --out out --work work

# 2. rewrite the manifest's relative URLs to absolute R2 ones, then upload
aws s3 cp out/<id>/ "s3://closed-signing/titles/<id>/" --recursive \
  --profile cloudflare-r2 --endpoint-url "$R2" --region auto

# 3. regenerate app/src/catalogue.ts from the manifests and rebuild
```

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
