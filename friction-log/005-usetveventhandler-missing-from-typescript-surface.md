# 005 — useTVEventHandler ships in the runtime but not in the TypeScript surface

**Date:** 2026-09-21
**Area:** Vega SDK · RN focus
**Severity:** minor

## Task attempted

Handle D-pad and transport keys in a React Native for Vega app, so the player can be
driven from a Fire TV remote.

## Steps taken

1. Found `useTVEventHandler` in `@amazon-devices/react-native-kepler`. It is
   implemented at `Libraries/TV/useTVEventHandler.js`, exported from the package root
   as a getter (`index.js`, line 749), and routed through `UserInputManager` on Kepler.
2. Found its event type fully documented at `Libraries/TV/TVTypes.d.ts` — a long
   comment block listing every `eventType` the platform emits, and stating that
   `eventAction` is 0 for a press and 1 for a release.
3. Imported the hook the way the rest of the app imports from React Native.

## Expected

The hook to be typed, given the runtime ships it and the event type beside it is
declared in a `.d.ts`.

## Actual

```
error TS2305: Module '"react-native"' has no exported member 'useTVEventHandler'.
```

`HWEvent` is not exported from the root either, although `types/index.d.ts` line 160
contains `export * from '../Libraries/TV/TVTypes';`:

```
error TS2305: Module '"react-native"' has no exported member 'HWEvent'.
```

The type does resolve from its full path:

```ts
import type { HWEvent } from '@amazon-devices/react-native-kepler/Libraries/TV/TVTypes';
```

So the declarations exist and are reachable; they are just not surfaced at the root
where every other React Native export lives. The hook has no declaration at all —
there is no `Libraries/TV/useTVEventHandler.d.ts`.

## Workaround

A local ambient declaration, `app/src/input/kepler-tv.d.ts`, augmenting the module:

```ts
declare module 'react-native' {
  export function useTVEventHandler(handler: (evt: HWEvent) => void): void;
}
```

Preferred over `any` or a `@ts-expect-error`, so the signature is stated once and
checked everywhere it is used. It is deletable the day the SDK types the hook.

## Suggestion

Export `useTVEventHandler` and `HWEvent` from `types/index.d.ts`. Both already exist
in the package — the hook needs a two-line `.d.ts` beside its implementation, and
`HWEvent` needs the existing re-export to actually reach the root.

The gap is easy to miss because everything *around* it is documented: a developer who
finds the excellent `TVTypes.d.ts` comment block reasonably concludes the hook is a
supported, typed API, and only discovers otherwise at compile time. On a platform
where the remote is the entire input surface, this is the first API a TV app reaches
for.

## Time lost

About 30 minutes, most of it spent verifying the hook really does exist at runtime
rather than assuming the compiler was right and looking for a different API.
