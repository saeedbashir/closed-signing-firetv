/**
 * Navigation as a reducer over three stacked routes.
 *
 * No router library. A state machine in a top-level reducer is enough for
 * Launch → Home → Detail → Player, and it avoids the focus-management fights
 * that come with a router owning mount order on a TV.
 */

export type Route =
  | { name: 'launch' }
  | { name: 'walkthrough' }
  | { name: 'home' }
  | { name: 'detail'; titleId: string }
  | { name: 'player'; titleId: string; resumeMs: number }
  | { name: 'settings' };

export type NavState = { stack: Route[] };

export type NavAction =
  | { type: 'replace'; route: Route }
  | { type: 'push'; route: Route }
  | { type: 'back' };

export const initialNav: NavState = { stack: [{ name: 'launch' }] };

export function navReduce(state: NavState, action: NavAction): NavState {
  switch (action.type) {
    case 'replace':
      return { stack: [...state.stack.slice(0, -1), action.route] };
    case 'push':
      return { stack: [...state.stack, action.route] };
    case 'back':
      // Never pop the last route: Back at the root is handled by the screen,
      // which asks for confirmation before exiting the app.
      return state.stack.length > 1 ? { stack: state.stack.slice(0, -1) } : state;
    default:
      return state;
  }
}

export function currentRoute(state: NavState): Route {
  return state.stack[state.stack.length - 1] as Route;
}
