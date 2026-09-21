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
 */
const isPress = (evt: HWEvent): boolean =>
  evt.eventKeyAction === undefined || evt.eventKeyAction === 0;

/**
 * The spec's mapping, and nothing beyond it.
 *
 * Several names are accepted per action because remotes differ in what they
 * emit: a Fire TV remote's menu button and an on-screen context menu arrive
 * under different names for the same intent, and `pause` appears alone on
 * remotes with separate transport keys.
 */
const ACTIONS: Readonly<Record<string, RemoteAction>> = {
  playpause: 'playPause',
  pause: 'playPause',
  left: 'seekBack',
  right: 'seekForward',
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
