# Content and model licences

Every title in the catalogue and every third-party model in the pipeline, with its
basis for inclusion. Judges will look; it costs an hour and it is the honest thing.

## The acceptance rule

Decided 2026-09-21, amended the same evening once the development/publication
distinction was drawn properly.

**The rule binds on publication, not on possession.** Downloading a file to develop
and measure against is not redistributing it. Clearance is needed in exactly two
places, because those are the two places we publish.

### Tier 1 — development corpus. No licence clearance needed.

Material used to build, tune and measure the pipeline. Never bundled in a build,
never hosted on our R2 bucket, never visible in the submission video, screenshots or
the Devpost page.

One constraint still applies, and it is not a copyright one: **acquisition route.**
No platform rips. Downloading from YouTube breaks YouTube's terms whatever the
copyright position, and the hackathon rules require compliance with third-party
terms. A public archive offering direct downloads is fine, including third-party
mirrors — the mirror problem is a redistribution problem, and we are not
redistributing.

Download broadly here. A large, varied development corpus is what proves the
extraction generalises, and it costs nothing but disk.

### Tier 2 — shown in the submission. Full clearance.

Anything visible in the demo video, the screenshots or the Devpost page. **A demo
video is a publication.** Whatever is on screen is being republished by us, in
modified form, to Devpost and YouTube.

### Tier 3 — shipped in the app. Full clearance.

Anything bundled into the build or served from our bucket.

### The three clauses, for Tiers 2 and 3

1. **Basis.** A work of the US federal government, **or** a publisher applying an
   explicit open licence (CC0, CC BY, or similar), **or** a statute placing that
   publisher's works in the public domain.
2. **Route.** From the publisher's own hosting, the publisher's own account on a
   public archive, or an official open-data or agency download. A third-party mirror
   does not qualify here: the uploader cannot grant a right they never held.
3. **Derivative rights.** The basis must permit *modification*, not merely
   redistribution. This project crops the interpreter out, fills the hole behind them
   and re-renders the result. That is a derivative work. A licence granting free
   redistribution but forbidding edits does not qualify.

**Public accessibility is not a basis.** That a file can be downloaded says nothing
about whether it may be republished.

Clause 3 rules out more than it first appears: CC BY-ND, CC BY-NC-ND, and terms of
the "may be reused but must be shown in its entirety" kind, which are common in
institutional media libraries. Found the hard way — see the European Parliament note
in `catalogue/candidates/README.md`.

We are not seeking permission from rights holders on this project, so every Tier 2
and Tier 3 title must clear the rule unaided. Nothing is published on the strength
of a licence we expect would probably be granted if asked.

## Principles

- Works of the US federal government are generally not subject to copyright. That is
  why federal material anchors the catalogue.
- **Contractor-produced material can be copyrighted even when an agency publishes
  it.** We record the production credit, not just the publisher.
- **State and municipal works are not public domain by default.** They count only
  where the state has a public-domain statute for government works or the publisher
  applies an explicit open licence.
- **People on camera have publicity rights** separate from copyright. Low risk for a
  non-commercial demo; noted.
- **Interpreters are people with rights.** A sign language interpreter's performance
  may carry its own protections depending on jurisdiction. We are republishing their
  work in a new presentation. This is recorded as an open question, not pretended
  settled.
- **Files are obtained without breaking platform terms.** No YouTube rips. Agency
  downloads, public archives, or direct requests, and the route is recorded.

## Titles

