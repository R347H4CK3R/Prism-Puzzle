# Prism suggestion review contract

Implement the reviewed pure metadata contract and recurring human-accountable Dot review. No issue-triggered evaluator, network or production app change. A recurring reviewer is preferable to keyword classification or executable issue workflows: it can reason about feasibility while keeping authorization outside untrusted content.

Store only exact-schema bounded identifiers, hashes, timestamps, enums and verified release metadata. Reject unknown fields rather than copying issue bodies. Initial and changed revisions require review; retain prior assessments, fail closed at the history limit, and never reset the original 30-day target. A caller-supplied clock makes deadlines deterministic.

Trusted reviewer assessments and freshly checked policy are separate arguments. This separation is a programming contract, not authentication: callers must verify actual owner authorization and never deserialize policy or assessments from issues. Pauses and missing grants block progression. Released status requires consistent exact-source test, IPA identity/hash, hosting and canonical catalog evidence. These are checked assertions, not remote verification.

The parent installs and verifies the actual recurring schedule, reviews implementation, and owns external mutations. No other apps change. No merge, build, version change, publication, or credentials are part of this module.
