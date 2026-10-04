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
receiver model in 2013 (FG AVA Technical Report Part 10; see also Report ITU-R
BT.2448) and European broadcasters piloted it over HbbTV; no consumer TV platform
ships it.

**We never generate or synthesise sign language.** Every track in the catalogue was
performed by a human interpreter, and the format records that with a required
`provenance` field. The pipeline finds a person and cuts a rectangle; it does not
recognise signs or interpret meaning.

## What works

Verified on the Vega Virtual Device (SDK 0.24.12044), release build:

- **Two video layers at real time** — the programme, and the interpreter as a
  separate surface the viewer moves to any corner, resizes, fades or hides from
  the remote. Set once in a first-run walkthrough, remembered after.
- **Captions that are the publisher's own words.** The verbatim track on both
  Scottish Parliament sessions is the Parliament's Official Report, timed to the
  audio automatically (85–89 % of its words anchored to the recognised speech)
  and published unchanged. Speaker names on each change; stage directions such as
  `[Applause.]` kept. Captions move out of the interpreter's way.
- **A simplified caption track** on both sessions — plain English for
  viewers whose first language is a signed one — labelled on screen as written by
  AI and not checked by a person, as the format requires.
- **Auto-dim**: the interpreter fades a little while the interpreter is not signing
  (applause, pauses) and returns the moment signing starts, driven by a per-second activity track
  the pipeline measures and the manifest carries.
- Resume where you left off, a loading screen, an end-of-programme card, any HTTPS
  manifest openable by address, plain-sentence errors with one focused action.

## What is in the catalogue

| Title | Length | Captions |
| --- | --- | --- |
| First Minister's Questions (Party Leaders), BSL — 17 Sep 2026 | 34:08 | Verbatim (Official Report) · Simplified |
| First Minister's Questions (Backbench Members), BSL — 15 Sep 2026 | 31:57 | Verbatim (Official Report) · Simplified |
| Ministerial Statement and Government Debate, BSL — two excerpts | 2:00 each | — |
| Demonstration — interpreter in a corner inset (synthetic) | 2:00 | Verbatim · Simplified |

Scottish Parliament material is used under the Scottish Parliament Copyright
Licence; every title's basis is in [`CONTENT-LICENCES.md`](CONTENT-LICENCES.md).
Media is served from Cloudflare R2 over HTTPS ([`HOSTING.md`](HOSTING.md)).

The interpreter rectangle on the Parliament titles is hand-measured (the manifest
says so: `method: manual-crop`). The pipeline's automatic extraction finds the
interpreter on every real broadcast tried and classifies the layout, but does not
yet bound the interpreter tightly enough to publish unattended — IoU 0.727 against ground
truth; [`experiments/e3-extraction/STATUS.md`](experiments/e3-extraction/STATUS.md).

## On AWS

The processing side runs on AWS, deployed with the CDK in [`infra/`](infra/):
S3 for sources and assets, ECR for the pipeline image (built by GitHub Actions
over OIDC — no stored keys), and **AWS Batch on Fargate** running the extraction
end to end: a full 32-minute session in about 40 minutes, for about $0.15 of
compute. **Amazon Transcribe** is the clock for caption alignment on AWS.
Amazon Bedrock was meant to write the simplified track; the account has been
refused Anthropic model access (support case open, `friction-log/015`), so the
simplified track in the catalogue was written by hand and is labelled as such.

## What's next

1. **Testing with Deaf viewers**, through Deaf-led organisations — nobody who signs
   has used this yet, and their answers decide the defaults.
2. **People checking the AI-written captions**: a review step where a named
   reviewer signs a simplified track off (`Caption.mark_reviewed` in the format)
   and the on-screen badge says who.
3. **Automatic bounding** good enough to drop the hand-measured rectangle (a
   spatial-uniformity stopping rule, shipped only if it beats IoU 0.727).
4. **More publishers and sign languages**, from footage they already publish.
5. **Publisher export**: the interpreter feed delivered as its own layer, no
   extraction needed.
6. **Live**, as the ITU model intends: the interpreter as a second stream.
7. **Fire TV hardware and the Appstore.**
8. **Wider access**: screen reader on hardware for deafblind viewers;
   viewer-adjustable interpreter timing.

## Run it

See [`app/README.md`](app/README.md): SDK versions, build, install on the Vega
Virtual Device, tests, and how to drive the device from a script.

## Layout

| Path | What |
| --- | --- |
| `app/` | The Vega React Native app. |
| `app/src/catalogue.ts` | The bundled catalogue, generated from published manifests by `tools/build-catalogue.mjs`. Do not hand-edit. |
| `app/assets/` | The two media files for the synthetic demonstration title, so one title plays with no network at all; the launcher icon. |
| `catalogue/published/` | The published caption tracks and manifests of the two full sessions, including the hand-written simplified track. |
| `catalogue/sources.yaml` | Every title: licence, attribution, production credit, acquisition route, and the hand-measured crop where one is used. |
| `tools/` | `build-catalogue.mjs` (regenerate the bundled catalogue), `publish-title.sh` (publish a processed title), `icon.swift` (draw the launcher icon from the design tokens). |
| `infra/` | AWS CDK: S3, Batch on Fargate, ECR, Transcribe and Bedrock IAM, optional CloudFront. Deployed; `infra/README.md` has the state. |
| `experiments/` | The two gate experiments, with their measurements: two decoders (passed on the VVD), extraction on real content (marginal, specifically). |
| `friction-log/` | One entry per platform snag, written as it happened. Index in `FRICTION-LOG.md`. |
| `CONTENT-LICENCES.md` | The acceptance rule, every title, every model, and its basis for inclusion. |
| `HOSTING.md` | Where the media lives and the exact state of the AWS account. |
| `notes/` | Session notes. |

The format, the validator, the extraction pipeline and the caption aligner live in
the public companion repository, [`signed-track-manifest`](https://github.com/saeedbashir/signed-track-manifest).

Built for the Build, Ship, Shape: Amazon Developer Hackathon (2026) — Fire TV track,
with the Open Source and AWS Builder mini challenges.

## Licence

Apache 2.0. See [LICENSE](LICENSE). Content licences are per title in
`CONTENT-LICENCES.md`.
