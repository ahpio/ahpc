---
title: createSession waits while the host reports progress
domain: cli
status: planned
priority: high
created: 2026-11-12
revalidated: 2026-11-12
requires:
  - file:///github/ahpd/.project/plans/host/20261112-0821-making-a-session-reports-progress/plan.md
changes: []
creates: []
refs:
  - git://20840a6 - the commit of ahpc this plan was checked at
  - "[code://src/ahp/live.ts#L1655](../../../../src/ahp/live.ts#L1655) - the client is made with `{}`, so the library's 30 s limit holds for every request"
  - "[code://src/ahp/live.ts#L1958](../../../../src/ahp/live.ts#L1958) - the client made again at a reconnect, also with `{}`"
  - "[code://src/ahp/live.ts#L2546-L2553](../../../../src/ahp/live.ts#L2546-L2553) - `createSession` already sends a `progressToken`"
  - "[code://src/ahp/live.ts#L1603-L1617](../../../../src/ahp/live.ts#L1603-L1617) - `root/progress` is read into `working` and `onProgress`"
  - npm://@microsoft/agent-host-protocol - `requestTimeoutMs`, set once per client; zero turns it off
  - file:///github/ahpd/.project/pending/windows-machine-paths-checks.md - the check where `session new` stopped at 30 s
---

## Goal

`ahpc session new` waits for a session in a new machine for as long as the host says it is working.
Today every request stops at 30 s, and making a machine on Docker Desktop takes about 38 s.
A hung create still fails, after a time with no progress.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "new ahp.Client\(" src/ahp` - two places, both with `{}`.
- `rg "requestTimeoutMs" src` - nothing sets it.

### Runtime path

```
session new -> host.createSession -> client.request('createSession', progressToken) -> 30 s RpcTimeoutError
```

### Gaps

- The library takes one limit per client, and no limit per request.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpd sends progress for a create, and ahpc waits while it comes | Softov, 2026-11-12: "ahpd reports, ahpc waits" | 01 |
| The client is made with `requestTimeoutMs: 0`, and ahpc keeps 30 s for every request but `createSession` itself | `(defaulted: every other request keeps today's limit)` | 01 |
| `createSession` fails after 60 s with no `root/progress` for its token | `(defaulted: the value in the question)` | 01 |
| `session new` prints each progress message on stderr | `(defaulted: stdout holds the JSON answer)` | 01 |

## Proposed architecture

- **Data flow** - a `request` wrapper in `live.ts` runs ahpc's own timer; for `createSession`, each `root/progress` on its token starts the 60 s again.
- **Layer responsibilities** - ahp: the wrapper and the timer · cli: the stderr lines.
- **Source-of-truth files** - [`code://src/ahp/live.ts`](../../../../src/ahp/live.ts)

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - createSession waits on progress](task-01-createsession-waits-on-progress.md) | todo | - |

## Risks and tradeoffs

- A host before the ahpd plan sends no progress - `createSession` then fails after 60 s, not 30 s.
- ahpc's own timer must clear on every answer - a case checks that no timer is left.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-createsession-waits-on-progress.md](task-01-createsession-waits-on-progress.md), after the ahpd plan is built.
- **Open questions:** none.
- **Watch out for:** the reconnect makes a new client at `live.ts:1958`, which needs the same config.

## Final verification checklist

- [ ] A create that reports progress for 90 s answers.
- [ ] A create with no progress fails after 60 s with a sentence that says so.
- [ ] Other requests still fail after 30 s.
