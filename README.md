# Closed Signing for Fire TV

A Vega OS (Fire TV) player that gives deaf and hard-of-hearing viewers control over
the sign language interpreter on screen: reposition, resize, snap to a corner, change
opacity, or hide — with verbatim or simplified captions running independently.

Signed video today has the interpreter burned into the picture at a position and size
chosen by whoever produced it. This player takes existing interpreted content,
separates the interpreter into its own layer using the open
[Signed Track Manifest](https://github.com/saeedbashir/signed-track-manifest) format,
and re-renders it under the viewer's control.

**We never generate or synthesise sign language.** Every track in the catalogue was
performed by a human interpreter, and the manifest format records that with a
required `provenance` field. The extraction pipeline finds a person and cuts a
rectangle; it does not recognise signs or interpret meaning.

## Status

Built for the Build, Ship, Shape: Amazon Developer Hackathon, Fire TV track, with the
AWS Builder and Open Source mini challenges. Private during the build; public on
submission day.

Week one (21–27 September 2026) is a gate: three experiments decide whether the
project proceeds. See `notes/` for session notes.

## Layout

| Path | What |
| --- | --- |
| `app/` | Vega React Native app. Starts once the decoder question (Experiment 2) is answered. |
| `infra/` | AWS CDK: S3, CloudFront, Batch, Bedrock IAM. |
| `catalogue/sources.yaml` | Every candidate title with licence, attribution, production credit and acquisition route. Filled in before anything is downloaded. |
| `catalogue/bundled/` | Two or three short processed titles that ship inside the app so it runs with no network and no AWS account. |
| `CONTENT-LICENCES.md` | Every title and model in the build, and its basis for inclusion. |
| `FRICTION-LOG.md` | Index of friction log entries, written as they happen. |
| `notes/` | One short note per working session: built, blocked, what in the spec was wrong. |

## Vega SDK

Pinned SDK version: _to be recorded at install_. The Vega docs are open beta and subject
to change; the version this project was built against is stated here and in
`app/README.md`.
