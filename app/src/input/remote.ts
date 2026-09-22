/**
 * The remote control. On a television this is the entire input surface — there
 * is no pointer, no keyboard, no touch — so a key that does nothing is a
 * feature that does not exist.
 *
 * The mapping lives in `remoteAction` as a pure function, separate from the
 * hook that subscribes to the platform. That split is deliberate: the mapping
 * is the part with rules worth testing, and it can be tested without a device,
 * a native module, or a rendered component.
 */
import { useTVEventHandler } from 'react-native';
import type { HWEvent } from '@amazon-devices/react-native-kepler/Libraries/TV/TVTypes';

/** What the player does, named for intent rather than for the key pressed. */
export type RemoteAction =
  | 'playPause'
  | 'seekBack'
  | 'seekForward'
  | 'signerControls'
  | 'captionMenu'
  | 'toggleChrome'
  | 'settings'
  | 'back';

/**
 * Kepler reports 0 for a press and 1 for a release, and may omit the field.
 *
 * Act on the press only. Acting on both fires every action twice, which for
 * `toggleChrome` means the controls appear and vanish within a frame and look
 * broken rather than unresponsive — the kind of bug that reads as a rendering
 * fault and sends you looking in the wrong place. Where the field is absent we
 * treat the event as a single press, because one action is the safe failure and
 * none is not.
 *
 * This holds for every key the platform actually delivers. Traced on screen on
 * 2026-09-22 — `right/0 right/1`, `play/0 play/1`, `forward/0 forward/1` — so
 * no key arrives as a release on its own, whatever `inputd`'s own log suggests
 * about which halves it forwards to which client.
 */
const isPress = (evt: HWEvent): boolean =>
  evt.eventKeyAction === undefined || evt.eventKeyAction === 0;

/**
 * The spec's mapping, and nothing beyond it.
 *
 * TWO OF THESE NEVER ARRIVE ON VEGA. The platform keeps Back and Select for its
 * own navigation and does not pass them to any subscription the app can make —
 * not this one, not `BackHandler`, not `useKeplerBackHandler`, not
 * `UserInputManager` directly, and not a focused `Pressable`. Proved with an
 * on-screen counter and confirmed in the device log, where `inputd` denies the
 * app as a client and routes the key to another process. See friction-log/008.
 *
 * They stay in the table because the mapping is the product's design and it is
 * correct on any platform that delivers them. What changed is the UI: nothing
 * on screen now tells a viewer to press Back.
 *
 * Several names are accepted per action because remotes differ in what they
 * emit: a Fire TV remote's menu button and an on-screen context menu arrive
 * under different names for the same intent, and `pause` appears alone on
 * remotes with separate transport keys.
 */
const ACTIONS: Readonly<Record<string, RemoteAction>> = {
  playpause: 'playPause',
  pause: 'playPause',
  play: 'playPause',
  left: 'seekBack',
  right: 'seekForward',
  // The dedicated transport keys, which a Fire TV remote has and the virtual
  // device's on-screen remote draws. They did nothing at all until now: the bar
  // told the viewer to skip with Left and Right while the two buttons plainly
  // meant for it were ignored, and Play/Pause — the one control every viewer
  // reaches for first — did nothing either.
  //
  // The names are the whole bug. Tracing the events on screen on 2026-09-22
  // showed Play/Pause arriving as `play` and fast forward as `forward`, and
  // neither was in this table: `playpause` was, and it never fires. Every
  // spelling the SDK uses is accepted now, because the type file's union says
  // `skip_backward` where the prose above it says `rewind`, and there is no
  // way to tell from the documentation which one a given remote will send.
  // Rewind is the one pair member left unproven: macOS takes F3 for Mission
  // Control before the virtual device ever sees it.
  rewind: 'seekBack',
  skip_backward: 'seekBack',
  forward: 'seekForward',
  fastforward: 'seekForward',
  skip_forward: 'seekForward',
  up: 'signerControls',
  down: 'captionMenu',
  select: 'toggleChrome',
  enter: 'toggleChrome',
  menu: 'settings',
  context_menu: 'settings',
  back: 'back',
};

/**
 * The action a remote event means, or null for events we deliberately ignore —
 * key releases, volume, and every key not in the mapping.
 */
export function remoteAction(evt: HWEvent): RemoteAction | null {
  if (!isPress(evt)) return null;
  return ACTIONS[evt.eventType] ?? null;
}

/** How far Left and Right move, in seconds. */
export const SEEK_SECONDS = 10;

/**
 * Subscribe to the remote for as long as the component is mounted.
 *
 * `enabled` exists because overlays take the remote over. While the signer
 * controls are open, Up and Down belong to that panel's focus movement, not to
 * the player underneath — without this the player would act on every key the
 * overlay is already handling.
 */
export function useRemote(
  onAction: (action: RemoteAction) => void,
  enabled: boolean = true,
): void {
  useTVEventHandler((evt: HWEvent) => {
    if (!enabled) return;
    const action = remoteAction(evt);
    if (action) onAction(action);
  });
}

/**
 * Left and Right inside an overlay panel.
 *
 * The panels are vertical lists, so the platform's focus system uses Up and
 * Down and leaves Left and Right free for changing the focused row's value.
 * Both panels told the viewer "Left and right to change" while only Select did
 * anything, and Select can only cycle forwards — so a viewer who overshot had
 * to go all the way round. Measured on device 2026-09-22.
 *
 * `seekBack` and `seekForward` are the same two keys under player-centric
 * names; inside an overlay they mean decrease and increase.
 */
export function useOverlayValueKeys(
  onDelta: (delta: number) => void,
  enabled: boolean,
): void {
  useRemote((action) => {
    if (action === 'seekBack') onDelta(-1);
    else if (action === 'seekForward') onDelta(1);
  }, enabled);
}
