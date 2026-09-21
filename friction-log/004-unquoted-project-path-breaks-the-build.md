# 004 — A space in the project path breaks the build, with a misleading error

**Date:** 2026-09-21
**Area:** Vega SDK / kepler-module-manifest-builder
**Severity:** major

## Task attempted

Build a Vega app whose project directory sits under a path containing a space:

```
/Users/saeed.bashir/Desktop/Closed Signing/closed-signing-firetv/app
```

## Steps taken

```sh
vega project generate --template helloWorld --name spacetest \
  --packageId com.closedsigning.spacetest --outputDir "app/.probe"
cd app/.probe && npm install && npm run build:app
```

`vega project generate` succeeds. `npm install` succeeds. The build fails.

## Expected

Either a successful build, or an error naming the actual problem.

## Actual

```
/bin/sh: /Users/saeed.bashir/Desktop/Closed: No such file or directory
error Unable to generate a manifest: Error: Command failed:
  /Users/.../app/.probe/node_modules/@amazon-devices/kepler-module-manifest-builder/dist/src/cli.js
  build -d /Users/saeed.bashir/Desktop/Closed Signing/closed-signing-firetv/app/.probe -p ./package.json -s
```

`kepler-module-manifest-builder` is invoked through a shell without quoting the
`-d` argument, so the path splits at the space and `/bin/sh` looks for a
directory called `/Users/saeed.bashir/Desktop/Closed`.

The surfaced error is "Unable to generate a manifest", which sends you to look
at `manifest.toml` — a file that is perfectly valid and has nothing to do with
it. The real cause is one line further down and easy to scroll past.

## Related, and the reason this was worth testing

The SDK installer already refuses to run when `$HOME` contains a space, warning
that spaces break the CLI. That check is the right instinct but it only covers
the home directory. The same class of bug is live in the project path, where
there is no check and no warning.

## Workaround

Keep the project under a path with no spaces. Ours now builds from
`~/vega-projects/`.

## Suggestion

1. Quote the path when invoking `kepler-module-manifest-builder`, and audit the
   other `child_process` call sites in the CLI for the same issue.
2. Until then, extend the installer's existing space check to the project path,
   at `vega project generate` time — it already knows the output directory, and
   failing early with "paths cannot contain spaces" would be far cheaper than
   failing at first build with a manifest error.

## Time lost

Twenty minutes, and it would have been much longer without the earlier
installer warning as a hint that spaces were suspect.
