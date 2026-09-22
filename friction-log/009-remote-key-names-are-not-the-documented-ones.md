# 009 — The remote sends key names that are not in the documented list

**Date:** 2026-09-22
**Area:** Vega SDK · RN input
**Severity:** major

## Task attempted

Handle the three transport keys every television remote has: Play/Pause, Rewind and
Fast forward.

## Steps taken

`useTVEventHandler` delivers an `HWEvent` whose `eventType` is a string, and
`Libraries/TV/TVTypes.d.ts` gives the list to switch on. We mapped the names it
gives: `playpause` for the play/pause key, and left rewind and fast forward out
because the type union has `skip_backward` and `skip_forward` while the prose
comment six lines above it says `rewind` and `forward`, with nothing saying which
a device sends.

## Expected

Pressing Play/Pause to pause.

## Actual

Nothing. No error, no warning, no event of any kind reaching the handler that the
D-pad was reaching four times a second.

The device log made it look like a platform decision, and that cost the most time.
`inputd` reports the play/pause press going to an `INTERCEPT_LOW_INTERCEPTOR`
inside its own process and only the release reaching the application's client:

```
sendKeyToClient: sending key to intercept-capable client: id=7 pid=1170 : keyCode=[KEY_PLAYPAUSE] : state=down
sendKeyToClient: sending key to passthrough-capable client: id=14 pid=1574 : keyCode=[KEY_PLAYPAUSE] : state=up
```

That reads exactly like friction-log/008, where the platform really does keep a key
for itself, and we built a press/release pairing scheme around it. It was the wrong
diagnosis. Rendering the raw events on screen — the only instrument that works here,
see 006 — showed the truth in one screenshot:

```
right/0+ right/1. play/0+ play/1. forward/0+ forward/1.
```

Both halves of every press arrive. The key is simply not called `playpause`. It is
`play`. Fast forward is `forward`, not `skip_forward`. Neither name is the one the
type file's union offers, and `playpause` — which is in the union — never fires at
all.

## Workaround

Accept every spelling of each key:

```ts
playpause: 'playPause', pause: 'playPause', play: 'playPause',
rewind: 'seekBack', skip_backward: 'seekBack',
forward: 'seekForward', fastforward: 'seekForward', skip_forward: 'seekForward',
```

Verified on device for `play` and `forward`. Rewind stays unproven, because macOS
takes F3 for Mission Control before the virtual device sees it.

## Suggestion

Publish the list of `eventType` values a Vega device actually emits, and make the
union in `TVTypes.d.ts` that list. Today the union contains a name that never
fires (`playpause`) and omits ones that do (`play`, `forward`), and a comment in
the same file offers a third set. An application cannot discover this by reading;
it can only discover it by drawing the events on the screen.

Failing that, type `eventType` as an enum so an unknown name is a compile error
rather than a key that silently does nothing.

## Time lost

About two hours, most of it spent building a press/release pairing scheme for a
problem that did not exist, because the device log described a platform behaviour
that the JavaScript layer does not see.
