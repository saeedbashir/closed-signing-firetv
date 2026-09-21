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

### What this means for the reverted fix

A border-snapping fix was tried earlier and reverted: it corrected the real Boston
clip but regressed 4 of 6 synthetic layouts. On this evidence **the synthetic corpus
was the misleading party.** Six generated layouts with clean rectangular insets on
flat backdrops do not reproduce what real broadcasts do — a remote interpreter in a
video-call tile, composited over a live picture that continues behind it.

The fix should be reinstated and the synthetic harness treated as a regression guard,
not as ground truth. Real content is now available to score against.

### Caveats on this run

- These are 120-second excerpts pulled by range request, except `02.mp4`, which is the
  full 1523 s broadcast. The interpreter tile is static for a whole broadcast, so an
  excerpt is representative for layout and fill, but not for anything time-varying.
- `-c copy` range extraction leaves a torn GOP at the tail; ffmpeg logs NAL unit
  errors on some clips. Detection was unaffected.
- No IoU score against ground truth: the 14 clips are unlabelled. `stm harness label`
  exists for this and the labelling is manual. The failure above is visible without
  it, but a number would be better than three screenshots.
- One publisher only. Every clip is Boston City TV, so the layout conventions are one
  production team's habits.

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
