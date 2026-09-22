/**
 * The remote mapping.
 *
 * Worth testing properly because on a television this is the only way in, and
 * because the two failure modes are both silent: a key that maps to nothing
 * looks like a frozen app, and a key that fires twice looks like a rendering
 * fault rather than an input one.
 */
import type { HWEvent } from '@amazon-devices/react-native-kepler/Libraries/TV/TVTypes';
import { remoteAction, SEEK_SECONDS, type RemoteAction } from '../src/input/remote';

const press = (eventType: string): HWEvent => ({ eventType, eventKeyAction: 0 });
const release = (eventType: string): HWEvent => ({ eventType, eventKeyAction: 1 });

describe('the spec mapping', () => {
  it.each<[string, RemoteAction]>([
    ['playpause', 'playPause'],
    ['play', 'playPause'],
    ['pause', 'playPause'],
    ['left', 'seekBack'],
    ['right', 'seekForward'],
    // The dedicated transport keys, under both names the SDK uses for them.
    ['rewind', 'seekBack'],
    ['skip_backward', 'seekBack'],
    ['forward', 'seekForward'],
    ['fastforward', 'seekForward'],
    ['skip_forward', 'seekForward'],
    ['up', 'signerControls'],
    ['down', 'captionMenu'],
    ['select', 'toggleChrome'],
    ['menu', 'settings'],
    ['back', 'back'],
  ])('maps %s to %s', (key, action) => {
    expect(remoteAction(press(key))).toBe(action);
  });

  it('seeks by the documented ten seconds', () => {
    expect(SEEK_SECONDS).toBe(10);
  });
});

describe('press and release', () => {
  it.each(['playpause', 'play', 'left', 'right', 'forward', 'up', 'down', 'select', 'menu', 'back'])(
    'acts on the press of %s but not the release',
    (key) => {
      expect(remoteAction(press(key))).not.toBeNull();
      expect(remoteAction(release(key))).toBeNull();
    },
  );

  it('treats a missing key action as a single press', () => {
    // Kepler may omit the field. One action is the safe failure; none is not.
    expect(remoteAction({ eventType: 'select' })).toBe('toggleChrome');
  });

  it('ignores an unrecognised key action rather than guessing', () => {
    expect(remoteAction({ eventType: 'select', eventKeyAction: -1 })).toBeNull();
  });
});

describe('the names this platform actually sends', () => {
  // Traced on screen on 2026-09-22, because the names are the whole bug: the
  // table had `playpause` and the device sends `play`, so the one control every
  // viewer reaches for first did nothing at all and nothing failed anywhere.
  it.each<[string, RemoteAction]>([
    ['right', 'seekForward'],
    ['play', 'playPause'],
    ['forward', 'seekForward'],
  ])('handles %s, seen coming from the device', (key, action) => {
    expect(remoteAction(press(key))).toBe(action);
  });
});

describe('keys we deliberately do not take', () => {
  it.each(['volume_up', 'volume_down', 'mute', 'power', 'channel_up', 'red', 'num_0', 'info'])(
    'leaves %s to the system',
    (key) => {
      expect(remoteAction(press(key))).toBeNull();
    },
  );

  it('ignores a key name the platform invents that we have never seen', () => {
    // eventType is typed as a union *or* string, so unknown names are reachable.
    expect(remoteAction(press('some_future_button'))).toBeNull();
  });
});

describe('remotes that differ', () => {
  it('accepts pause alone, for remotes with separate transport keys', () => {
    expect(remoteAction(press('pause'))).toBe('playPause');
  });

  it('accepts enter as select', () => {
    expect(remoteAction(press('enter'))).toBe('toggleChrome');
  });

  it('accepts context_menu as menu', () => {
    expect(remoteAction(press('context_menu'))).toBe('settings');
  });
});
