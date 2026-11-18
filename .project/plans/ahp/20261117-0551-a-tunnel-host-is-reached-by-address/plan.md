---
title: A host behind a Dev Tunnel is reached by its tunnel address
domain: ahp
status: built
priority: high
created: 2026-11-17
revalidated: 2026-11-17
requires: []
changes: []
creates: []
decisions: []
refs:
  - git://eee0d28 - the last commit that holds the brief `briefs/ahpc-connects-through-a-private-dev-tunnel.md`, which this plan and its sibling cover
  - "[code://src/connect.ts#L102-L194](../../../../src/connect.ts#L102-L194) - `connect(Where)`, the one place a host string becomes a live connection, and `whyNoConnection` on a failure"
  - "[code://src/ahp/live.ts#L543-L556](../../../../src/ahp/live.ts#L543-L556) - `load()` opens the socket with `WebSocketTransport.connect(url)`, which takes a URL only"
  - "[code://src/ahp/live.ts#L1543-L1557](../../../../src/ahp/live.ts#L1543-L1557) - `liveHost`: the token goes in `?tkn=`, and `options.connect` replaces the opener"
  - "[code://src/ahp/live.ts#L1940-L1990](../../../../src/ahp/live.ts#L1940-L1990) - the reconnect loop calls `openTransport()` on each attempt and never stops"
  - "[code://src/ahp/refused.ts#L20-L60](../../../../src/ahp/refused.ts#L20-L60) - `whyNoConnection`: one GET to the same address, read by its status"
  - "[code://src/config.ts#L159-L175](../../../../src/config.ts#L159-L175) - `connectionToken`, the pattern for a second secret read from a flag and a variable"
  - "[code://src/cli/main.ts#L264-L275](../../../../src/cli/main.ts#L264-L275) - a command reads `--host` and the token flags into `Where`"
  - "[code://src/tui.tsx#L440-L455](../../../../src/tui.tsx#L440-L455) - the screen reads the host and the token the same way"
  - "[code://test/refused.test.ts](../../../../test/refused.test.ts) - the tests for `whyNoConnection`, which the new sentences follow"
  - npm://@microsoft/agent-host-protocol@1.1.0 - `ws`: `WebSocketTransport.fromSocket(socket)` wraps a socket that is already open
  - https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/cli-commands - a port URL is `https://<id>-<port>.<cluster>.devtunnels.ms/`; `devtunnel token TUNNELID --scopes connect`
  - https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/security - a client access token goes in `X-Tunnel-Authorization: tunnel <token>`
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/tunnel/discovery.ts - `buildTunnelHeaders`: the two headers on the upgrade
  - "file:///github/ahpd/.project/problems/an-anonymous-tunnel-admits-the-derived-token.md - why an anonymous visitor must bring a token of their own"
---

## Goal

A person reaches an AHP host behind a Dev Tunnel with `--host tunnel:<id>.<cluster>`, with no public port and no `devtunnel` CLI.
On an anonymous tunnel, the person brings their own token for the host.
On a private tunnel, the person can pass a connect token from the tunnel's owner.
When the tunnel refuses, or the connect token has expired, ahpc stops and says how to get in.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "openTransport\(" src` - `live.ts:1657` on the first connection and `live.ts:1960` on each reconnect, so an opener given in `options.connect` runs on every attempt.
- `rg -n "await connect\(" src` - `tui.tsx:310`, `tui.tsx:487` and `cli/main.ts:543`; every front end reaches a host through `connect(Where)`.
- 2026-11-17: `new WebSocket(url, { headers })` sent `X-Tunnel-Authorization` to a local server on Node 22.0.0, 22.23.5 and 24.19.0.
- The Dev Tunnels CLI page shows a port URL as `https://l3rs99qw-3000.usw2.devtunnels.ms/` and a tunnel id as `l3rs99qw`.
- The brief's run on 2026-11-04: a private tunnel answered the WebSocket upgrade with a 302 to a GitHub sign-in.

### Runtime path

```
--host tunnel:<id>.<cluster> -> connect(Where) -> tunnelOf(host) -> portUrl(id, cluster) + headers
  -> liveHost({ url, token, connect: () => open(url, headers) }) -> new WebSocket(url, { headers }) -> WebSocketTransport.fromSocket
  -> a refusal -> whyNoConnection(url, token, headers) -> a tunnel sentence; a refused connect token -> StopRetrying -> the loop ends
```

### Gaps

