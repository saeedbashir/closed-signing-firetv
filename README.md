# Closed Signing for Fire TV

A Vega OS (Fire TV) player that gives deaf and hard-of-hearing viewers control over
the sign language interpreter on screen: move her to any corner, resize, fade, or
hide — with verbatim or simplified captions running independently and never
colliding with her.

Signed video today has the interpreter burned into the picture at a position and
size chosen by whoever produced it. This player takes existing interpreted content,
separates the interpreter into her own layer using the open
[Signed Track Manifest](https://github.com/saeedbashir/signed-track-manifest) format,
and plays the two layers together under the viewer's control. The ITU described this
receiver model in 2013; no consumer TV platform has shipped it.

**We never generate or synthesise sign language.** Every track in the catalogue was
performed by a human interpreter, and the format records that with a required
`provenance` field. The pipeline finds a person and cuts a rectangle; it does not
recognise signs or interpret meaning.

## Status — 22 September 2026

Working end to end on the Vega Virtual Device (SDK 0.24.12044): two video surfaces
decoding at real time, the signer layer under D-pad control, captions with collision
avoidance, preferences persisted, any HTTPS manifest openable by address, and an
opt-in fade of the interpreter while she is idle, driven by the manifest's
per-second activity track.

Five titles ship in the bundled catalogue: four Scottish Parliament BSL sessions
(120-second excerpts, hand-measured crop, under the Scottish Parliament Copyright
Licence) and one synthetic demonstration title. Media is served from Cloudflare R2
over HTTPS — see `HOSTING.md` for why not S3 yet.

Automatic extraction finds the interpreter on every real broadcast tried and
classifies the layout correctly, but does not yet bound her tightly enough to
publish unattended; the shipped titles use a hand-measured rectangle and the
manifest says so (`method: manual-crop`). `experiments/e3-extraction/STATUS.md` has
the numbers.

Built for the Build, Ship, Shape: Amazon Developer Hackathon — Fire TV track, with
the AWS Builder and Open Source mini challenges. Private during the build; public on
submission day.

## Run it

See [`app/README.md`](app/README.md): SDK versions, build, install on the Vega
Virtual Device, tests, and how to drive the device from a script.

## Layout

| Path | What |
| --- | --- |
| `app/` | The Vega React Native app. |
| `app/src/catalogue.ts` | The bundled catalogue, generated from published manifests by `tools/build-catalogue.mjs`. Do not hand-edit. |
| `app/assets/` | The two media files for the synthetic demonstration title, so one title plays with no network at all; the launcher icon. |
| `catalogue/sources.yaml` | Every title: licence, attribution, production credit, acquisition route, and the hand-measured crop where one is used. |
| `tools/` | `build-catalogue.mjs` (regenerate the bundled catalogue from R2), `icon.swift` (draw the launcher icon from the design tokens). |
| `infra/` | AWS CDK: S3, CloudFront, Batch on Fargate, Bedrock IAM. Synthesises without an account; not deployed — `HOSTING.md` says why. |
| `experiments/` | The two gate experiments, with their measurements: two decoders (passed on the VVD), extraction on real content (marginal, specifically). |
| `friction-log/` | One entry per platform snag, written as it happened. Index in `FRICTION-LOG.md`. |
| `CONTENT-LICENCES.md` | The acceptance rule, every title, every model, and its basis for inclusion. |
| `HOSTING.md` | Where the media lives and the exact state of the AWS account. |
| `notes/` | Session notes. |

The format, the validator and the extraction pipeline live in the public companion
repository, [`signed-track-manifest`](https://github.com/saeedbashir/signed-track-manifest).

## Licence

Apache 2.0. See [LICENSE](LICENSE). Content licences are per title in
`CONTENT-LICENCES.md`.
