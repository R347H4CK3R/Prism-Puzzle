# Prism Puzzle

An offline puzzle studio for iPhone, iPad and Android. Seven tactile games, unlimited free hints, no ads, accounts, analytics or network dependency.

## Games
- **Twist Cube**: manipulate a 3×3 cube, twist complete layers and rotate the object to inspect every side.
- **Pocket Cube**: a compact 2×2 variation with the same direct controls.
- **Block Assembly**: original studded pieces, three trays, lift/rotate/snap controls and collision checking. Not affiliated with LEGO.
- **Fifteen Tiles / Slide Nine**: move numbered wooden tiles into the gap.
- **Tower**: move four disks to the goal post without putting larger disks on smaller ones.
- **Lights Out**: flip neighboring lights to turn the board dark.

Hints run locally with no usage limit. Cube and sliding hints retrace the play path, Lights Out tracks pending flips, Tower uses shortest-path search, and Block Assembly finds valid fits or lifts a blocking piece. Not all hints are optimal.

## Run and verify
Requires Node 22 or newer for development. Runtime has no third-party JavaScript dependencies.

```
npm test
npm run sync
npm run preview
```

Open http://localhost:8080. Sync copies self-contained assets into both native wrappers. UI suites use Playwright and include Chromium touch emulation plus WebKit pointer checks; they are not physical-device evidence.

## Native builds
- iOS: install XcodeGen, run `cd ios && xcodegen generate`, then build the PrismPuzzle scheme in Xcode. Minimum iOS 15. Signing is required for installation on an iPhone or App Store submission.
- Android: Java 17, Android SDK 35 and Gradle 8.9; run `gradle -p android assembleDebug lintDebug`. Debug packages are for testing, not a signed Play Store release.

## Progress and privacy
Progress is stored only on the device. Existing v1 saves migrate without resetting valid puzzles. Damaged inputs are retained in verified recovery copies before replacing active progress. If backup verification fails, persistence pauses and play continues for the session. Reset clears active progress but keeps recovery copies.

## iOS candidate 1.1.2 (5)

Adds an offline suggestion composer with an explicit private-repository destination. Prepare and review text, then select it for manual copying. Submission happens outside the app using the user's own authorized GitHub account. No logs, saves, credentials, or identifiers are attached. Drafts are not persisted. Autonomous issue review and implementation are not part of this candidate.

The dedicated `prism-ios-candidate` Codemagic workflow runs the logic, package-validator, browser, feedback, and native simulator gates before assembling an unsigned device IPA. Android development and builds remain paused at 1.1.1 (4); only shared web assets are synchronized. This candidate is not a release until its exact-source hosted checks pass. Physical iPhone installation, signing and upgrade checks remain separate.
