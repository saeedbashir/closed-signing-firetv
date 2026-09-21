# Experiment 1 — candidates found so far

Frames kept as evidence of layout.

**Acceptance rule decided 2026-09-21** (full text in `CONTENT-LICENCES.md`). It
binds on *publication*, not possession, so each candidate is marked by tier:
**Tier 1** development corpus, no clearance needed, download freely;
**Tier 2/3** shown in the submission or shipped in the app, which needs basis,
route and derivative rights all three.

## Boston City TV — COVID-19 Media Availability series

> **TIER 1 — development corpus, 2026-09-21.** Not rejected; reclassified. The only
> obtainable copy is a third-party mirror, which disqualifies it from anything we
> publish — but downloading it to measure against is not redistribution, and the
> archive offers direct downloads, so no platform terms are broken.
>
> Fourteen correctly-shaped items with WebVTT captions is the best development
> material found so far. Use all of it. It never enters the shipped catalogue, the
> demo video or the screenshots.
>
> Its poor fill (difficulty 1.00) made it a weak *demo* title anyway — but a hard
> fill is exactly what a development corpus should contain.

`boston-2021-01-05-frame.png` is a real frame. It is exactly the shape the
project needs: mayor at a podium, interpreter in a top-right inset on a plain
grey backdrop, framed waist-up with the face fully visible throughout.

| | |
| --- | --- |
| Publisher | Boston City TV (municipal government access television) |
| Series size | **14 items** explicitly titled "with Sign Language", one uploader |
| Where | Internet Archive, collections `cobma`, `community_media`, `newsandpublicaffairs` |
| Files | HD `.m4v` ~187 MB and standard `.mp4` ~130 MB per item |
| Captions | **WebVTT included, English and Spanish** |
| Resolution | 854x480 on the standard file; check the HD before committing |
| Duration | ~24 minutes |
| Acquisition | direct download from archive.org — a public archive, not a platform rip |

Identifier pattern: `cobma-COVID-19_Media_Availability_<date>_with_Sign_Language`.

### Why the licence is not settled

- No licence is declared on any item in the series.
- The uploader is a private individual (`jhauser@pobox.com`), not the city.
- Subject tags include `Youtube`, suggesting these were mirrored from a
  YouTube channel rather than published to the archive by Boston.
- Massachusetts municipal works are not public domain by default the way
  federal works are.

So the chain is: city produces → possibly published to YouTube → mirrored to
archive.org by a third party. Each link needs to hold. **Your call.**

### What the pipeline measured

`boston-2021-01-05-detection.png` shows the detector's output. Orange is the
person, red is the window the pipeline chose.

| Measure | Value |
| --- | --- |
| Layout | corner-inset, correct |
| Extraction confidence | **1.00** |
| Inset size | 42% of frame width — large |
| Fill difficulty | **1.00, the worst possible** |
| Triage verdict | **poor** |

The detection is right and the fill is the problem. The inset sits over the
"City of Boston" banner and the moving mayor, so the patch left behind would be
a visible smear. Under the spec's own selection criteria this series is a poor
demo candidate even if the licence clears.

The red box also overshoots downward, past the inset border into the wall.
That is a known pipeline limitation, written up in `grow_window`'s docstring.

## What this means for Experiment 1

One source of fourteen correctly shaped items, with captions, obtainable
legitimately — but an unsettled licence and a poor fill. The pass bar wants
**ten titles, six with a clean low-detail region behind the interpreter**. This
series contributes shape but probably not demo quality.

Other publishers seen in the same archive search, not yet examined: City of
Pittsburgh (2), Tulsa (3), and a long tail of school districts. 127 items
across `community_media` mention sign language, so the pool is real; the
constraint is licence and fill quality, not volume.

## Publisher survey against the rule, 2026-09-21

Searched for a publisher satisfying all three clauses at once — basis, route and
derivative rights. Findings below, then the conclusion they force.

### Clause 1, basis, is solvable in several jurisdictions

| Jurisdiction | Basis | Strength |
| --- | --- | --- |
| US federal | 17 U.S.C. §105 — works of the US government are not subject to copyright | Unimpeachable |
| **Florida** | Fla. Const. Art. I §24(a) and Fla. Stat. §119.011, as read in *Microdecisions, Inc. v. Skinner*, 889 So. 2d 871 (Fla. 2d DCA 2004): a Florida agency cannot claim copyright in a public record unless the legislature expressly says so | **Strong, and unusual.** Covers state, county, district and municipal works. Narrow statutory exceptions (Dept. of the Lottery, Dept. of Citrus, university research) do not touch government-access broadcasting |
| UK | Open Government Licence v3.0, which expressly permits adaptation | Strong |

