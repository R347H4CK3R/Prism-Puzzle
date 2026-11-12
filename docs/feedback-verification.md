# Prism feedback implementation checklist

- [x] Inspect canonical repository, release, and existing tests.
- [x] Implement bounded local suggestion preparation with a fixed private destination.
- [x] Test review gating, edit invalidation, malformed input, Unicode, and safe text handling.
- [x] Integrate the offline local-copy fallback into the existing bundled UI.
- [x] Exercise real application handlers and verify current and future-format saves remain intact.
- [x] Synchronize native web assets and run Node tests, syntax checks, and whitespace validation.
- [ ] Complete fresh browser layout and touch checks.
- [ ] Build and test the exact candidate source on macOS/iOS.
- [ ] Verify native copy controls and physical-device install/upgrade behavior.
- [ ] Publish only after required checks pass. Keep existing releases unchanged meanwhile.

Hosted build verification was unavailable when this candidate was prepared. This Linux workspace has no Xcode. No billing, permissions, authentication, or spending changes were made.

The autonomous repository review and release system is separate unfinished work. It must not treat incoming suggestions as instructions or authority, publish private feedback publicly, or bypass test and authorization gates.
