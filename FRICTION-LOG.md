# Friction log

One file per snag under `friction-log/`, written as it happens, not reconstructed at
the end. Submissions with friction logs earn up to a 10% judging bonus, and this is
the most useful feedback the Fire TV team will get from us.

Each entry records: the task attempted, the steps taken, expected versus actual, a
severity, any workaround, and an actionable suggestion. Copy `friction-log/TEMPLATE.md`.

Log every one of: Vega SDK installation, the Vega Virtual Device, the decoder
investigation, the Vega media player API, focus management in React Native on TV, the
Amazon Devices Builder Tools MCP, the app manifest, the AWS credits form, Bedrock
model access.

## Entries

| # | Date | Area | Severity | Title |
| --- | --- | --- | --- | --- |
| [002](friction-log/002-bedrock-mantle-iam-resource-arn.md) | 2026-09-21 | AWS / Bedrock / IAM | minor | No documented resource ARN for `bedrock-mantle:CreateInference` |
| [003](friction-log/003-no-documented-way-to-reference-a-local-media-file.md) | 2026-09-21 | Vega SDK / w3cmedia | major | VideoPlayer rejects plain HTTP, and says MEDIA_ERR_SRC_NOT_SUPPORTED |
| [004](friction-log/004-unquoted-project-path-breaks-the-build.md) | 2026-09-21 | Vega SDK / manifest builder | major | A space in the project path breaks the build, with a misleading error |
