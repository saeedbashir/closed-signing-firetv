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
| [005](friction-log/005-usetveventhandler-missing-from-typescript-surface.md) | 2026-09-21 | Vega SDK / TypeScript | minor | `useTVEventHandler` ships at runtime but not in the type surface |
| [006](friction-log/006-no-way-to-see-what-a-vega-app-is-doing.md) | 2026-09-22 | Vega Virtual Device | major | No way to see what a Vega app is doing from a script |
| [007](friction-log/007-keplervideoview-ignores-its-own-position-and-size.md) | 2026-09-22 | Vega SDK / w3cmedia | major | `KeplerVideoView` ignores its own position and size |
| [008](friction-log/008-back-and-select-are-never-delivered-to-the-app.md) | 2026-09-22 | Vega SDK / RN input | blocker | Back, Select and Menu are never delivered to the app |
| [009](friction-log/009-remote-key-names-are-not-the-documented-ones.md) | 2026-09-22 | Vega SDK / RN input | major | The remote sends key names that are not in the documented list |
| [010](friction-log/010-nothing-moves-focus-to-a-panel-that-appears.md) | 2026-09-22 | Vega SDK / RN focus | major | Nothing documented moves focus to a panel that appears over a focused screen |
| [011](friction-log/011-the-bundled-asyncstorage-does-nothing-and-says-so-to-no-one.md) | 2026-09-22 | Vega SDK / RN storage | major | The bundled `AsyncStorage` does nothing, and says so to no one |
| [012](friction-log/012-view-opacity-does-not-apply-to-keplervideoview.md) | 2026-09-22 | Vega SDK / w3cmedia | major | `opacity` on a View does not apply to the `KeplerVideoView` inside it |
