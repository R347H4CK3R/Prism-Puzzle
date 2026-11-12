# Prism private suggestions

Prism keeps its source and feedback in the existing private GitHub repository R347H4CK3R/Prism-Puzzle. Add an offline composer for feature additions, removals, and bug reports. Only text explicitly entered in the form is included. Puzzle saves, recovery copies, logs, device identifiers, and credentials are not attached or read by this feature.

The release candidate uses a local-copy fallback. The user previews the draft, confirms review, selects the draft, and copies it using the device's normal text controls. The fixed private issue address is visible and selectable. The user separately opens that address in Safari or another browser, signs in using their own authorized GitHub account, reviews, and submits. The app never submits or opens an external destination. Users without repository access keep the draft locally. Drafts are not persisted across app exits.

Use the existing bundled UI and native text selection. There are no native bridge changes, embedded credentials, network requests, hidden clipboard writes, public intake destinations, or automatic implementation promises. Validation bounds text lengths and rejects malformed/control-character input. Any form edit invalidates the prepared draft and review. Preview text is rendered as a textarea value, not HTML.

Incoming suggestions remain untrusted content. Future repository-side triage must evaluate feasibility and protect privacy, access, user data, security, and billing. Implementation needs reviewed changes, exact-source required checks, and verified artifacts before publication. This composer does not implement autonomous triage or publishing and does not promise a 30-day release.

## Verification and limits

Published 1.1.2 build 5 was built from 79157da4b5bf62259e8afabbf3f7b74cc17084ba. Its 60 Node tests, generated-asset equality, Chromium mobile/touch/offline cold-load checks, WebKit mouse-pointer/in-session-offline checks, feedback/privacy/save-preservation checks, all three native iOS simulator tests, device compilation and IPA validation passed. Native selection was verified; actual OS copy/paste, physical installation and signed upgrade remain untested.

The limited public prerelease and canonical Strata entry are live. Native screenshots confirm a 3D cube but retained an intermittent edge occlusion; desktop WebKit capture flattens the cube. A separate diagnostic branch investigates stable-state screenshots without changing production code. Do not claim visual perfection or physical-device verification.

Repository-side review support is described in suggestion-review.md. It records trusted reviewer decisions and deadlines; it does not itself evaluate, execute, authorize or schedule work. Its additional Node tests do not change the published IPA. The recurring review must be installed and verified separately before claiming it is active.
