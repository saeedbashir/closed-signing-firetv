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
| _pending download_ | First Minister's Questions (BSL) and related proceedings | The Scottish Parliament (SPCB) | In-house, Scottish Parliament TV | Scottish Parliament Copyright Licence, aligned with OGL v3.0 | Publisher's own Download tab on scottishparliament.tv, emailed 24-hour link | Official Report published separately; WebVTT not yet confirmed | Verified side-panel layout: chamber picture and interpreter sit side by side, nothing occluded, no fill needed |

### Obligations we carry for Scottish Parliament material

Three, from the licence at https://www.parliament.scot/about/copyright:

1. **Attribution, verbatim:** `Contains information licensed under the Scottish
   Parliament Copyright Licence`, with a link where the surface allows one. Defined
   once in `app/src/stm/attribution.ts`; never retyped.
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
