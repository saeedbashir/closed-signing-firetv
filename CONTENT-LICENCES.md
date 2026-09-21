# Content and model licences

Every title in the catalogue and every third-party model in the pipeline, with its
basis for inclusion. Judges will look; it costs an hour and it is the honest thing.

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
| _none yet_ | | | | | | | |

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
