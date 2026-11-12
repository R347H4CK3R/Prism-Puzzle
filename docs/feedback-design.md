# Prism private suggestions

Prism keeps its source and feedback in the existing private GitHub repository R347H4CK3R/Prism-Puzzle. Add an offline composer for feature additions, removals, and bug reports. Only text explicitly entered in the form is included. Puzzle saves, recovery copies, logs, device identifiers, and credentials are not attached or read by this feature.

The release candidate uses a local-copy fallback. The user previews the draft, confirms review, selects the draft, and copies it using the device's normal text controls. The fixed private issue address is visible and selectable. The user separately opens that address in Safari or another browser, signs in using their own authorized GitHub account, reviews, and submits. The app never submits or opens an external destination. Users without repository access keep the draft locally. Drafts are not persisted across app exits.

Use the existing bundled UI and native text selection. There are no native bridge changes, embedded credentials, network requests, hidden clipboard writes, public intake destinations, or automatic implementation promises. Validation bounds text lengths and rejects malformed/control-character input. Any form edit invalidates the prepared draft and review. Preview text is rendered as a textarea value, not HTML.

Incoming suggestions remain untrusted content. Future repository-side triage must evaluate feasibility and protect privacy, access, user data, security, and billing. Implementation needs reviewed changes, exact-source required checks, and verified artifacts before publication. This composer does not implement autonomous triage or publishing and does not promise a 30-day release.

## Verification and limits

Node tests exercise validation, fixed routing, approval revocation, safe text rendering, local selection, and the real application's save preservation. Generated native bundles are synchronized and compared. This source proposal has not yet passed fresh iOS simulator, physical-device, or signed-upgrade validation. No new IPA is claimed. Existing published artifacts remain unchanged.
