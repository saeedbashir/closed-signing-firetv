# Experiment 3 — can we locate an interpreter reliably enough to crop them?

2026-09-21, on 14 real broadcasts. Previous evidence was six synthetic layouts.

## Answer: locating, yes. Bounding, no — and the bound is what everything downstream depends on.

### What passed, unambiguously

**14 of 14 real broadcasts detected, confidence 0.96 to 1.00.** Not one miss, across
two years of Boston City TV press conferences, indoor and outdoor, remote and
in-room interpreters, two source resolutions (854x480 and one at 480x360). Finding
*that there is an interpreter and roughly where* is solved on real content.

### What failed

The chosen window **over-grows past the inset border**, and because every later
measurement is computed over that window, the whole triage ranking is unreliable.

This is the limitation already written into `grow_window`'s docstring in
`signed-track-manifest`. What is new is the consequence: it does not merely produce a
slightly generous crop, it **inverts the ranking**.

### The causal chain

| Step | What happens |
| --- | --- |
| 1 | The window grows downward past the interpreter tile's real border |
| 2a | On 3 clips it grows so far that the region spans nearly the full frame height on the right, and the layout classifier reads it as **side-panel** |
| 2b | A side panel needs no fill, so fill difficulty is set to **0.00** |
| 2c | Those 3 clips are ranked **"excellent"** — the best scores in the run |
| 3a | On the other 11, the window roughly doubles in height, taking in podium, captions and backdrop |
| 3b | Fill difficulty is computed over that inflated region and pins at **~1.00** |
| 3c | Those 11 are ranked **"poor"** |

**So the three best-scoring clips are the three worst-analysed ones, and the eleven
"poor" scores are measured over regions about twice the size they should be.**

### The number

All 14 clips labelled by reading the interpreter tile's visible border off a
coordinate grid rendered over a clean frame. Scored with the project's own harness:

```
clip      iou    conf  layout          clip      iou    conf  layout
01.mp4  0.818   1.00  corner-inset     08.mp4  0.823   1.00  corner-inset
02.mp4  0.549   0.99  side-panel       09.mp4  0.465   1.00  corner-inset
03.mp4  0.384   1.00  side-panel       10.mp4  0.718   0.97  corner-inset
04.mp4  0.591   0.97  corner-inset     11.mp4  0.777   1.00  corner-inset
05.mp4  0.689   1.00  corner-inset     12.mp4  0.561   0.98  corner-inset
06.mp4  0.720   0.96  corner-inset     13.mp4  0.623   0.99  corner-inset
07.mp4  0.535   1.00  corner-inset     14.mp4  0.551   0.99  side-panel

0/14 pass at IoU >= 0.85; mean IoU 0.629; range 0.384 to 0.823
```

**Nothing passes, but the spread matters.** Mean 0.629 implies the window is on
average about 1.6x the area it should be, not the 2x the worst cases suggested. Two
clips (01 at 0.818, 08 at 0.823) come close to the 0.85 threshold; the floor is
clip 03 at 0.384.

All three clips the layout classifier called **side-panel** sit below the mean —
0.549, 0.384, 0.551. The misclassification and the over-growth are the same defect
seen from two angles: grow too far and the region starts to look like a panel.

A correction worth recording: an earlier pass scored only clips 03, 09 and 14 and
reported mean IoU 0.467. That was a biased sample — those three had already been
picked out as failures, two of them the misclassified side-panels. **0.629 across the
full corpus is the number to use.** The conclusion is unchanged; the severity was
overstated.

Hand-computed IoUs for 03, 09 and 14 from the grid readings matched the harness to
three decimal places, which cross-checks both the readings and the harness.

Labels live in `signed-track-manifest/harness/ground_truth-boston.yaml`, accurate to
roughly ±8 source pixels: enough to separate a correct window from one half again too
large, not enough to tune an edge detector on.

### The evidence

- `03-misread-as-side-panel.png` — red is the chosen window, orange the person
  detection, white the interpreter's actual video tile. The window takes the full
  right-hand third, top to bottom. But the press conference picture **continues
  behind and around** the tile: the blue "CITY of BOSTON" backdrop and the people at
  the podium run to the right edge. This is an inset over a full-width picture, not a
  side panel, so removing the interpreter *would* leave a hole. The 0.00 fill
  difficulty is wrong.
