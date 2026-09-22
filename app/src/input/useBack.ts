/**
 * The Back button.
 *
 * Back does not arrive through `useTVEventHandler` on Vega. The platform takes
 * it and, unhandled, exits the app — so Back from the player quit to the
 * launcher and lost the viewer's place, and Back in an overlay did nothing at
 * all despite the panel saying "Back to close". Measured on device 2026-09-22.
 *
 * `useKeplerBackHandler` is the route that works. A handler returning `true`
 * means "I dealt with it", which stops the default exit. Handlers run in
 * reverse registration order, so a screen mounted later is offered the press
 * before the shell underneath it — which is what lets the player intercept
 * Back while the catalogue still handles it everywhere else.
 */
import { useEffect } from 'react';
import { useKeplerBackHandler } from '@amazon-devices/react-native-kepler/Libraries/Utilities/KeplerBackHandler';

/**
 * Handle Back while mounted. Return true when handled, false to pass it on —
 * and passing it on from the root screen is what lets the viewer leave the app.
 */
export function useBack(handler: () => boolean): void {
  const backHandler = useKeplerBackHandler();
  useEffect(() => {
    const sub = backHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [backHandler, handler]);
}
