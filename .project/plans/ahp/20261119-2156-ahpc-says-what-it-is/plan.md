---
title: ahpc says what it is
domain: ahp
status: planned
priority: medium
created: 2026-11-19
revalidated: 2026-11-19
requires: []
changes: []
creates: []
decisions: []
refs:
  - https://github.com/ahpio/ahpw/blob/6d6d4ca/.project/briefs/a-client-says-what-it-is.md - the brief this plan and ahpw's `hosts/20261119-2156-a-client-says-what-it-is` cover
  - npm://@microsoft/agent-host-protocol@1.1.0 - `AhpClient.initialize` builds its request from `clientId`, `protocolVersions`, `initialSubscriptions` and `locale`, and drops `clientInfo`
  - "[code://src/ahp/live.ts#L1649](../../../../src/ahp/live.ts#L1649) - the client id, `ahpc-` and 8 hex characters"
  - "[code://src/ahp/live.ts#L1777-L1783](../../../../src/ahp/live.ts#L1777-L1783) - the first `initialize`, whose `clientInfo` the library drops"
  - "[code://src/ahp/live.ts#L2074-L2079](../../../../src/ahp/live.ts#L2074-L2079) - the `initialize` after a refused `reconnect`, with the same `clientInfo` and no `locale`"
  - "[code://src/version.ts#L43](../../../../src/version.ts#L43) - `version()`, ahpc's version from `package.json`"
  - "[code://test/session-page.test.ts#L40-L75](../../../../test/session-page.test.ts#L40-L75) - a scripted host that records each request, the pattern for the cases"
---

## Goal

ahpc tells a host what it is, so a Clients row reads "ahpc" with its version in place of a bare id.
ahpc's client id becomes `ahpc-<uuid>`, the format ahpw takes as `ahpw-<uuid>`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "clientInfo" src` - ahpc passes `{ name: 'ahpc' }` to both `initialize` calls.
- `rg -n "async initialize" -A12 node_modules/@microsoft/agent-host-protocol/dist/client/client.js` - the request leaves `clientInfo` out.
- `rg -n "ahpc-" src test` - the id is made in `live.ts` only; tests pass their own ids.

### Runtime path

```
liveHost() -> clientId -> initialize request -> ahpd keeps clientInfo -> ahpw's Clients row
```

### Gaps

- No `clientInfo` reaches the host.
- The fallback `initialize` after a refused `reconnect` sends no `locale`.
- The id is 8 hex characters.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpc sends a name, a title and a version | Softov, 2026-11-19: "write a brief for both"; "Both send a version" | 01 |
| ahpc ids are `ahpc-<uuid>` | Softov, 2026-11-19: "Yes, ahpc-<uuid>" | 01 |
| The name and the title are `ahpc` | (defaulted: ahpc runs in one way only) | 01 |
| `initialize` goes out as `client.request('initialize', ...)`, which sends the params as given | (defaulted: the typed `request` is public in the library, and sends `clientInfo` as the protocol defines it) | 01 |
| One function builds both `initialize` requests, so the fallback sends `locale` too | (defaulted: two copies were what let them differ) | 01 |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - initialize names ahpc](task-01-initialize-names-ahpc.md) | todo | - |

## Risks and tradeoffs

- A later library that sends `clientInfo` itself makes `request` the same as `initialize`; nothing breaks.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-initialize-names-ahpc.md](task-01-initialize-names-ahpc.md).
- **Open questions:** none.
- **Watch out for:** `client.initialize` drops `clientInfo`; never send it through that call.

## Final verification checklist

- [ ] An ahpc row in ahpw's Clients list reads "ahpc" with ahpc's version.
- [ ] Its client id is `ahpc-` and a whole UUID.
- [ ] `pnpm typecheck` and the test suite pass.