| id | Title | Publisher | Production credit | Licence basis | Acquisition route | Captions | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sp-fmqs-bsl-2026-09-17` | First Minister's Questions (Party Leaders), BSL — 120 s excerpt | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | Scottish Parliament Copyright Licence, aligned with OGL v3.0 | Publisher's own stream, from the event page's Share tab | None published with the stream (verified: no text track in the HLS or DASH manifests) | Side panel; hand-measured crop `{1080,108,840,760}`; `method: manual-crop` |
| `sp-fmqs-backbench-bsl-2026-09-15` | First Minister's Questions (Backbench Members), BSL — 120 s excerpt | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | as above | as above | None | Same house crop |
| `sp-ministerial-standards-bsl-2026-09-02` | Ministerial Statement: Raising Standards and Delivering Excellence for Every Child, BSL — 120 s excerpt | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | as above | as above | None | Same house crop |
| `sp-fmqs-bsl-2026-09-17-full` | First Minister's Questions (Party Leaders), BSL — full session, 34 min | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | as above; the caption text is the Official Report, SPCB copyright under the same licence | Publisher's own stream (`hlsStreamUrl` from `/Player/PlaybackModel/{eventId}`) | **Verbatim: the Official Report's text, unchanged, timed automatically** (see "Caption text and timing" below). No `generatedBy`. **Simplified: written by hand from the Report by an AI assistant in the developer's editor**, `generatedBy` set, `reviewed: false`, badged by the player. | Same house crop; `activity` measured over the whole session |
| `sp-fmqs-backbench-bsl-2026-09-15-full` | First Minister's Questions (Backbench Members), BSL — full session, 32 min | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | as above | as above | **Verbatim: the Official Report's text, unchanged, timed automatically** (item `meeting=20224&iob=225692`, "First Minister's Question Time — Back-bench Members"). No `generatedBy`. No simplified track. | Same house crop; continuous signing (0.8 % idle) |
| `sp-debate-programme-government-bsl-2026-09-01` | Scottish Government Debate: Programme for Government 2026-31, BSL — 120 s excerpt | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | as above | as above | None | Same house crop |
| `demo-corner-inset` | Demonstration — interpreter in a corner inset (synthetic) | Built for this project | `harness/make_corpus.py` over a test pattern | Public domain: the person is Dorothea Lange's *Migrant Mother* (FSA, 1936, US federal work); the pattern is generated | Not acquired; generated | Hand-written verbatim and simplified tracks (no `generatedBy`) | Corner inset; `method: detected-crop`, confidence 0.7045 |

### Obligations we carry for Scottish Parliament material

Three, from the licence at https://www.parliament.scot/about/copyright:

1. **Attribution, verbatim:** `Contains information licensed under the Scottish
   Parliament Copyright Licence`, with a link where the surface allows one. It lives
   in each title's manifest as `source.attribution` and is displayed from there on the
   title page and in Settings — one string, written by the pipeline from
   `catalogue/sources.yaml`, never retyped in the app.
2. **No implication of official status or SPCB endorsement.** The app presents these
   as source material with a credit, never as a Parliament product.
3. **Never for party-political purposes or advertising endorsement.**

Two exclusions bind us as much as the grant does:

- **Third-party rights the SPCB is not authorised to license.** The BSL interpreter is
  very likely a contracted professional. The Parliament broadcasts, archives and
  offers downloads of her work under this licence, which is a strong signal it
  believes it may — but that is an inference. Recorded as an open question, in line
  with the interpreter-rights principle above, not treated as settled.
- **The SPCB's Corporate Identity is not licensed.** The broadcast carries a purple
  Parliament frame. We crop to the chamber picture and the interpreter panel and never
  reproduce the logo or wordmark as decoration.

### Caption text and timing on Scottish Parliament titles

The stream carries no text track. The verbatim caption track on a full session
is the **Official Report** of that item — the Parliament's edited-verbatim record,
written by its reporters, with speakers named and stage directions such as
`[Applause.]` kept — and we publish its words **unchanged**. The Report is SPCB
copyright under the same Scottish Parliament Copyright Licence as the video, so
the attribution string already on the title covers it.

What we add is *timing*: the pipeline recognises the audio with an open-source
speech model (faster-whisper, MIT; the model's own words are discarded), aligns the
Report's words to the recognised words, and cuts cues. On the Party Leaders session
89 % of the Report's 4,855 words sit on a word the recogniser heard; the rest are
placed by rule between their neighbours. So the track is human text on machine
timing, and is labelled exactly that: no `generatedBy` (nothing in it was
generated), and a `NOTE` at the top of the file naming the source of the words and
the source of the timing. The alignment figures are in the title's `analysis.json`.

The **simplified** track on the same title is different in kind and labelled
differently. Its text is not the Report's: it is a plain-English rewrite of the
Report, written by hand by an AI assistant (Claude) in the developer's editor —
not by the pipeline, and not by Bedrock, whose access was still pending — and
its cues take their times from the verbatim cues they replace. It carries
`generatedBy` naming that origin and `reviewed: false`, the player badges it as
not checked by a person, and no configuration can present it otherwise.
Where the Report edited out what was said — a false start, a heckle — the cue
that would have covered it simply is not there, and where it prints what was not
said aloud (an expanded title) that text passes briefly at the point it belongs.

## Models

| Model | Role | Code licence | Weights | Source |
| --- | --- | --- | --- | --- |
| YOLOX-Tiny | Person detection in the extraction pipeline | Apache-2.0 | Release asset of the same Apache-2.0 repository, no separate weights licence; trained on COCO 2017 (annotations CC BY 4.0). SHA-256 `427cc366d34e27ff7a03e2899b5e3671425c262ea2291f88bb942bc1cc70b0f7` | https://github.com/Megvii-BaseDetection/YOLOX |

Rejected: YOLOv8 (`ultralytics`) — AGPL-3.0, incompatible with an Apache-2.0
distribution.

## Fonts

| Font | Licence | Use |
| --- | --- | --- |
| Inter | SIL Open Font License 1.1 | All app typography. Bundled; we do not depend on the system font. |

## Development-only data

| Dataset | Terms | Use |
| --- | --- | --- |
| How2Sign | Non-commercial, research only; underlying source videos not redistributable | Pipeline development and tuning only. Never in the shipped catalogue. |
| Boston City TV COVID-19 Media Availability series (14 items) | No declared licence; obtained from a third-party mirror on the Internet Archive via direct download, no platform terms breached | Tier 1. Pipeline development, fill-difficulty measurement and the IoU harness. Never shipped, never shown. |
