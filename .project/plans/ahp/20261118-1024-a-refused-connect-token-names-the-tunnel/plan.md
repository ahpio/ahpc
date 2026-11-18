---
title: A connect token the tunnel refuses is named as the tunnel's
domain: ahp
status: planned
priority: medium
created: 2026-11-18
revalidated: 2026-11-18
requires: []
changes: []
creates: []
decisions: []
refs:
  - git://9c14a17 - the last commit that holds the problem `problems/a-refused-connect-token-blames-the-host-token.md`, which this plan covers
  - "[code://src/ahp/refused.ts#L32-L64](../../../../src/ahp/refused.ts#L32-L64) - `whyNoConnection`, which reads every 401 as the host's"
  - "[code://src/ahp/refused.ts#L76-L86](../../../../src/ahp/refused.ts#L76-L86) - `shortText`, which answers nothing for an empty body and for a long one alike"
  - "[code://src/ahp/tunnel.ts#L84](../../../../src/ahp/tunnel.ts#L84) - `tunnelRefused`, the sentence for a refused connect token"
  - "[code://src/connect.ts#L363-L376](../../../../src/connect.ts#L363-L376) - `stopsOnRefusal`, which ends the retries on that sentence"
  - "[code://test/refused.test.ts](../../../../test/refused.test.ts) - the loopback hosts each case is asked against"
---

## Goal

A connect token that a tunnel refuses is named as the connect token, with how to get a new one.
Today ahpc says the host refused its connection token, which sends the person to the wrong token.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

On 2026-11-18, a private tunnel in front of a test ahpd answered `curl` with these replies:

| Tokens | Status | Body | `WWW-Authenticate` |
| --- | --- | --- | --- |
| Good connect token, good host token | 426 | `ahpd speaks the Agent Host Protocol over WebSocket` | no |
| Good connect token, wrong host token | 401 | `A connection token is required` | yes |
| Bad connect token, either host token | 401 | empty | no |
| No connect token | 302 to a GitHub sign-in | | |

### Runtime path

```
socket fails -> whyNoConnection(url, token, tunnel with headers) -> GET with the same headers
  -> 401 with an empty body -> tunnelRefused(host, id, true) -> stopsOnRefusal -> StopRetrying
```

### Gaps

- `whyNoConnection` does not tell an empty 401 from one with a body.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A 401 with an empty body, through a tunnel with a connect token sent, is the tunnel refusing the connect token | Softov, 2026-11-18: "Empty 401 is the tunnel's" | 01 |
| Any other 401 keeps the host's sentence | (defaulted: ahpd's 401 has a body) | 01 |
| The tunnel's refusal ends the retries, through `stopsOnRefusal` as a redirect does | (defaulted: `stopsOnRefusal` stops on `tunnelRefused` with a token) | 01 |

## Proposed architecture

- **Data flow** - `whyNoConnection` reads whether the body is empty beside the short text it quotes.
- **Event flow** - unchanged.
- **State flow** - unchanged.
- **Layer responsibilities** - `src/ahp/refused.ts`: the sentence.
- **Source-of-truth files** - [`code://src/ahp/refused.ts`](../../../../src/ahp/refused.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - An empty 401 through a tunnel is the tunnel's](task-01-an-empty-401-is-the-tunnels.md) | todo | - |

## Risks and tradeoffs

- A host whose 401 has an empty body is taken for the tunnel - ahpd sends a body with its 401.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-an-empty-401-is-the-tunnels.md](task-01-an-empty-401-is-the-tunnels.md).
- **Open questions:** none.
- **Watch out for:** a tunnel with no connect token sent keeps the host's sentence for every 401.

## Final verification checklist

- [ ] An empty 401 through a tunnel with a connect token says the connect token was refused.
- [ ] A 401 with a body says the host refused its token.
- [ ] Step 8 of the tunnel check prints `refused the connect token` and stops.
- [ ] `npm run typecheck` and `npm test` pass.
