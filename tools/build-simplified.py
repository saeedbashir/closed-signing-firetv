"""Build a simplified caption track from hand-written ranges over the verbatim cues.

    uv run --project ../signed-track-manifest python tools/build-simplified.py <title-id>

Reads catalogue/simplified-src/<id>/ranges.txt — one line per simplified caption,
"<first>-<last>|<text>", naming the verbatim cues it replaces — and the published
verbatim track in catalogue/published/<id>/captions/. Writes simplified.en.vtt beside
the verbatim one.

Nothing is timed by hand. A line starts when its first verbatim cue starts and ends
when its last one ends; it is then held on screen for reading time (2.5 words a
second) if the gap before the next line allows; and text that will not fit the
two-line plate, or would stay up longer than eight seconds, is cut in two over the same span, in proportion to the words.
Every verbatim cue must belong to exactly one line, in order, or the build stops.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from stm_pipeline.align import MAX_LINE_CHARS, _break_lines
from stm_pipeline.captions_vtt import Cue, build_vtt, parse_vtt

ROOT = Path(__file__).resolve().parents[1] / "catalogue"
READ_WPS = 2.5
#: Longer than this, a caption has gone stale on screen; it is split like an over-long one.
MAX_HOLD_S = 8.0
NOTE = (
    "Simplified English, written by hand from the Official Report by an AI assistant "
    "(Claude) in the developer's editor, not by the pipeline; not checked by a person. "
    "Timing: the verbatim track's cues, held for reading time where the gap allows."
)


def read_ranges(path: Path) -> list[tuple[int, int, str]]:
    out = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        if not raw.strip() or raw.startswith("#"):
            continue
        span, text = raw.split("|", 1)
        lo, _, hi = span.partition("-")
        out.append((int(lo), int(hi or lo), text.strip()))
    return out


def fits(text: str) -> bool:
    lines = _break_lines(text).split("\n")
    return len(lines) <= 2 and all(len(line) <= MAX_LINE_CHARS for line in lines)


def split_text(text: str) -> list[str]:
    """Two pieces at the sentence, clause or space boundary nearest the middle."""
    n = len(text)
    best: tuple[float, int] | None = None
    for pattern, bonus in ((r"[.?!] ", 0), (r"[;:] ", 6), (r"[,—] ", 12), (r" ", 20)):
        for m in re.finditer(pattern, text):
            score = abs(m.end() - n / 2) + bonus
            if best is None or score < best[0]:
                best = (score, m.end())
        if best is not None and best[0] < n * 0.35:
            break
    if best is None:
        return [text]
    return [text[: best[1]].strip(), text[best[1] :].strip()]


def build(title_id: str) -> Path:
    captions = ROOT / "published" / title_id / "captions"
    verbatim, _ = parse_vtt((captions / "verbatim.en.vtt").read_text(encoding="utf-8"))
    by_index = {c.index: c for c in verbatim}
    lines = read_ranges(ROOT / "simplified-src" / title_id / "ranges.txt")

    expect = 1
    for lo, hi, _ in lines:
        if lo != expect or hi < lo:
            raise SystemExit(f"ranges: line for {lo}-{hi} should start at cue {expect}")
        expect = hi + 1
    if expect != len(verbatim) + 1:
        raise SystemExit(f"ranges cover cues 1-{expect - 1} of {len(verbatim)}")

    cues = [[by_index[lo].start_s, by_index[hi].end_s, text] for lo, hi, text in lines]
    for i, c in enumerate(cues):
        nxt = cues[i + 1][0] if i + 1 < len(cues) else c[1] + 2.0
        need = len(str(c[2]).split()) / READ_WPS
        if c[1] - c[0] < need:
            c[1] = min(nxt, c[0] + need)

    i = 0
    while i < len(cues):
        start, end, text = cues[i]
        if (fits(str(text)) and end - start <= MAX_HOLD_S) or len(str(text).split()) < 4:
            i += 1
            continue
        parts = split_text(str(text))
        if len(parts) == 1:
            i += 1
            continue
        w1, w2 = len(parts[0].split()), len(parts[1].split())
        mid = start + (end - start) * w1 / (w1 + w2)
        cues[i : i + 1] = [[start, mid, parts[0]], [mid, end, parts[1]]]

    out = [Cue(n + 1, round(s, 3), round(e, 3), _break_lines(str(t))) for n, (s, e, t) in enumerate(cues)]
    for a, b in zip(out, out[1:], strict=False):
        if a.end_s > b.start_s + 1e-9:
            raise SystemExit(f"overlap at cue {a.index}")
    long = [c.text for c in out if any(len(x) > MAX_LINE_CHARS for x in c.text.split("\n"))]
    dest = captions / "simplified.en.vtt"
    dest.write_text(build_vtt(out, [f"NOTE {NOTE}"]), encoding="utf-8")
    words = sum(len(c.text.split()) for c in out)
    verbatim_words = sum(len(c.text.split()) for c in verbatim)
    print(f"{title_id}: {len(lines)} lines -> {len(out)} cues, {words} words "
          f"(verbatim {verbatim_words}), lines over {MAX_LINE_CHARS}: {len(long)} -> {dest}")
    return dest


if __name__ == "__main__":
    build(sys.argv[1])
