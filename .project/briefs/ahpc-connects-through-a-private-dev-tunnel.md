---
title: ahpc connects through a Dev Tunnel
created: 2026-11-04
refs:
  - git://6683358 - the commit of ahpc the facts were checked at
  - git://acc5b9b9c - the commit of ahpd the facts were checked at
  - "[code://src/ahp/live.ts#L549-L556](../../src/ahp/live.ts#L549-L556) - ahpc opens its socket with `WebSocketTransport.connect(url)`, which takes a URL only"
  - "[code://src/ahp/live.ts#L1546](../../src/ahp/live.ts#L1546) - the host's connection token goes in `?tkn=`"
  - "[code://src/ahp/refused.ts#L16](../../src/ahp/refused.ts#L16) - the plain GET that reads why a host refused, to the same address"
  - "[code://src/config.ts#L160-L175](../../src/config.ts#L160-L175) - `connectionToken`: `--token`, `--connection-token-file`, `AHPC_TOKEN` and the config file, in that order"
  - "[code://src/config.ts#L92-L100](../../src/config.ts#L92-L100) - `statePath`, where a file that ahpc writes goes, beside the hand-written `config.json`"
  - "[code://src/cli/main.ts#L264](../../src/cli/main.ts#L264) - a command reads `--host`, `AHPC_HOST` and the config file"
  - "[code://src/tui.tsx#L441](../../src/tui.tsx#L441) - the screen reads `AHPC_HOST` and the config file a second time"
  - npm://@microsoft/agent-host-protocol@1.1.0 - `dist/ws/transport.js`: `connect` says \"Custom HTTP headers are not supported\"; `fromSocket` wraps a socket that is already open
  - npm://@microsoft/dev-tunnels-management@1.3.61 - `TunnelManagementHttpClient`: the user token callback is optional for an anonymous client; `getTunnel` takes a tunnel id and a cluster id; `tokenScopes` asks for a connect token
  - npm://@microsoft/dev-tunnels-contracts@1.3.61 - `TunnelEndpoint.getPortUri`, the public URI of one port
  - https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/security - client access tokens and the `X-Tunnel-Authorization` header, page updated 2026-02-12
  - https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/cli-commands - `devtunnel token TUNNELID --scopes connect`, page updated 2026-02-12
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHost.ts - VS Code `1564f100807a`: port `31546`, the `vscode-server-launcher` label, `protocolv5` as the lowest version, the `tunnel:` address prefix
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHostConnector.ts - VS Code `1564f100807a`: the relay connection and `deriveConnectionToken`
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/discovery.ts#L37-L60 - ahpd's tunnel carries `protocolv5` and `vscode-server-launcher`
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/kind.ts#L320-L377 - how ahpd admits the derived token and a person's own token
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/adapter.ts#L1-L42 - ahpd's sign-in to the Dev Tunnels GitHub app
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/plugin.ts#L42 - an ahpd tunnel is private by default
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/tunnel/discovery.ts - ahpx lists tunnels, asks for a connect token and opens the public URL
---

# ahpc connects through a Dev Tunnel

Softov wants ahpc to reach an AHP host behind NAT, with no public port, through a Dev Tunnel.
The main client of such a tunnel is VS Code, and ahpc must reach the same tunnels.
The host can be ahpd, VS Code's own agent host, or another AHP host, so ahpc assumes nothing about it.
Several people can use one tunnel, and each person stays a separate person on the host.

## What others do

- **VS Code.**
  It signs in with the account that owns the tunnel, GitHub or Microsoft.
  It lists that account's tunnels with the label `vscode-server-launcher` and a `protocolv` label of 5 or more.
  It connects through the Dev Tunnels relay, SSH over a WebSocket, to the forwarded port `31546`.
  It works out the host's connection token from the tunnel id: base64url of its SHA-256.
  It names such a host `tunnel:<tunnelId>`, and it uses five Dev Tunnels packages.
- **ahpx.**
  It reads a GitHub token from `GITHUB_TOKEN`, `GH_TOKEN` or `gh auth token`.
  It lists tunnels with the label `protocolv5`, and asks the management API for a connect token with `tokenScopes: ['connect']`.
  It opens the port's public `wss://` URL with `X-Tunnel-Authorization: tunnel <token>` and `X-Tunnel-Skip-AntiPhishing-Page: true`.
  It needs only the management and contracts packages.
  A saved profile keeps the tunnel id and the cluster id apart, and the URL falls back to `wss://<id>-<port>.<cluster>.devtunnels.ms`.
- **Dev Tunnels.**
  A tunnel port is private by default, and a port can allow anonymous access.
  A client access token lets the bearer connect to the ports of one tunnel, sent as `X-Tunnel-Authorization: tunnel <token>`.
  A client access token expires after 24 hours.
  `devtunnel token <id> --scopes connect` issues one.