Massachusetts, by contrast, has no equivalent — which is why Boston was never
settled on basis.

### Clause 3, derivative rights, eliminates the big institutional libraries

- **European Parliament Multimedia Centre.** Self-hosted, free download, no account,
  attribution only — and the terms require material be "shown in its entirety" and
  not edited. We crop and re-render. Fails.
- **RTÉ News With Irish Sign Language** (found on the Internet Archive). Exactly the
  right shape. Licensed CC BY-**ND**. Fails. Note also that a licence tag applied by
  an archive uploader is not evidence of the rights holder's grant.

### Clause 2, route, is what actually kills it

- **The municipal access TV pool is one person.** 354 sign-language items across
  `community_media` — Boston, Seminole County FL, Tulsa, Cleveland, Pittsburgh and a
  long tail — all carry `uploader: jhauser@pobox.com` and a `Youtube` subject tag.
  It is a single third-party mirroring operation. The whole pool fails route
  uniformly, however good the underlying basis.
- **The White House is the painful one.** From January 2021 its briefings carried an
  ASL interpreter as a picture-in-picture box, bottom right — precisely the layout
  this project exists to unpack, on a federal public-domain basis, with derivative
  rights beyond argument. It went out on YouTube. The archived Biden White House
  briefing pages on `bidenwhitehouse.archives.gov` are **transcript-only, no video**.
  Basis and derivative rights are perfect; there is no file we may take.
- **NASA.** Self-hosted, public domain, direct download. Its official library returns
  **zero** ASL-interpreted broadcasts (0 video hits for "sign language interpreter",
  1 for "ASL" and it is unrelated). The ASL coverage exists only on YouTube.
- **Seminole County, Florida.** Public-domain basis, self-hosts its meeting archive —
  route and basis both clear. But its 18 ASL items are ASL-native PSAs, a presenter
  signing to camera. No inset to extract. Wrong shape.
- **DVIDS.** Public domain, self-hosted, direct download, the cleanest licensing
  found. Its sign-language results show interpreters *working in scene*, not composited
  insets. Worth a deeper search.

### THE CANDIDATE THAT CLEARS ALL THREE — Scottish Parliament TV

Found 2026-09-21, after the survey above had concluded the opposite. It is the
strongest result of the search and it may be the answer to Experiment 1.

**Scottish Parliament TV** (`scottishparliament.tv`) has broadcast **BSL-interpreted
First Minister's Questions since 10 January 2019 — over 190 sessions**, and the
archive extends well beyond FMQs: Backbench and Party Leader FMQs, Ministerial
Statements, Government Debates, the First Minister's Statement on the Programme for
Government. A keyword search for `bsl` on their archive returns at least 22 pages.

| Clause | Status | Evidence |
| --- | --- | --- |
| 1. Basis | **Clear** | Scottish Parliament Copyright Licence, expressly aligned with Open Government Licence v3.0 |
| 2. Route | **Clear** | The site has its own **Download** tab — an official, publisher-provided download of video or audio, emailed as a 24-hour link. Self-hosted via their own CloudFront distribution with HLS and DASH URLs published on the page. No platform terms involved |
| 3. Derivative rights | **Clear** | The licence permits you to "copy, publish, distribute and transmit", to **"adapt the Information"**, and to "exploit the Information commercially and non-commercially, for example, by combining it with other Information, or by including it in your own product or application" |

Restrictions are "not in connection with party political purposes" and "not in
connection with advertising endorsement". Neither touches an accessibility player.
Attribution required: *"Contains information licensed under the Scottish Parliament
Copyright Licence"*.

This is a better basis than anything American found in the search. It is an explicit
grant of adaptation rights from the publisher, not an inference from the absence of
copyright.

#### CONFIRMED 2026-09-21: the layout is right and the pipeline reads it

Saeed opened the player and the Share tab, which exposes the publisher's own HLS and
DASH URLs. A 120-second excerpt was pulled at **1920x1080**, H.264/AAC, 25fps — far
better source quality than the 854x480 Boston material.

