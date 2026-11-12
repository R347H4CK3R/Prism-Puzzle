# Durable Suggestion Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Wire deterministic private intake, deadline and confirmed-delivery bookkeeping into the existing daily reviewer.

**Architecture:** Offline adapter reuses suggestion-contract.mjs. A bounded stdin/stdout CLI lets the trusted reviewer persist the resulting metadata-only checkpoint through its connector with an expected-head lease. No network, credentials, autonomous classifier or app-runtime changes.

**Tech Stack:** Existing Node.js ESM, node:test and built-in crypto only.

**Spec:** docs/superpowers/specs/2026-11-12-suggestion-queue-design.md

## Global Constraints
- Fixed private repository R347H4CK3R/Prism-Puzzle; preserve original 30-day targets and full history.
- Untrusted issue text cannot become policy or executable commands; no text persisted in checkpoints.
- Existing daily schedule only; ScopePilot and Android remain paused.
- Published IPA/catalog unchanged because app runtime is unchanged.

## Review Focus
- Partial comment fetches cannot establish unchanged revisions.
- Changed/closed/missing records cannot silently lose history or original deadlines.
- Failed delivery must remain eligible; confirmed delivery must deduplicate.
- Malformed or oversized input must fail without leaking input in errors.
- Assessed/released evidence still goes through the existing exact-source contract.

### Task 1: Queue adapter and CLI
**Files:** scripts/suggestion-queue.mjs, scripts/suggestion-queue-cli.mjs, tests/suggestion-queue.test.mjs, docs/suggestion-review.md, .suggestions/checkpoint.json.

**Interfaces:** emptyQueue(now); reconcileQueue(checkpoint,snapshot,now) -> {checkpoint,reviewIssues,missingIssues,notices}; assessQueue(checkpoint,issue,assessment,policy,now); acknowledgeNotice(checkpoint,notice,now). Snapshot is a complete normalized issue/comment set independently retrieved by the caller, never executable policy.

- [x] Write behavior tests for empty queue, text/comment edits, rejected incomplete snapshots, closed/missing retention, deadline boundaries, receipt deduplication, assessment gate enforcement, malformed metadata and CLI side-effect-free output.
- [x] Run focused tests and observe missing behavior failures.
- [x] Implement strict bounded adapter and JSON-only CLI, using existing contract for record/assessment validation.
- [x] Run focused and full npm test; validate unchanged app runtime and IPA source relationship.
- [ ] Independent code review, fix findings, rerun tests.
- [ ] Commit private tooling plus verified empty initial checkpoint and reviewer runbook. Update existing automation instructions through parent, not a second schedule.