- No address names a tunnel, and nothing builds a port URL from a tunnel id and its cluster.
- The socket opener sends no headers, and `whyNoConnection` sends none either.
- The reconnect loop has no way to stop, so a refused connect token would retry for ever.
- No sentence names a tunnel's sign-in page, a missing own token or an expired connect token.
- `Not found: devtunnel, tunnel: - searched rg -n -i "devtunnel|tunnel:" src test docs`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpc reaches any AHP host behind a tunnel, not only ahpd | Softov, 2026-11-17: "we cannot infer that ahpc will be used only with ahpd. it can be used with vscode or another ahp host that may exists" | 01 |
| Two ways in, anonymous and web forwarding; no relay | Softov, 2026-11-17: "Two ways, no relay" | 01, 02 |
| The tunnel is planned as two plans; the sign-in plan requires this one | Softov, 2026-11-17: "Two plans, B requires A" | - |
| An anonymous visitor names the tunnel `tunnel:<id>.<cluster>` | Softov, 2026-11-17: "tunnel:<id>.<cluster>" | 01 |
| Anonymous access needs the person's own token; the derived token is sent only on the signed-in way | Softov, 2026-11-17: "Own token required" | 01 |
| A connect token passed by hand that has expired stops ahpc, with one sentence that says how to get a new one | Softov, 2026-11-16: "Stop and say how" | 03 |
| No ahpd change | Softov, 2026-11-16: "No ahpd operation" | - |
| A connect token passed by hand also needs the person's own token | (defaulted: the derived token is sent only on the signed-in way, as the answer on anonymous access says) | 01 |
| The port is `31546` | VS Code's `TUNNEL_AGENT_HOST_PORT`, file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHost.ts | 01 |
| The flag is `--tunnel-token` and the variable is `AHPC_TUNNEL_TOKEN` | (defaulted: as `--token` and `AHPC_TOKEN` name the host's token) | 02 |
| A connect token goes in `X-Tunnel-Authorization: tunnel <token>`, with `X-Tunnel-Skip-AntiPhishing-Page: true` | (defaulted: the Dev Tunnels security page and ahpx's `buildTunnelHeaders`) | 02 |
| The headers are sent only with a connect token; an anonymous socket sends none | (defaulted: the brief's run reached an anonymous port with no header) | 02 |
| An opener throws `StopRetrying` to end the reconnect loop | (defaulted: the loop already calls the opener on each attempt, so the opener is where the reason is known) | 03 |

## Proposed architecture

- **Data flow** - `connect` reads a `tunnel:` host with `tunnelOf`, and hands `liveHost` the port URL, the person's token and an opener that sends the headers.
- **Event flow** - a failed open goes to `whyNoConnection` with the same headers. A refusal that a retry cannot fix throws `StopRetrying`, which ends the loop.
- **State flow** - nothing is stored; the connect token comes from the flag or the variable on each run.
- **Layer responsibilities**
  - `src/ahp/tunnel.ts`: the address, the URL and the headers.
  - `src/ahp/live.ts`: the opener and the end of the loop.
  - `src/ahp/refused.ts`: the sentences.
  - `src/connect.ts`, `src/cli/main.ts` and `src/tui.tsx`: the flag and the variable.
- **Source-of-truth files** - `src/ahp/tunnel.ts`, created by task 01.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A tunnel address opens its port URL](task-01-a-tunnel-address-opens-its-port-url.md) | done | - |
| [02 - A connect token rides on the socket](task-02-a-connect-token-rides-on-the-socket.md) | done | 01 |
| [03 - A refused tunnel stops and says how](task-03-a-refused-tunnel-stops-and-says-how.md) | done | 02 |
| [04 - The docs say how to reach a tunnel](task-04-the-docs-say-how-to-reach-a-tunnel.md) | done | 03 |

## Risks and tradeoffs

- No test reaches a real tunnel - the check by hand goes in `.project/pending/` when task 03 is done.
- A plain `tunnel:<id>` needs the sign-in plan - until it is built, ahpc refuses it with a sentence that names `tunnel:<id>.<cluster>`.
- Nobody knows yet what a tunnel answers an expired connect token with - task 03 reads a 302 and a 401 the same. The check by hand confirms it.
- An anonymous ahpd tunnel without `requireToken` admits anyone with the URL - ahpc never sends the derived token there.
  An ahpd problem file records the hole.

## Resume state

- **Done so far:** tasks 01 to 04, as [implemented.md](implemented.md) says.
- **Next action:** none; the check by hand passed on 2026-11-18.
- **Open questions:** none; every row in *Answers* is the user's or defaulted, and the user may erase a defaulted one.
- **Watch out for:** the derived token is not built in this plan; it belongs to [the sign-in plan](../20261117-0551-ahpc-signs-in-to-dev-tunnels/plan.md).

## Final verification checklist

- [ ] `--host tunnel:<id>.<cluster>` opens `wss://<id>-31546.<cluster>.devtunnels.ms` with the person's token in `?tkn=`.
- [ ] A tunnel address with no token of the person's own stops before any socket opens, with one sentence.
- [ ] `--tunnel-token` or `AHPC_TUNNEL_TOKEN` puts both headers on the upgrade and on the GET that reads a refusal.
- [ ] A refused connect token ends the reconnect loop, and the sentence names `devtunnel token <id> --scopes connect` and `AHPC_TUNNEL_TOKEN`.
- [ ] `npm run typecheck` and `npm test` pass.
- [ ] `docs/start/CONNECT.md`, `docs/reference/ENVIRONMENT.md` and the usage text describe the tunnel address and the flag.