**It is a true side panel.** The chamber picture occupies x 0–1080 and the
interpreter's purple panel x 1080–1920, both between y=108 and y=868, with full-width
Parliament branding bands above and below. The chamber picture does **not** continue
behind the interpreter, so lifting the panel occludes nothing and **no fill is needed
at all**.

The pipeline, unmodified:

```
layout: side-panel   confidence: 1.00
rect: {x: 1038, y: 84, w: 882, h: 996}      ground truth {x: 1080, y: 108, w: 840, h: 760}
IoU 0.727
```

**Layout classified correctly.** Compare the Boston mean of 0.629 across 14 corner
insets. The boundary here is a hard, high-contrast edge against a picture that is
neither static nor uniform — the opposite of a press conference backdrop — so growth
stops close to where it should instead of walking across a flat wall.

The residual error is the same over-growth, milder:

| edge | chosen | truth | over |
| --- | --- | --- | --- |
| left | 1038 | 1080 | **42 px into the chamber picture** |
| top | 84 | 108 | 24 px into the branding band |
| bottom | 1080 | 868 | 212 px into the branding band |

Only the left edge matters. 42 px means the extracted signer layer carries a thin strip
of chamber along its edge, and the main picture loses the same strip — visible on a
television, though small. Top and bottom over-grow into Parliament branding, which is
cosmetic and arguably wants trimming anyway since **the SPCB's Corporate Identity is
not licensed to us**.

#### What this changes

The content we can license is the layout the pipeline handles **best**, not worst. That
inverts the risk: the inpainting path, which the corner-inset material needs and which
the over-growth defect most damages, is not on the critical path for a shipped
catalogue. Boston keeps earning its place as the hard development case.

#### Still to do, and it is Saeed's

The excerpt above came from the **Share** tab's HLS URL, not the **Download** tab.
The licence governs the use either way and the Share tab publishes those URLs openly,
but the Download tab requires ticking "I have read and agree to the Terms and
Conditions", and **an accepted-terms record is a stronger answer to a judge asking how
the file was obtained.** For anything that ships, use the Download tab.

#### Two things still to check, and both are Saeed's

1. ~~The layout is unconfirmed.~~ **Resolved above: true side panel, confirmed on a
   real frame.**
2. **The download requires accepting terms and giving an email address.** The form
   carries "I have read and agree to the Terms and Conditions". **Accepting a licence
   is a legal act and it is yours, not mine** — I have not ticked it and will not.

#### The caveat worth weighing

The licence excludes "third-party rights the SPCB is not authorised to license". A
BSL interpreter at FMQs is very likely a contracted professional, and their
performance is exactly the kind of third-party right that carve-out contemplates.
This is the same interpreter-performance question recorded in the principles above,
but here it is named in the licence itself rather than left implicit.

Two things cut the other way: the Parliament itself broadcasts, archives and offers
downloads of the interpreted feed under this licence, which is a strong signal it
considers itself authorised to do so; and our use presents the interpreter *more*
prominently and under viewer control, with attribution, rather than cropping them out
of the record. It is a judgement, not a certainty, and it is yours.

#### If it holds

BSL, not ASL. The STM format already carries `sign_language` as ISO 639-3, so `bfi`
costs nothing structurally — and a catalogue that is not ASL-only is a better
argument for the format than one that is. The English captions question needs
checking; the Official Report is published separately and may serve.

### The conclusion this forces


**The scarcity is not of interpreted video. It is of interpreted video that is
simultaneously on an acceptable basis, modifiable, and obtainable outside YouTube.**

Each clause is satisfiable alone and any two are satisfiable together. Governments
publish interpreted programming through YouTube almost without exception, and the
institutions that self-host either carry ASL-native presenters — which have no inset
to lift — or forbid editing.

This is a real finding about the accessible-media landscape, not merely a project
setback, and it is worth saying in the submission: the interpreted broadcast archive
that exists is, in practice, locked to one platform's terms.

### Still unexamined

- DVIDS searched by layout rather than keyword.
- UK, Scottish and Welsh material under OGL v3.0, which permits adaptation — the
  open question is purely whether anything is self-hosted rather than YouTube-embedded.
- Wikimedia Commons, where every file is verified free and derivative rights are
  guaranteed. Unreachable from this machine (TLS blocked, both directly and through
  the fetch tool); needs checking from a browser.
- Florida municipalities beyond Seminole whose meetings carry an interpreter inset.
