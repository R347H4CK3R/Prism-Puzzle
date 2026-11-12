# Suggestion review implementation plan

Goal: pure bounded tracking and truthful release gates.
Architecture: strict metadata schema, immutable return values, caller-supplied clock and independently trusted assessment/policy. No I/O.
Tech stack: existing Node ESM and node:test; no dependencies.
Spec: ../specs/2026-11-12-suggestion-review-design.md

Constraints: only assigned module/tests/docs; no credentials or issue text; no app or pipeline changes.
Review focus: forged extra fields, revised comments, leap-day deadline, stale policy, inconsistent release evidence.

- [x] Write tests for createRecord, refreshRecord, assessRecord, deadlineStatus and invalid schema/release evidence; run to RED before implementation.
- [x] Implement exact schemas with bounded history and no side effects; run focused tests to GREEN.
- [x] Document caller authentication boundary and recurring review instructions.
- [x] Run full npm test and report source-only evidence to parent for review. No commits or external changes.

Verification record: first RED had 7 failures because the four operations were absent (one rejection-only test passed vacuously). First GREEN passed 8 contract tests. A second RED demonstrated missing version/build consistency at release (Missing expected exception); the fix compares all base candidate evidence. Final focused suite: 11/11. Full npm test: 71/71. npm emitted only the pre-existing unknown http-proxy environment warning. No native/browser/build evidence is claimed. Parent review remains required.

Parent-review corrections: added exact canonical catalogURL and rejected four-digit-year deadline overflow. After allowing the new schema field, both new substantive tests were RED with Missing expected exception. Validation fixes made focused tests 13/13 GREEN and full suite 73/73 GREEN. Documented that catalogSourceSha is independently verified provenance joined via the catalog artifact hash, not a field read from public catalog JSON. Existing catalog identity/hash gates remain.
