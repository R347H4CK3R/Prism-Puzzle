# Prism Puzzle 1.1.1 (4)

Protects saved progress from newer app formats. Unsupported save schemas keep their original bytes unchanged; gameplay can continue for the current session without overwriting those saves. Supported older saves still migrate normally. Existing recovery copies and the confirmed reset flow are unchanged.

The iOS and Android bundle/application identifier stays `com.prismpuzzle.app`. Both native builds advance from version 1.1.0 build 3 to version 1.1.1 build 4. The version change does not reset or migrate app data.

The 1.1.0-metadata candidate passed all Codemagic checks, but that result does not certify this incremented source. Run the complete manual `prism-verified-mobile` workflow on this exact commit before publication. It must pass Node regressions, generated-asset equality, Chromium and WebKit UI checks, Android build/lint, native iOS UI tests, device compilation and package verification.

Distribution remains an unsigned iPhone/iPad preview requiring compatible signing, not an App Store or physically verified build. Actual installation, signed upgrade continuity and physical-device gameplay remain unverified. Do not claim those checks passed. Public distribution should contain only reviewed application artifacts, checksums and release evidence; the source repository remains private.
