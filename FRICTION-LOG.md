# Friction log

Fifteen entries, one file each under `friction-log/`, written as each snag happened
during the build (21 September to 3 October 2026), not reconstructed at the end.

Each entry records the task attempted, the steps taken, expected versus actual, a
severity (blocker · major · minor · papercut), the workaround used, and one actionable
suggestion. The table is in the order the snags were hit. The ones that shaped the app
are 008, 007, 012, 016 and 011; the AWS onboarding problems are 015 and 002.
`friction-log/TEMPLATE.md` is the form every entry follows.

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
| [013](friction-log/013-hls-plays-from-src-although-the-readme-says-it-cannot.md) | 2026-09-22 | Vega SDK / w3cmedia | minor | HLS plays from `src`, although the README says it cannot |
| [014](friction-log/014-qmp-qcodes-arrive-as-the-wrong-keys-use-inputd-cli.md) | 2026-09-23 | VVD | major | QMP `send-key` qcodes arrive as the wrong keys; the device's own `inputd-cli` is the injector |
| [015](friction-log/015-bedrock-is-closed-for-the-account-and-the-form-apis-are-denied.md) | 2026-09-23 | AWS | blocker | Bedrock and the deploy services are closed by an AWS spend-limit guardrail SCP; resolved by activating advanced features and detaching it |
| [016](friction-log/016-video-planes-stack-in-creation-order.md) | 2026-10-03 | Vega SDK / w3cmedia | major | Video planes stack in creation order, not view order: on Resume the interpreter was hidden under the programme |
