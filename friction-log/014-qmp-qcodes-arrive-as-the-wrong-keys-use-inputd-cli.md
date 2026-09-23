# 014 — QMP `send-key` qcodes arrive as the wrong keys; the device's own `inputd-cli` is the injector

**Date:** 2026-09-23
**Area:** VVD
**Severity:** major

## Task attempted

Drive the app on the Vega Virtual Device from a script — D-pad, Select, transport —
to take screenshots for verification, as I had the day before over the QEMU monitor
socket (`/tmp/qmp-socket-5554.sock`, `send-key` with qcodes `up down left right ret`).

## Steps taken

1. Sent `{"execute":"send-key","arguments":{"keys":[{"type":"qcode","data":"down"}]}}`,
   then the `input-send-event` form that had worked on 09-22 (press and release);
   QMP answered `{"return": {}}` to each. Screen unchanged.
2. Streamed the device log while sending `down` then `right`.
3. Found `inputd-cli` on the device (`/usr/bin`), read its `--help`, and used
   `inputd-cli button_press KEY_DOWN` through `vega device run-cmd`.

## Expected

A qcode named `down` is a Down key; `right` is a Right key. The same sequence had
moved focus on 2026-09-22.

## Actual

The keys reach the guest, but as something else. In the app's own log:

```
Volta:KeyMap::ToKeyCode; no key mapping found for key <110>. Returning platformSpecificKeyCode: <65360>.
GWSI_LOG: Injected key:Home state:1 evtId:9
inputd: key event injection requested by id=22 pid=3527 ... keyCode=[KEY_HOME]
```

`right` became KEY_HOME; `down` became an unmapped code. Nothing in the SDK
documents the QEMU-keyboard-to-remote mapping, so there is nothing to check it
against; and the emulator window's on-screen remote cannot be driven from a script.

## Workaround

The device carries a dev-mode injector, undocumented in the SDK guides:

```sh
vega device run-cmd -d VirtualDevice --command "inputd-cli button_press KEY_DOWN"
vega device run-cmd -d VirtualDevice --command "inputd-cli button_press KEY_ENTER"
```

`KEY_UP/DOWN/LEFT/RIGHT/ENTER` behave as the remote's D-pad and Select. In the
player, `KEY_REWIND` and `KEY_LEFT` did not seek, so transport keys still need the
host keyboard's F-keys (009). `inputd-cli --help` lists `series`, `send_text`,
`touch`, `mouse_click` and `list_devices` as well.

Two adjacent traps, recorded because each cost a restart: the Mac's display sleeps
under the emulator (a black full-screen capture with `IOConsoleLocked` false — wake
with `caffeinate -u`, hold with `caffeinate -d`), and `vega virtual-device stop` /
`start` brings the device back in about a minute with the app still installed.
