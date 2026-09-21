# Installing the Vega SDK, and getting to Experiment 2

Checked against your machine on 21 September 2026. No Amazon approval or
allowlist is needed to download the SDK — your developer account is enough.

## One thing to decide before you start

**Do not create the Vega project under `Desktop/Closed Signing/`.** That path
has a space in it, and the installer refuses to proceed if your *home* path
contains one, warning that spaces break the CLI. Whether it also mishandles a
project path with a space is untested, and finding out costs an evening.

Put the probe project somewhere clean:

```sh
mkdir -p ~/vega-projects
```

Your home directory is `/Users/saeed.bashir`, which is fine.

## Your machine, checked

| Requirement | Status |
| --- | --- |
| macOS, Apple silicon | arm64, fine. The installer refuses to run under Rosetta. |
| `jq` on PATH | present, 1.7.1 |
| Home path without spaces | fine |
| VS Code | found, so the Vega Studio extension will install |
| Free disk | 55 GB. Enough, not roomy — the SDK, the virtual device and a build are several GB. |
| Node | v22.23.2 via nvm. The docs state no version requirement; if the build complains, switch with `nvm use 20`. |

## 1. Install

```sh
curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env
```

It installs into `~/vega`, needs no `sudo`, and pulls in the CLI, the SDK, the
Vega Virtual Device and the VS Code extension. It is interactive and will ask
you to accept Amazon's Program Materials License Agreement.

Make it stick across shells:

```sh
echo 'source ~/vega/env' >> ~/.zshrc
```

Check it:

```sh
vega --version     # prints Active SDK Version and Vega CLI Version
```

## 2. Create the probe project

```sh
cd ~/vega-projects
vega project generate --template helloWorld --name e2probe \
  --packageId com.closedsigning.e2probe --outputDir e2probe
cd e2probe
npm install
```

## 3. Wire in the probe

1. Copy `TwoSurfaceProbe.tsx` from this folder into the project's `src/`, and
   render it from the app entry point.
2. Merge `manifest-additions.toml` into the project's `manifest.toml`. Two of
   those services are missing from our implementation spec.
3. Put `main.mp4`, `signer.mp4` and optionally `signer-alpha.webm` where the app
   can load them. The ffmpeg commands to cut them are in this folder's README.

Declare the OS version if the template has not:

```sh
vega project update-manifest --os-min 1.2 --os-version 1.2
```

## 4. Build and run

```sh
npm run build:app
vega virtual-device start
vega run-app build/aarch64-release/e2probe_aarch64.vpkg \
  com.closedsigning.e2probe.main -d VirtualDevice
```

The app id is the package id plus `.main`. `aarch64` is right for Apple silicon.

Useful while you work:

```sh
vega virtual-device start --display-res=1920,1080   # match the design canvas
vega device shell -d VirtualDevice                  # logs and poking about
vega virtual-device stop
```

There is also a play button in the Vega Studio pane in VS Code that does build,
install and run in one click.

## 5. Then run the experiment

Follow this folder's `README.md`. The short version: start main alone, note its
advance rate, then add the signer and watch **main's** rate, not the picture.

## If the install goes wrong

Every snag is a friction-log entry — copy `friction-log/TEMPLATE.md`. SDK
installation is explicitly on the list of things to log, and these entries are
the most useful feedback the Fire TV team will get from us. They also earn up to
a 10% judging bonus, which almost nobody will claim.
