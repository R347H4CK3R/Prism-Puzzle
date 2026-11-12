#!/usr/bin/env bash
# Diagnostic-only: inspect candidate rendering changes; no IPA, Android, signing or publication.
set -euo pipefail
cd "${CM_BUILD_DIR:-$(pwd)}"
test "$(uname -s)" = Darwin
test ! -e cm-output
test ! -e cm-work
test -z "$(git status --porcelain)"
mkdir -p cm-output/diagnostics cm-work
git rev-parse HEAD > cm-output/diagnostics/source-commit.txt
xcodebuild -version > cm-output/diagnostics/xcode-version.txt
SERVER_PID=''
SIMULATOR_ID=''
cleanup() {
 result=$?
 if [ -n "$SERVER_PID" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
 if [ -n "$SIMULATOR_ID" ]; then xcrun simctl shutdown "$SIMULATOR_ID" 2>/dev/null || true; fi
 exit "$result"
}
trap cleanup EXIT
npm test
npm run sync
git diff --exit-code -- web/bundle.js android/app/src/main/assets ios/PrismPuzzle/Web
npm install --no-save --package-lock=false playwright@1.58.2
npx playwright install chromium webkit
python3 -m http.server 8080 --bind 127.0.0.1 --directory web > cm-output/diagnostics/web-server.log 2>&1 &
SERVER_PID=$!
for attempt in {1..30}; do curl -fsS http://127.0.0.1:8080/ >/dev/null && break; sleep 1; done
curl -fsS http://127.0.0.1:8080/ >/dev/null
node tests/cube-visual-diagnostic.cjs
if ! command -v xcodegen >/dev/null; then HOMEBREW_NO_AUTO_UPDATE=1 HOMEBREW_NO_INSTALL_CLEANUP=1 brew install xcodegen; fi
(cd ios && xcodegen generate)
xcrun simctl list devices available -j > cm-work/simulators.json
SIMULATOR_ID=$(python3 - <<'PY'
import json
from pathlib import Path
devices=json.loads(Path('cm-work/simulators.json').read_text())['devices']
choices=[d for runtime,group in sorted(devices.items(),reverse=True) if '.iOS-' in runtime for d in group if d.get('isAvailable') and d['name'].startswith('iPhone')]
if not choices:raise SystemExit('No available iPhone simulator')
print(choices[0]['udid'])
PY
)
xcrun simctl bootstatus "$SIMULATOR_ID" -b
xcodebuild test -project ios/PrismPuzzle.xcodeproj -scheme PrismPuzzle -destination "platform=iOS Simulator,id=$SIMULATOR_ID" -only-testing:PrismPuzzleUITests/PuzzleUITests/testCubeVisualDiagnostic -parallel-testing-enabled NO -resultBundlePath cm-work/visual.xcresult CODE_SIGNING_ALLOWED=NO 2>&1 | tee cm-output/diagnostics/native-visual.log
xcrun xcresulttool export attachments --path cm-work/visual.xcresult --output-path cm-output/diagnostics/native-attachments
echo 'Diagnostic completed; inspect screenshots before making a visual-pass claim.'
