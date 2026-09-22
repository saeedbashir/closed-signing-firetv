/**
 * The Back button.
 *
 * Back does not arrive through `useTVEventHandler` on Vega. The platform takes
 * it and, unhandled, exits the app — so Back from the player quit to the
 * launcher and lost the viewer's place, and Back in an overlay did nothing at
 * all despite the panel saying "Back to close". Measured on device 2026-09-22.
 *
 * Neither back-specific API works. `useKeplerBackHandler` and `BackHandler`
 * both accept listeners without complaint and never call them — an on-screen
 * counter read `backHits=0` while a press had plainly been delivered. The
 * subscription that does fire is `UserInputManager`'s, which is what
 * `useTVEventHandler` is built on; see `./userInput`.
 *
 * We keep one subscription, registered by the root, and our own stack
 * underneath it — so ordering is ours and deterministic rather than depending
 * on which component last re-rendered. Most recently mounted wins, because
 * that is the screen in front of the viewer.
 */
import { useCallback, useEffect } from 'react';
import { UserInputEventName, useUserInput } from './userInput';

/** Handled = true. Returning false offers the press to the screen beneath. */
export type BackPressHandler = () => boolean;

const stack: BackPressHandler[] = [];

/**
 * Handle Back while mounted.
 *
 * Pass a stable callback. An unstable one re-registers on every render, which
 * still works — it is removed and pushed back on top — but it churns.
 */
export function useBack(handler: BackPressHandler): void {
  useEffect(() => {
    stack.push(handler);
    return () => {
      const at = stack.indexOf(handler);
      if (at !== -1) stack.splice(at, 1);
    };
  }, [handler]);
}

/**
 * Install the single platform listener. The root calls this once.
 *
 * Returning false from every handler lets the press fall through to the
 * platform, which exits the app — the only way for a viewer to leave.
 */
export function useBackRoot(): void {
  const dispatch = useCallback(() => {
    for (let i = stack.length - 1; i >= 0; i -= 1) {
      if (stack[i]()) return true;
    }
    return false;
  }, []);
  useUserInput(UserInputEventName.Back, dispatch);
}

/** Test seam: the depth of the handler stack. */
export const backStackDepth = (): number => stack.length;
