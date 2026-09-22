# 008 — Back and Select are never delivered to the app

**Date:** 2026-09-22
**Area:** Vega SDK · RN focus
**Severity:** blocker

## Task attempted

Implement the remote mapping a TV app needs: Back to leave a screen, Select to show
and hide the transport controls.

## Steps taken

Every route the SDK offers, in order. All of them accept a listener without complaint.

1. **`useTVEventHandler`** — works for Up, Down, Left, Right and Play/Pause. Back and
   Select never arrive.
2. **`useKeplerBackHandler`** — the back-specific hook, `addEventListener('hardwareBackPress', …)`.
3. **`BackHandler`** from `react-native` — whose Kepler implementation subscribes to
   `UserInputManager` at module load and iterates subscribers in reverse.
4. **`useAddUserInputListenerCallback`** with `UserInputEventName.Back` — the
   root-tag-aware subscription that `useTVEventHandler` is itself built on, and whose
   enum names both `Back` and `Select`.
5. **A focused `Pressable` filling the screen**, since Select plainly activates focused
   buttons elsewhere in the app.

## Expected

At least one of five documented routes to deliver two of the seven keys on the remote.

## Actual

None of them fire. An on-screen counter — the only way to observe a Vega app, see
friction-log/006 — read `backHits=0 overlay=true depth=2` after a press: two handlers
registered, the overlay open, the handler never called.

The device log says why:

```
Inputd:getClientAuthorized:97: Request Denied : application client : pid=56701 : gid=0
Inputd:sendKeyToClient:2731: sending key to passthrough-capable client: id=19 pid=145
```

`inputd` denies the application as a client and routes the key to a different process.
So this is an authorisation decision below the JS layer, and no choice of API changes
it.

It is not a manifest omission either. Our `[wants]` declares
`com.amazon.inputd.service`, and Amazon's own `vega-video-sample` declares exactly the
same set — no input privilege beyond it exists anywhere in SDK 0.24.12044.

## Workaround

Partial, and the product had to change to stay honest.

- **Back cannot be intercepted**, so the viewer can leave the app at any moment
  without the app being told. Position is now written every five seconds rather than
  on the way out, so resume survives it. Everything that said "Back to close" now
  says "Select Done to close", because a UI that names a key which does nothing is
  worse than one that never mentions it.
- **Select cannot toggle the transport controls.** They appear on any transport key
  and fade after four seconds, which is what the spec's prose described anyway.

The mapping itself is left in the code. It is correct on any platform that delivers
these keys, and deleting it would lose the design rather than record the constraint.

## Suggestion

Say in the documentation which keys an application may receive, and which the platform
reserves. Half a page would have saved a day.

Better, make it possible to opt in. A TV app that cannot handle Back cannot implement
its own navigation — every screen becomes a dead end whose only exit is quitting the
app, which is precisely the behaviour Fire TV's own guidelines tell developers to
avoid. If the restriction is deliberate, the platform should provide the navigation
contract it is enforcing; if it is not, `inputd` should authorise foreground
applications by default.

The silence is the expensive part. Five APIs accepted subscriptions and returned
plausible-looking objects, and every one of them was a no-op.

## Addendum, 2026-09-22 evening — Menu is the third

The Menu key (≡ on the remote) goes the same way. Sent from the host keyboard as F2,
which the virtual device maps to `KEY_MENU`, the guest log shows the injection and
nothing after it:

```
Inputd:onMessageReceivedStatic: key event injection requested … keyCode=[KEY_MENU] : state=down
Inputd:onMessageReceivedStatic: key event injection requested … keyCode=[KEY_MENU] : state=up
```

No `sendKeyToClient` line follows — where a D-pad key shows one to the
`passthrough-capable client` and Play/Pause shows one to the interceptor and then
the client. The key is accepted and dropped before any client. Playback continued,
no screen changed.

So the remote's seven keys divide as: Up, Down, Left, Right, Play/Pause, Rewind,
Fast forward reach the app; Back, Select and Menu do not. The player's Menu →
Settings route stays wired for platforms that deliver it, and Settings remains
reachable from Home. Everything in Settings also exists in the player's own Up and
Down overlays, so nothing is out of reach while watching.

## Time lost

About three hours, across five APIs and a manifest comparison against the sample app.
