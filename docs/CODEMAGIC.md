# Manual iOS verification

Run `prism-ios-candidate` on the exact reviewed candidate branch. It uses the existing free-eligible M2 connection, Xcode 26.2 and Node 22, capped at 60 minutes. Confirm enough included minutes and keep billing disabled before starting. Run one app at a time. There are no automatic triggers, signing secrets, public releases, store uploads, or Android build steps in this workflow.

The workflow preserves Node regression tests, generated-asset equality, Chromium/WebKit checks, all native iOS puzzle tests, and unsigned device compilation. It additionally checks the feedback composer in both browser engines and the native simulator. Required checks must pass before artifacts enter `cm-output/verified/`.

The package verifier checks identity, candidate version/build, minimum iOS 15, arm64 device platform, ZIP integrity and exact bundled-source bytes. Outputs include a verified unsigned IPA, private source archive, verification JSON and SHA-256 sums. Diagnostics and source remain private artifacts. Never move private source or diagnostic logs to a public release.

Signing, physical-device installation and update continuity still require separate verification. This file describes the intended pipeline, not a claim it passed. The prior multi-platform script remains as historical source but is not selected by this branch's Codemagic configuration. Android is paused.

Local checks: `npm test`, `python3 tests/test_codemagic_ipa.py`, `bash -n scripts/verify-ios-candidate.sh`. Local checks cannot substitute for hosted Mac/browser/simulator execution.
