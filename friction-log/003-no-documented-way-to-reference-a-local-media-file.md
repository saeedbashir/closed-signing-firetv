# 003 — VideoPlayer rejects plain HTTP, and says MEDIA_ERR_SRC_NOT_SUPPORTED

**Date:** 2026-09-21
**Area:** Vega SDK / react-native-w3cmedia / Vega Virtual Device
**Severity:** major
**Resolved:** partly, and the first resolution was wrong. HTTPS works; so does a
file bundled in the package, from a bare path. See the correction below.

## Task attempted

Play a local, unencrypted MP4 in a Vega app on the Vega Virtual Device, in
order to measure whether two video surfaces can decode simultaneously.

## Steps taken

Everything else worked first time. `vega project generate`, `npm install`,
`npm run build:app`, `vega run-app` all succeeded; the app installed, launched,
and the media pipeline created and registered **two** video surfaces without
error. The only unsolved step was telling `VideoPlayer` where the media is.

Three approaches, all rejected by the media backend:

1. **HTTP from the host over reverse port forwarding.**
   ```
   vega device start-port-forwarding --port 8099 --forward false
   ```
   `vega device run-cmd --command 'curl ... http://127.0.0.1:8099/signer.mp4'`
   returns `HTTP=200`, and the host server logs the request. The media pipeline
   still fails:
   ```
   MPB UNF callback: Open failed -1
   set_src_uri: MPB Call failed with code: 50004
   makeMediaError: code= 4        (MEDIA_ERR_SRC_NOT_SUPPORTED)
   ```
   Media plays in a separate system process, which the port forward does not
   reach.

2. **A `file://` URI to a file pushed with `vega device copy-to`.** GStreamer
   takes the URI literally as a path:
   ```
   gst_file_src_start, <filesource>, error: No such file "file:///tmp/main.mp4"
   ```

3. **A bare path to the same file.** The file is demonstrably there and
   readable by the app's own user:
   ```
   $ vega device run-cmd --command 'ls -l /tmp/main.mp4; id'
   -rw-rw-rw- 1 app_user app_user 43315945 /tmp/main.mp4
   uid=5000(app_user) ...
   ```
   The pipeline still reports:
   ```
   gst_file_src_start, <filesource>, error: No such file "/tmp/main.mp4"
   ```
   So the app runs in a mount namespace where `/tmp` is not the `/tmp` that
   `vega device run-cmd` sees. Nothing says this, and the error actively
   suggests the opposite.

## Expected

A "play a local file" example, or one sentence saying local files must be
packaged with the app and giving the on-device path convention.

## Actual

The Vega video sample (`AmazonAppDev/vega-video-sample`) only plays remote
URLs, so it does not answer this. `MediaElement::set_src` takes a string and
the documentation does not say what forms of string are valid. Every failure
surfaces as `MEDIA_ERR_SRC_NOT_SUPPORTED`, which reads like a codec problem and
sends you off investigating the wrong thing. The GStreamer "No such file"
warning, which is the actual cause, only appears if you grep the full device
log for `GSTLOG`.

## Root cause, found eventually

```
MEDIA_PLAYER:MediaPlayerUtils.cpp(113) isUriSchemeSecure
Got an insecure protocol/scheme http, return error
```

**The media player refuses plain HTTP.** Serving the same file over HTTPS works
immediately, and the experiment ran first time after that. The local-file
approaches above fail for their own separate reasons, but the HTTP one — the
one that looked most likely to work, since the device shell could fetch the URL
— failed purely on the scheme.

## Workaround

Serve media over HTTPS. Amazon's own reference assets at
`https://d1v0fxmwkpxbrg.cloudfront.net/videos/mp4/...` are the quickest way to
a first result.

## Suggestion

Two small things would have saved the evening:

1. **State the HTTPS requirement on the media player page.** One sentence.
   Every sample URL happens to be HTTPS, so the constraint is invisible until
   you try otherwise, and then it presents as a codec error.
2. **Distinguish "source rejected" from "format not supported"** in the error
   surfaced to JavaScript. Code 4 for a refused scheme, a missing file, and an
   unreachable host is three different problems wearing one number, and the
   real reason is only in the native log.
3. Add a local-file example, or state that local files must be packaged and
   give the on-device path convention.

## Time lost

About two hours, nearly all of it on this one step. Everything from SDK install
to a running, instrumented app on the virtual device took well under an hour,
and the experiment itself produced a clean result within a minute of the source
finally loading.

## CORRECTION, 2026-09-22 — a local file does work

The conclusion above, that media must be remote, was drawn from files **pushed to the
device** with `vega device copy-to`. Those really are unreachable: the app runs in a
mount namespace where `/tmp` is not the `/tmp` the shell sees. What was never tried is
a file **bundled inside the `.vpkg`**, which lives in the app's own namespace.

It plays. Two things had to be right at once, which is why it looked like a flat
refusal:

1. The asset must be bundled, not pushed. Metro already treats `mp4` as an asset
   extension, so `require('../assets/demo-main.mp4')` is enough. (`vtt` is not in
   `assetExts`; caption sidecars need it adding.)
2. The path must be bare. `Image.resolveAssetSource` returns
   `file:///pkg/bundle/assets/assets/demo-main.mp4`, and GStreamer treats the scheme
   as part of the filename — the same literal-URI behaviour as step 2 of the original
   report. Strip `file://` and hand over `/pkg/bundle/assets/assets/demo-main.mp4`.

Measured on device, with an on-screen readout because nothing else can observe a Vega
app:

```
file:///pkg/bundle/assets/assets/demo-main.mp4   readyState=0   (nothing happens)
/pkg/bundle/assets/assets/demo-main.mp4          readyState=2   (plays)
```

So the platform is stricter than it is limited, and the error message pointed away from
the answer in both cases.

This matters beyond neatness. The hackathon rules ask that the repository contain
everything needed for the project to be functional, and a judge should be able to press
play without our storage bucket being alive. The app now prefers bundled media and
falls back to HTTPS, in `app/src/bundledMedia.ts`.

**The suggestion stands, and sharpens:** one worked example of playing a bundled asset
would have saved the original two hours and this second investigation. The single most
useful line the documentation could add is that the player takes a *path*, not a URI,
for local files.