- `14-window-swallows-second-person.png` — the clearest failure. The interpreter tile
  ends around y=245; the chosen window runs to y=410 and captures **a second person
  standing in the main scene**, whose legs and shoes are inside the red box, plus a
  yellow plough. Cropping this window would lift a bystander out of the programme
  along with the interpreter.
- `09-window-overgrows-downward.png` — a correctly classified corner inset showing the
  same root cause. Tile ends near y=195; window runs to y=398. The extra area is
  plain blue backdrop, which is *easier* to fill than what is behind the tile — so
  here the over-growth distorts the difficulty score without changing the layout call.

### The fix was tried, measured, and does not work

**This section previously recommended reinstating the reverted border-snapping fix and
treating the synthetic harness as a guard rather than ground truth. That
recommendation was wrong, and testing it is how we know.**

Border snapping was implemented and scored on both corpora. Each edge searched between
the person box and the grown edge for the largest step in mean grey, and moved to it —
inward as well as outward, which plain growth can never do.

```
corpus            baseline -> snapped
synthetic (6)       0.617  ->  0.562     one side panel reclassified as a corner inset
real (14)           0.629  ->  0.618     worst: clip 10, 480x360, 0.718 -> 0.543
```

**Worse on both.** The earlier revert was attributed to the synthetic corpus being
unrepresentative; real content says the approach itself is wrong. Four real clips
improved slightly and nine got worse. The largest single regression is the only clip at
a different resolution, which suggests a band and margin fixed in pixels cannot hold
across source sizes — but the effect is a wash even setting that clip aside.

Why it fails, as far as the evidence shows: **the strongest grey step near the edge is
frequently not the window border.** A shoulder against a backdrop, a caption bar, the
edge of a podium all produce larger steps than the border does on some frames.

Not yet ruled out: making growth *stop* correctly rather than correcting it afterwards,
by requiring a candidate band to be spatially uniform as well as temporally still. The
programme beside these windows is static, but it is not featureless — which is the
property the current test misses.

### A harness you cannot rebuild is not a harness

The synthetic corpus could not be regenerated: its source image had been deliberately
left out of the repository as "media", and was lost. The first substitute produced a
corpus scoring **0.000 on every clip with zero detections** — a dead instrument that
prints five clean FAIL rows and reads exactly like a verdict. Only the identical
baseline gave it away.

A public-domain NASA photograph is now committed at `harness/source/` with provenance,
so the guard is rebuildable. 486 KB, and it is a still rather than media.

### Caveats on this run

- These are 120-second excerpts pulled by range request, except `02.mp4`, which is the
  full 1523 s broadcast. The interpreter tile is static for a whole broadcast, so an
  excerpt is representative for layout and fill, but not for anything time-varying.
- `-c copy` range extraction leaves a torn GOP at the tail; ffmpeg logs NAL unit
  errors on some clips. Detection was unaffected.
- Labels were read off a rendered coordinate grid rather than drawn with
  `stm harness label`, which needs a GUI. All 14 are labelled.
- **One publisher, and less varied than 14 implies.** Every clip is Boston City TV.
  Clips 02 and 14 are the same annual salt-pile event staged near-identically a year
  apart, the same interpreter appears in almost every broadcast, and only clip 10
  differs in resolution (480x360) and era. This is one production team's house style
  sampled 14 times, so 14/14 detection is weaker evidence of generality than the
  count suggests.

## Verdict against the gate

**Marginal, and specifically fixable.** Detection is solved; bounding is not, and the
defect is understood, reproducible, and has a known candidate fix that was rejected on
synthetic evidence. That is a better position than a vague pass, because it names the
work.

The gate's own wording is that without extraction there is no project. Extraction
finds the interpreter every time. What it cannot yet do is say exactly where the tile
ends — and until it can, the triage verdicts should not be trusted to choose demo
titles.

## Provenance

Corpus: 14 Boston City TV items, Internet Archive direct download, Tier 1 development
material under `CONTENT-LICENCES.md`. Not for publication, not in the shipped
catalogue, not in the demo video. Manifest at `dev-corpus/boston/PROVENANCE.tsv`.
