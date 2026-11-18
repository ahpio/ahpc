---
title: ahpc signs in to Dev Tunnels and reaches a private tunnel
domain: ahp
status: built
priority: high
created: 2026-11-17
revalidated: 2026-11-17
requires:
  - plans/ahp/20261117-0551-a-tunnel-host-is-reached-by-address/plan.md
changes: []
creates: []
decisions: []
refs:
  - git://eee0d28 - the last commit that holds the brief `briefs/ahpc-connects-through-a-private-dev-tunnel.md`, which this plan and its sibling cover
  - "[code://src/config.ts#L92-L100](../../../../src/config.ts#L92-L100) - `statePath`, where a file that ahpc writes goes"
  - "[code://src/update.ts#L105-L118](../../../../src/update.ts#L105-L118) - how ahpc writes `update.json`, the pattern the sign-in file copies with a private mode"
  - "[code://src/cli/main.ts#L36-L80](../../../../src/cli/main.ts#L36-L80) - the usage text, where the `tunnel` commands go"
  - "[code://src/flags.ts#L26-L33](../../../../src/flags.ts#L26-L33) - `COMMANDS`, the words that mean no screen"
  - "[code://src/connect.ts#L102-L194](../../../../src/connect.ts#L102-L194) - `connect`, where plan A turns a tunnel address into a port URL"
  - npm://@microsoft/dev-tunnels-management@1.3.61 - `TunnelManagementHttpClient`: `listTunnels` with `labels`, `getTunnel` with `tokenScopes: ['connect']`
  - npm://@microsoft/dev-tunnels-contracts@1.3.61 - `TunnelEndpoint.getPortUri`, the public URI of one port
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/adapter.ts - the device sign-in, the refresh at two thirds of the lifetime, and the client id
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/discovery.ts#L118-L150 - `deriveConnectionToken`, as VS Code computes it
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHost.ts - VS Code `1564f100807a`: the labels a host tunnel carries, and `protocolv5` as the lowest
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHostConnector.ts - VS Code `1564f100807a`: `deriveConnectionToken`
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/tunnel/discovery.ts - `listAgentHostTunnels` and `getTunnelById`, the management calls this plan makes
---

## Goal

A person signs in to Dev Tunnels once with `ahpc tunnel login`, and then reaches a private tunnel with `--host tunnel:<id>`.
`ahpc tunnel list` shows the tunnels of that account that VS Code would list.
ahpc picks the way in by itself, and a person can force one.
When the person has no token of their own, ahpc sends the token VS Code derives, because Dev Tunnels has checked the account.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "client_secret|refresh_token|grant_type" packages/tunnel-devtunnel/src/adapter.ts` in ahpd - the refresh sends the client id and the refresh token, with no client secret.
- The management client's constructor takes the user token callback as optional; `getTunnel` needs a tunnel id and a cluster id.
- ahpx finds the cluster of `tunnel:<id>` by listing the account's tunnels, then calls `getTunnel` for the connect token.
- `rg -n "writeFileSync" src/update.ts` - ahpc writes its state files with `writeFileSync`, with no mode.

### Runtime path

```
ahpc tunnel login -> device code -> GitHub -> tunnel.json (0600)
--host tunnel:<id> -> connect -> tunnelAccess -> signed-in: token (refreshed) -> listTunnels -> cluster
  -> each open: getTunnel(tokenScopes connect) -> getPortUri(31546) + X-Tunnel-Authorization -> plan A's opener
  -> no own token: deriveConnectionToken(id) in ?tkn=
