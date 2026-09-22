# 011 — The bundled `AsyncStorage` does nothing, and says so to no one

**Date:** 2026-09-22
**Area:** Vega SDK · RN storage
**Severity:** major

## Task attempted

Persist the viewer's preferences — signer corner, size, opacity, caption mode,
whether the introduction has been seen, where they got to in each title — so that
the product's premise, "set it once and it stays set", is true across launches.

## Steps taken

1. Used `AsyncStorage` from the React Native fork the SDK ships,
   `@amazon-devices/react-native-kepler/Libraries/Storage/AsyncStorage`, wrapped in
   `load`/`save` helpers that swallow errors — a failed write should cost the viewer
   a preference, not the programme.
2. Verified on device by changing a setting, terminating the app with
   `vega device terminate-app`, relaunching, and looking.

## Expected

The setting to survive the relaunch.

## Actual

It did not. Every launch showed the first-run walkthrough and the default layout.
Nothing failed anywhere: no exception reached the log, no warning appeared, and the
helpers returned their fallbacks exactly as designed.

Reading the fork's implementation explained it. `Libraries/Storage/AsyncStorage.js`
resolves a native module with

```js
const RCTAsyncStorage = NativeAsyncSQLiteDBStorage || NativeAsyncLocalStorage;
…
invariant(RCTAsyncStorage, 'RCTAsyncStorage not available');
```

and every method begins with

```js
console.warn("Legacy AsyncStorage is on a deprecation path. Please migrate to using
              @amazon-devices/react-native-async-storage__async-storage");
```

Neither TurboModule (`AsyncSQLiteDBStorage`, `AsyncLocalStorage`) exists on Vega, so
the `invariant` throws on first use, the wrapper catches it, and storage is a no-op.
The warning that would have said so goes to `console.warn`, which in a Release build
on this platform goes nowhere (friction-log/006). The module is importable, typed, and
documented in the fork's own `.d.ts`; nothing about it says "not on this platform".

## Workaround

The package the warning names, `@amazon-devices/react-native-async-storage__async-storage`
(public npm, 2.1.9000000001), Amazon's build of the community async-storage. Two things
were not obvious:

- It is a **system distributed library**. Its `kepler-compatibility.json` maps the
  package version to the module id
  `/com.amazon.kepler.async_storage__async_storage_2@IAsyncStorage__AsyncStorage_1`,
  which must appear under `[needs.module]` in `manifest.toml` or the TurboModule is
  absent at runtime. The SDK's manifest builder injects it at build time — the same
  way `w3cmedia`'s id arrived — so this is automatic, but only if you know that is why
  the manifest changed under you.
- The SDK's ESLint plugin requires the dependency pinned with `~`, not `^`.

With that, `AsyncStorage.getItem`/`setItem` work: a preference changed, the app force-
stopped and relaunched, and the preference was there. Verified with an on-screen
diagnostic line (`storage: ok · seen=true`) — quicker than waiting for
`start-log-stream`, which delivers the app's own warnings a minute or so late.

## Suggestion

Make the bundled `AsyncStorage` fail loudly on Vega — throw at import with a message
naming the replacement package — rather than resolving to a module that is not there
and warning on a channel nobody can see. Or remove it from the fork's public surface
and its type definitions. A storage API that accepts writes and loses them is worse
than one that does not exist, because every app built on it ships believing it works.

And document, in one place, which packages are system distributed libraries and what
that means for `manifest.toml`. The information exists — in a JSON file inside the
package — but the first sign an app developer gets that the concept exists is a build
that edits their manifest.

## Time lost

About two hours, including the audit that found the symptom. The code that "fixed"
persistence had been in the repository for a day with a header comment saying so, and
nothing anywhere contradicted it.
