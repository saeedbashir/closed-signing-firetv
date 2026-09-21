# Experiment 1 — candidates found so far

Frames kept as evidence of layout. Licence for every item below is **undecided
and yours**; nothing here is cleared for the catalogue.

## Boston City TV — COVID-19 Media Availability series

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
