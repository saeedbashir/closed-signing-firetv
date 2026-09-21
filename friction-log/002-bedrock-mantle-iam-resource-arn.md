# 002 — No documented resource ARN for `bedrock-mantle:CreateInference`

**Date:** 2026-09-21
**Area:** AWS / Amazon Bedrock / IAM
**Severity:** minor

## Task attempted

Write a least-privilege IAM policy letting an AWS Batch job call Claude through
the Bedrock Messages API endpoint to generate simplified caption tracks.

## Steps taken

1. Read "Claude in Amazon Bedrock", which says an administrator creates a role
   whose "permissions policy grants `bedrock-mantle:CreateInference` only on the
   allowed model ARNs".
2. Looked for the ARN template for those model ARNs on that page. Not given.
3. Read the AWS Bedrock user guide page for the `bedrock-mantle` endpoint. It
   confirms the action — "On `bedrock-mantle`, inference authorizes
   `bedrock-mantle:CreateInference`" — and, for the `bedrock-runtime` endpoint,
   documents the resources precisely, including condition keys. For
   `bedrock-mantle` it gives no resource ARN shape at all.

## Expected

A policy example, or an ARN template, for the endpoint the documentation
recommends for current Claude models.

## Actual

The action name is documented in two places. The resource it is scoped to is
documented in neither. The two endpoints' IAM models are described at very
different levels of detail on the same page.

## Workaround

Assumed the standard foundation-model ARN form:

```
arn:${AWS::Partition}:bedrock:${AWS::Region}::foundation-model/anthropic.claude-opus-5
```

Added a `bedrockResourceScope=any` context flag that widens the resource to `*`,
so a failed deploy is one flag away from working rather than a code change. The
guess is written down in `infra/README.md` rather than left silent.

## Suggestion

Add a worked IAM policy for `bedrock-mantle:CreateInference` to the "Claude in
Amazon Bedrock" page, next to the three authentication paths, with the model ARN
template spelled out — matching the detail already given for `bedrock-runtime`.
Least-privilege is the first thing a reviewer checks, and right now the only way
to get it right is to deploy and read the `AccessDenied`.

## Time lost

About 40 minutes, most of it reading two pages that each document half of it.
