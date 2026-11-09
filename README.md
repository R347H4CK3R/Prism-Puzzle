# Prism Puzzle

A quiet, colorful pocket playground for iPhone, iPad and Android. Twist a 3D cube, untangle Lights Out, or slide your way through an eight-tile puzzle. Hints are unlimited, free, and computed entirely on your device.

## What is implemented
- Physical 54-sticker, 3×3 twist cube with all six face turns, whole-cube orbit, touch face swipes and labeled turn buttons.
- Lights Out and Slide Nine, generated from solvable states.
- Unlimited local hints that retrace the player's move path. These guarantee a route back, **not an optimal or instructional cube-solving algorithm**.
- Automatic local progress saving for all three games, readable face labels, responsive tablet/phone layouts, and progress reset.
- Bundled Android WebView and SwiftUI/WKWebView apps. No CDN, network requests, account, ads, analytics, or subscriptions. Android requests no Internet permission.

## Run and test
Requires Node 22+ and Python 3 for preview. No runtime npm dependencies.

```sh
npm test
npm run sync
npm run preview
```
Open http://localhost:8080. The browser preview requires its local server; native apps bundle the same assets and do not need a server. After editing web assets, run `npm run sync` before building native apps.

Browser smoke suite: `npm install --no-save playwright@1.58.2`, `npx playwright install chromium`, start preview, then `node tests/ui.cjs`. `CHROMIUM_PATH` can select a system browser. CI runs this separately and captures a phone screenshot.

## Android
Install JDK 17, Android SDK 35, Gradle 8.9. Run `gradle -p android assembleDebug lintDebug`. Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`. Install for testing using `adb install -r` on an authorized connected device. Release APK/AAB signing requires the owner's keystore; no release credentials are included. App package is `com.prismpuzzle.app`.

## iPhone and iPad
On macOS with Xcode and XcodeGen: `cd ios && xcodegen generate`, open `PrismPuzzle.xcodeproj`, select your signing team and a device, then build. Minimum iOS 15. CI builds an unsigned device app/IPA as a compile check; **unsigned is not directly installable or App Store ready**. For distribution, configure the owner's signing, test physical devices, and archive/export through Xcode. Strata integration must use a verified artifact and explicitly support the required signing method.

## Current verification and release gates
Eleven engine tests pass locally. The automated mobile browser smoke suite passed in GitHub Actions, covering rendering, controls, persistence, all three hint solves, offline in-session play and no horizontal overflow. iOS device compilation and unsigned IPA packaging passed in run 42558192074. Android setup failed before compilation because a setup action requested an obsolete SDK package; the workflow now requests explicit current packages. Local Chromium cannot start under this computer's socket restrictions, and native touch/gesture testing remains unverified. Actions artifact storage is full. A draft-release storage alternative is awaiting owner approval; no existing artifacts have been deleted. Check actual CI results for the latest native build status. No tablet installation, iPhone installation, store submission, or catalog listing has been verified yet.

Before shipping: complete real touch/VoiceOver/TalkBack testing, airplane-mode cold launch on both platforms, rotation/background/resume tests, corruption/recovery tests, native release signing, privacy/store forms, and listing screenshots. Review current store SDK/deployment requirements. The name and artwork are original to this project but have not undergone trademark clearance. Do not imply affiliation with the Rubik's brand.

## Structure
`web/` canonical game and UI; `tests/` Node engine and browser tests; `scripts/sync.mjs` native asset packaging; `android/` Gradle project; `ios/` XcodeGen project; `docs/` store copy and verification evidence.