```

### Gaps

- ahpc has no GitHub sign-in, and writes no secret to disk.
- No Dev Tunnels package is a dependency.
- No command lists tunnels, and no setting picks the way in.
- ahpc cannot derive VS Code's connection token.

## Answers

| What | Source | Task |
| --- | --- | --- |
| A tunnel is reached the VS Code way: a sign-in to the account, and the tunnels VS Code lists | Softov, 2026-11-16: "To do vscode way." | 02, 03 |
| Two ways in, anonymous and web forwarding; no relay | Softov, 2026-11-17: "Two ways, no relay" | 03 |
| The setting `tunnelAccess` picks the way in, `auto` by default, `anonymous` or `signed-in` | Softov, 2026-11-17: "Setting, default auto" | 03 |
| The sign-in is kept in a private file beside the config | Softov, 2026-11-17: "Private file" | 01 |
| The commands are `ahpc tunnel list` and `--host tunnel:<id>` | Softov, 2026-11-17: "ahpc tunnel list List remote agent hosts ... it could be as you told ahpc --host tunnel:<id> more simple" | 02, 03 |
| No Dev Tunnels package: the two tunnel service GETs go over `fetch` | Softov, 2026-11-17: "use fetch, drop the packages" | 02 |
| The derived token is sent only on the signed-in way, and only when the person gave no token | Softov, 2026-11-17: "Own token required" | 03 |
| A VS Code tunnel at protocol 6 is reached through its gateway, in this plan | Softov, 2026-11-17: "Sign-in branch" | 05 |
| The setting `tunnelHost` picks the agent host on a tunnel not bound to one: `editor` by default, or `dedicated` | Softov, 2026-11-17: "Setting, editor first" | 05 |
| A tunnel bound to one agent host gets that host, whatever `tunnelHost` says | (defaulted: VS Code's `resolveGatewaySelection`; the gateway gives no other) | 05 |
| The flag is `--tunnel-host` | (defaulted: the flag name of the `tunnelHost` key, as `--tunnel-access` is) | 05 |
| A close waits at most 2 seconds for the host, and a run with a socket left closing ends by `process.exit` | Softov, 2026-11-17: "Bounded close, then exit" | 05 |
| The sign-in is to the Dev Tunnels GitHub app, `Iv1.e7b89e013f801f03`, scope `tunnels`, by a device code | (defaulted: ahpd's `adapter.ts`; it is the app the `devtunnel` CLI and VS Code use) | 01 |
| The token is refreshed at two thirds of its lifetime, and when it has expired at a command's start | (defaulted: ahpd's `adapter.ts` does both) | 01 |
| The file is `tunnel.json`, written through `statePath` with mode `0600` | (defaulted: `update.json` is the sibling) | 01 |
| `ahpc tunnel login` and `ahpc tunnel logout` are the commands for the sign-in | (defaulted: the brief, committed in `eee0d28`) | 01 |
| `tunnel list` shows tunnels with the label `vscode-server-launcher` and a `protocolv` label of 5 or more | (defaulted: VS Code's filter, so ahpc lists what VS Code lists) | 02 |
| `tunnel list` prints the name, `<id>.<cluster>` and whether the host is online | (defaulted: `<id>.<cluster>` is the address an anonymous visitor uses) | 02 |
| `auto` tries anonymous when the address has a cluster and the person has a token, else signed-in | (defaulted: anonymous needs both, as plan A says) | 03 |
| A command that needs a sign-in and has none stops and names `ahpc tunnel login` | (defaulted: the brief, committed in `eee0d28`) | 03 |
| The flag is `--tunnel-access` | (defaulted: the flag name of the `tunnelAccess` key, as `--connection-token-file` is for `connectionTokenFile`) | 03 |

## Proposed architecture

- **Data flow** - `src/ahp/devtunnels.ts` holds the sign-in, the refresh and the two management calls; `connect` asks it for a URL and the headers on each open.
- **Event flow** - plan A's opener runs on each attempt, so a fresh connect token is fetched on each reconnect.
- **State flow** - `tunnel.json` holds the account, the token, the refresh token and when the token expires.
- **Layer responsibilities** - `src/ahp/devtunnels.ts`: Dev Tunnels and GitHub · `src/ahp/tunnel.ts`: the address, the URL and `deriveConnectionToken` · `src/connect.ts`: the way in · `src/cli/main.ts`: the `tunnel` commands.
- **Source-of-truth files** - `src/ahp/devtunnels.ts`, created by task 01.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - ahpc tunnel login keeps a sign-in](task-01-ahpc-tunnel-login-keeps-a-sign-in.md) | done | - |
| [02 - ahpc tunnel list prints the host tunnels](task-02-ahpc-tunnel-list-prints-the-host-tunnels.md) | done | 01 |
| [03 - A private tunnel is reached signed in](task-03-a-private-tunnel-is-reached-signed-in.md) | done | 02 |
| [04 - The docs say how to sign in to a tunnel](task-04-the-docs-say-how-to-sign-in.md) | done | 03 |
| [05 - A VS Code tunnel at protocol 6 is reached through its gateway](task-05-a-vs-code-tunnel-at-protocol-6.md) | done | 03 |

## Risks and tradeoffs

- The sign-in file holds a refresh token in plain text - mode `0600`, and `ahpc tunnel logout` removes it.
- Nobody has tested the web forwarding of `31546` against ahpd or VS Code. The check by hand goes in `.project/pending/` after task 03.
- Another person reaches a tunnel only if its owner gave their account or organisation access - `devtunnel access create <id> --org <org>` does it, and ahpd has no such operation.
- ahpc pins the tunnel service's `api-version` - a retired version is a change to `API_VERSION` in `src/ahp/devtunnels.ts`.

## Resume state

- **Done so far:** tasks 01 to 05, as [implemented.md](implemented.md) says.
- **Next action:** none; the check by hand passed on 2026-11-18.
- **Open questions:** none; every row in *Answers* is the user's or defaulted, and the user may erase a defaulted one.
- **Watch out for:** never send the derived token on the anonymous way; the ahpd problem file:///github/ahpd/.project/problems/an-anonymous-tunnel-admits-the-derived-token.md says why.

## Final verification checklist

- [ ] `ahpc tunnel login` signs in by a device code and writes `tunnel.json` with mode `0600`; `ahpc tunnel logout` removes it.
- [ ] `ahpc tunnel list` prints the account's host tunnels with `<id>.<cluster>`.
- [ ] `--host tunnel:<id>` connects signed in, with a connect token fetched on each open.
- [ ] With no token of the person's own, the signed-in way sends the derived token in `?tkn=`.
- [ ] `tunnelAccess` and `--tunnel-access` pick the way in; `auto` is the default.
- [ ] A VS Code tunnel at `protocolv6` is reached through `/agent-host/select`, and `tunnelHost` picks the agent host.
- [ ] `npm run typecheck` and `npm test` pass, and no Dev Tunnels package is a dependency.
