#!/usr/bin/env bash
# Publish one processed title to R2.
#
#   tools/publish-title.sh <out-dir> <title-id>
#
# Takes the directory `stm run` wrote (out/<id>/), rewrites the manifest's relative
# URLs to their absolute public form, validates it, and uploads everything but the
# analysis report. HOSTING.md described these three steps in prose; this is the
# prose as a command, so a judge can publish a title the same way we did.
#
# Configuration comes from the environment, so the script names no account:
#
#   R2_BUCKET        bucket name                     e.g. closed-signing
#   R2_PUBLIC_BASE   public URL of the bucket        e.g. https://pub-<hash>.r2.dev
#   R2_ENDPOINT      S3 API endpoint                 https://<account-id>.r2.cloudflarestorage.com
#   R2_PROFILE       AWS CLI profile with R2 keys    default: cloudflare-r2
#
# and `validate-stm` on PATH or a uv checkout of signed-track-manifest beside this
# repository. Any S3-compatible store works the same way.
set -euo pipefail

OUT="${1:?out dir}"; ID="${2:?title id}"
: "${R2_BUCKET:?set R2_BUCKET (see the header of this script)}"
: "${R2_PUBLIC_BASE:?set R2_PUBLIC_BASE (see the header of this script)}"
: "${R2_ENDPOINT:?set R2_ENDPOINT (see the header of this script)}"
R2_PROFILE="${R2_PROFILE:-cloudflare-r2}"
DIR="$OUT/$ID"
BUCKET="s3://$R2_BUCKET/titles/$ID"
PUBLIC="${R2_PUBLIC_BASE%/}/titles/$ID"

[ -f "$DIR/manifest.json" ] || { echo "no manifest at $DIR/manifest.json" >&2; exit 1; }

python3 - "$DIR/manifest.json" "$PUBLIC" <<'PY'
import json, sys
path, base = sys.argv[1], sys.argv[2]
m = json.load(open(path, encoding="utf-8"))
absolute = lambda u: u if u.startswith("http") else f"{base}/{u}"
m["video"]["main"]["url"] = absolute(m["video"]["main"]["url"])
m["video"]["poster"] = absolute(m["video"]["poster"])
for t in m.get("signLanguage", []):
    t["track"]["url"] = absolute(t["track"]["url"])
for c in m.get("captions", []):
    c["url"] = absolute(c["url"])
with open(path, "w", encoding="utf-8") as f:
    json.dump(m, f, indent=2, ensure_ascii=False); f.write("\n")
print(f"manifest URLs are absolute under {base}")
PY

if command -v validate-stm >/dev/null 2>&1; then
  validate-stm "$DIR/manifest.json"
else
  STM="$(cd "$(dirname "$0")/../../signed-track-manifest" && pwd)"
  (cd "$STM" && uv run validate-stm "$DIR/manifest.json")
fi

aws s3 cp "$DIR/" "$BUCKET/" --recursive --exclude "analysis.json" \
  --profile "$R2_PROFILE" --endpoint-url "$R2_ENDPOINT" --region auto --only-show-errors
echo "uploaded to $BUCKET"

# The failure mode is silent and looks like a codec error on the device, so check
# from outside that every file the manifest names actually answers.
python3 - "$DIR/manifest.json" <<'PY'
import json, sys, urllib.request
m = json.load(open(sys.argv[1], encoding="utf-8"))
urls = [m["video"]["main"]["url"], m["video"]["poster"]] + [t["track"]["url"] for t in m["signLanguage"]] + [c["url"] for c in m["captions"]]
bad = 0
for u in urls:
    # r2.dev answers Python's default user agent with 403; a named one gets 206.
    req = urllib.request.Request(u, headers={"Range": "bytes=0-0", "User-Agent": "closed-signing-publish-check/1"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            print(f"  {r.status}  {u.rsplit('/', 1)[-1]}")
    except Exception as e:
        bad += 1; print(f"  FAIL {u}: {e}")
sys.exit(1 if bad else 0)
PY
echo "manifest: $PUBLIC/manifest.json"
