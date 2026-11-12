#!/usr/bin/env bash
# No deployment, credentials, signing identities, billing changes or auto triggers.
set -euo pipefail
cd "${CM_BUILD_DIR:-$(pwd)}"
test "$(uname -s)" = Darwin
test ! -e cm-output
test ! -e cm-work
SOURCE_SHA=$(git rev-parse HEAD)
VERSION=$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")
BUILD=$(sed -n 's/.*CURRENT_PROJECT_VERSION: *\([0-9][0-9]*\).*/\1/p' ios/project.yml)
test -n "$BUILD"
if [ -n "${CM_COMMIT:-}" ]; then test "$SOURCE_SHA" = "$CM_COMMIT"; fi
test -z "$(git status --porcelain)"
mkdir -p cm-output/diagnostics cm-work
printf '%s\n' "$SOURCE_SHA" > cm-output/diagnostics/source-commit.txt
xcodebuild -version | tee cm-output/diagnostics/xcode-version.txt
test "$(xcrun --sdk iphoneos --show-sdk-version | cut -d. -f1)" -ge 26
SERVER_PID=''
SIMULATOR_ID=''
cleanup() {
  result=$?
  if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
  if [ -n "$SIMULATOR_ID" ]; then xcrun simctl shutdown "$SIMULATOR_ID" 2>/dev/null || true; fi
  if [ -d cm-work/simulator.xcresult ]; then
    ditto -c -k --keepParent cm-work/simulator.xcresult cm-output/diagnostics/simulator-results.zip || true
  fi
  exit "$result"
}
trap cleanup EXIT

python3 tests/test_codemagic_ipa.py

# Preserve the existing Node, generated-asset and browser regression gates.
npm test 2>&1 | tee cm-output/diagnostics/node-tests.log
npm run sync
git diff --exit-code -- web/bundle.js android/app/src/main/assets ios/PrismPuzzle/Web
npm install --no-save --package-lock=false playwright@1.58.2
npx playwright install chromium webkit
python3 -m http.server 8080 --bind 127.0.0.1 --directory web > cm-output/diagnostics/web-server.log 2>&1 &
SERVER_PID=$!
for attempt in {1..30}; do curl -fsS http://127.0.0.1:8080/ >/dev/null && break; sleep 1; done
curl -fsS http://127.0.0.1:8080/ >/dev/null
node tests/ui.cjs 2>&1 | tee cm-output/diagnostics/ui-tests.log
node tests/feedback-ui.cjs 2>&1 | tee cm-output/diagnostics/feedback-ui-tests.log
node tests/touch-ui.cjs chromium 2>&1 | tee cm-output/diagnostics/chromium-touch.log
node tests/touch-ui.cjs webkit 2>&1 | tee cm-output/diagnostics/webkit-touch.log
cp docs/prism-phone.png docs/chromium-touch-qa.png docs/webkit-touch-qa.png docs/chromium-feedback-qa.png docs/webkit-feedback-qa.png cm-output/diagnostics/

# Run the original iOS simulator test target before producing device output.
if ! command -v xcodegen >/dev/null; then HOMEBREW_NO_AUTO_UPDATE=1 brew install xcodegen; fi
(cd ios && xcodegen generate)
xcrun simctl list devices available -j > cm-work/simulators.json
SIMULATOR_ID=$(python3 - <<'PY'
import json
from pathlib import Path
devices = json.loads(Path("cm-work/simulators.json").read_text())["devices"]
choices = [d for runtime, group in sorted(devices.items(), reverse=True) if ".iOS-" in runtime for d in group if d.get("isAvailable") and d["name"].startswith("iPhone")]
if not choices:
    raise SystemExit("No available iPhone simulator")
print(choices[0]["udid"])
PY
)
xcrun simctl bootstatus "$SIMULATOR_ID" -b
xcodebuild test -project ios/PrismPuzzle.xcodeproj -scheme PrismPuzzle -destination "platform=iOS Simulator,id=$SIMULATOR_ID" -parallel-testing-enabled NO -resultBundlePath cm-work/simulator.xcresult CODE_SIGNING_ALLOWED=NO 2>&1 | tee cm-output/diagnostics/ios-simulator.log

xcodebuild -project ios/PrismPuzzle.xcodeproj -scheme PrismPuzzle -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath cm-work/device CODE_SIGNING_ALLOWED=NO build 2>&1 | tee cm-output/diagnostics/ios-device.log
APP=cm-work/device/Build/Products/Release-iphoneos/PrismPuzzle.app
test -d "$APP"
xcrun lipo "$APP/PrismPuzzle" -verify_arch arm64
xcrun vtool -show-build "$APP/PrismPuzzle" | tee cm-output/diagnostics/macho-platform.txt
grep -q 'platform IOS$' cm-output/diagnostics/macho-platform.txt
mkdir -p cm-work/package/Payload cm-output/candidate
ditto "$APP" "cm-work/package/Payload/PrismPuzzle.app"
(cd cm-work/package && ditto -c -k --keepParent Payload ../../cm-output/candidate/Prism-Puzzle-unsigned.ipa)
python3 scripts/verify_codemagic_ipa.py --ipa cm-output/candidate/Prism-Puzzle-unsigned.ipa --app-name PrismPuzzle --bundle-id com.prismpuzzle.app --version "$VERSION" --build "$BUILD" --minimum-os 15.0 --source-sha "$SOURCE_SHA" --web web --output cm-output/candidate/verification.json
git archive --format=zip --output=cm-output/candidate/Prism-Puzzle-source.zip "$SOURCE_SHA"
(cd cm-output/candidate && shasum -a 256 *.ipa *.zip verification.json > SHA256SUMS.txt)
# This directory is exposed as a candidate only after every gate above passed.
mv cm-output/candidate cm-output/verified
