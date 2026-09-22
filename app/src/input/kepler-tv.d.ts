/**
 * `useTVEventHandler` ships in the Kepler runtime but not in its TypeScript
 * surface. It is exported from the package root as a getter (index.js line 749)
 * and its event type is fully documented in `Libraries/TV/TVTypes.d.ts` — but
 * `types/index.d.ts` does not declare the hook, so importing it from
 * 'react-native' is a compile error against a function that exists at runtime.
 *
 * Declared here rather than worked around with `any`, so the signature is stated
 * once and checked everywhere. Delete this file if a later SDK types the hook.
 *
 * Written up in friction-log/005.
 */
import type { HWEvent } from '@amazon-devices/react-native-kepler/Libraries/TV/TVTypes';

declare module 'react-native' {
  /**
   * Subscribes to remote-control events for as long as the component is
   * mounted. Kepler routes these through UserInputManager; on other platforms
   * the hook falls back to a TVEventHandler instance.
   */
  export function useTVEventHandler(handler: (evt: HWEvent) => void): void;

  /**
   * The next-focus hints. Kepler's `TVViewProps` add them to every view
   * (`Libraries/TV/TVTypes.d.ts`); stock React Native's `PressableProps` do not
   * carry them, so a `Pressable` that sets `nextFocusDown` is a type error
   * against a prop that works at runtime. Same shape of gap as the hook above.
   */
  interface PressableProps {
    nextFocusDown?: number;
    nextFocusUp?: number;
    nextFocusLeft?: number;
    nextFocusRight?: number;
  }
}