## What a host has today

ahpd is one host this change must work with.

- Its tunnel carries `protocolv5` and `vscode-server-launcher`, and forwards `31546`, so VS Code finds it.
- Its tunnel is private by default, and its one access setting is the `anonymous` toggle.
  No ahpd operation gives another GitHub user or organisation access to the tunnel.
- A visitor who sends the derived token gets in as the person the tunnel record names.
  On a host with no users, that visitor gets the daemon's own token.
- Any other token is carried as the visitor wrote it, so a person with their own token stays that person.
  A tunnel that requires a token admits nobody on the derived token alone.
- It signs in to the Dev Tunnels GitHub app, `Iv1.e7b89e013f801f03` with the scope `tunnels`, by a device code.
  The token lasts eight hours, and ahpd refreshes it with the refresh token.

VS Code's host expects the derived token, because VS Code's own client never sends another one.

## What ahpc has today

- ahpc opens its socket with `WebSocketTransport.connect(url)`, which sends no headers in protocol 1.1.0.
  The same class has `fromSocket`, which wraps a socket that is already open.
- The host's token goes in `?tkn=`, and the GET that reads a refusal goes to the same address.
- ahpc takes the host's token from `--token`, `--connection-token-file`, `AHPC_TOKEN` or the config file.
- Two places read the host: a command at `src/cli/main.ts:264`, and the screen at `src/tui.tsx:441`.
- A file that ahpc writes goes beside `config.json` through `statePath`, as `update.json` does.
  ahpc writes no secret to disk today.
- ahpc has no Dev Tunnels package, and needs Node 22 or later.
- On 2026-11-17, `new WebSocket(url, { headers })` sent `X-Tunnel-Authorization` to a local server on Node 22.0.0, 22.23.5 and 24.19.0.

## Who writes

- ahpc: no pull request is open.
  No unmerged branch on `ahpio/ahpc` touches `src/ahp/live.ts`, `src/ahp/refused.ts`, `src/config.ts`, `src/cli/main.ts` or `src/tui.tsx`.
  The worktree `ahpc.worktrees/artifact-tools-brief` holds one brief file only.
- ahpd: the change touches no ahpd file.
- [ahpc keeps named servers](ahpc-keeps-named-servers.md) also reads the host, and a saved server can name a tunnel.
  This brief is built first.

## The change

- `--host tunnel:<id>`, `AHPC_HOST` and the config file's `host` name a host behind a Dev Tunnel.
  Both places that read the host accept it.
- `ahpc tunnel list` prints the tunnels of the signed-in account that VS Code would list: name, id, cluster, and whether the host is online.
- `ahpc tunnel login` signs in by a device code, to the Dev Tunnels GitHub app that ahpd and VS Code use.
  `ahpc tunnel logout` removes the sign-in.
- The sign-in is a token and a refresh token, in a state file beside `config.json` with mode `0600`.
  ahpc refreshes the token as ahpd does.
  A command that needs a sign-in and has none stops, and names `ahpc tunnel login`.
- The setting `tunnelAccess` picks the way in: `auto` by default, `anonymous` or `signed-in`.
  A flag sets it for one run.
- `anonymous` opens the port's public `wss://` URL with the host's token only, and loads no Dev Tunnels package.
- `signed-in` asks the management API for a connect token, on each connect and each reconnect.
  It opens the same URL with `X-Tunnel-Authorization: tunnel <token>` and `X-Tunnel-Skip-AntiPhishing-Page: true`.
- `auto` tries `anonymous` first, and `signed-in` when the tunnel refuses an anonymous visitor.
- A person without access to the tunnel can pass a connect token from its owner, through a flag or an environment variable.
  When that token expires, ahpc stops reconnecting and prints one sentence that names `devtunnel token <id> --scopes connect` and the variable.
- The host's connection token is the person's own when one is given.
  Without one, ahpc sends the token derived from the tunnel id, as VS Code does.
- ahpc opens the socket itself with `new WebSocket(url, { headers })`, and wraps it with `WebSocketTransport.fromSocket`.
  The GET that reads a refusal sends the same headers.
- `@microsoft/dev-tunnels-management` and `@microsoft/dev-tunnels-contracts` become dependencies of ahpc.
  ahpc loads them only when a tunnel needs a sign-in.
- The relay is not built.
  It can come later behind the same `tunnel:` address.

## Open points

These are facts that nobody has checked yet.

- No run against a real tunnel: anonymous, signed-in, ahpd's port `31546` over web forwarding, and VS Code's own tunnel.
- The public URL needs the cluster, and an anonymous visitor has no sign-in to look it up.
  The address may need the form `tunnel:<id>.<cluster>`, if the `devtunnel` CLI writes ids that way.
- Whether `getTunnel` answers an anonymous client on a tunnel with anonymous access.
