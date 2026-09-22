/**
 * Named remote keys, from the source that actually delivers them.
 *
 * Two of the seven keys in the spec never arrive through `useTVEventHandler`:
 * the platform consumes **Back** and **Select** for its own navigation. Proved
 * with an on-screen counter reading `backHits=0` while a press had plainly been
 * delivered — and neither `useKeplerBackHandler` nor `BackHandler` fired either,
 * despite both accepting listeners without complaint.
 *
 * `useAddUserInputListenerCallback` is the root-tag-aware subscription that
 * `useTVEventHandler` itself is built on, and `UserInputEventName` names every
 * key including the two that go missing. Subscribing here works.
 *
 * Events arrive twice, once per phase. We act on RELEASED, which is what the
 * platform's own BackHandler does.
 */
import { useEffect } from 'react';
import {
  UserInputEventName,
  useAddUserInputListenerCallback,
} from '@amazon-devices/react-native-kepler/Libraries/UserInputManager/UserInputManager';

export { UserInputEventName };

/**
 * Subscribe to one named key for as long as the component is mounted.
 *
 * The handler returns whether it consumed the press. For Back that decides
 * whether the platform goes on to exit the app, so returning the wrong thing
 * here is the difference between closing a panel and quitting.
 */
export function useUserInput(
  name: UserInputEventName,
  handler: () => boolean,
  enabled: boolean = true,
): void {
  const addListener = useAddUserInputListenerCallback();
  useEffect(() => {
    if (!enabled) return;
    const sub = addListener(name, ({ phase }) => (phase === 'RELEASED' ? handler() : false));
    return () => sub.remove();
  }, [addListener, name, handler, enabled]);
}
