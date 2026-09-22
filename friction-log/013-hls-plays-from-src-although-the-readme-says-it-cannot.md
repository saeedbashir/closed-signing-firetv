# 013 — HLS plays from `src`, although the README says it cannot

**Date:** 2026-09-22
**Area:** Vega SDK · w3cmedia
**Severity:** minor (documentation understates the platform)

## Task attempted

Find out whether a Signed Track Manifest may point the player at a publisher's own
HLS stream, rather than at a progressive MP4 we host ourselves. It decides how much
work a producer has to do before their title plays here.

## Steps taken

1. Read `@amazon-devices/react-native-w3cmedia`'s README, which is explicit:
   > 1. URL Mode playback for non-adaptive streaming formats such as MP4, MP3, MKV
   > etc media files. … 2. Media Source Extension (MSE mode) for playback of adaptive
   > streaming formats like HLS and MPEG DASH. … Apps download the manifest and parse
   > it … and pass it to the player through `MediaSource` and `SourceBuffer` methods.
   Read as written, an `.m3u8` in `src` should fail, and an app wanting HLS should
   carry an MSE player such as Shaka.
2. Published a test manifest whose main video is the Scottish Parliament's own HLS
   URL (`…/.ism/.m3u8`, a single 1080p variant, AAC audio, no captions, no DRM) and
   whose signer track is one of our MP4s. Opened it on the Vega Virtual Device with
   the unchanged player: `VideoPlayer.src = url; load(); play()`.

## Expected

`MEDIA_ERR_SRC_NOT_SUPPORTED`, and the player's "could not be played" state.

## Actual

It played. First frame after a few seconds of loading, the clock advancing (0.2 s,
5.5 s, 20.1 s, 21.6 s in successive captures), the MP4 signer track playing beside
it at real time. Nothing in the app changed; the GStreamer pipeline underneath
`src` evidently handles HLS itself.

Not tested: multi-variant playlists, DASH, live streams, DRM, or an HLS signer
track. One publisher's single-variant VOD stream is one data point.

## Workaround

None needed — the point is that the documented restriction did not bite. For this
project it means the "open by address" screen can accept a manifest whose media is
the publisher's stream, and a producer need not re-host as MP4 first.

## Suggestion

Say what URL mode actually plays. If GStreamer's HLS handling is supported, the
README should list HLS under URL mode with its limits; if it is incidental and may
go away, say that instead, because an application that discovers it by accident
will build on it.

## Time lost

None — this one saved time. Recorded because a platform that does more than its
documentation claims is as much a documentation defect as one that does less, and
the next developer will read the README and add a player they do not need.
