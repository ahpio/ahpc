---
title: ahpc keeps named servers
created: 2026-11-17
refs:
  - git://6683358 - the commit of ahpc the facts were checked at
  - "[code://src/config.ts#L7-L22](../../src/config.ts#L7-L22) - the config file holds one `host`, one `token` and one `connectionTokenFile`"
  - "[code://src/config.ts#L92-L100](../../src/config.ts#L92-L100) - `statePath`: a file that ahpc writes goes beside the hand-written `config.json`"
  - "[code://src/config.ts#L160-L175](../../src/config.ts#L160-L175) - `connectionToken`, the order the host's token is read in"
  - "[code://src/cli/main.ts#L264](../../src/cli/main.ts#L264) - a command reads `--host`, `AHPC_HOST` and the config file"
  - "[code://src/tui.tsx#L441](../../src/tui.tsx#L441) - the screen reads `AHPC_HOST` and the config file a second time"
  - npm://@microsoft/agent-host-protocol@1.1.0 - `hosts`: `MultiHostClient` and `HostConfig`, for several host connections at once; ahpc does not use it
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/config/connections.ts - ahpx's connection profiles and their store
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/fleet/health.ts - what ahpx's health check reads from a host
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/bin.ts#L520-L790 - the `server` commands and their options
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/remoteAgentHostService.ts - VS Code `1564f100807a`: `chat.remoteAgentHosts` entries and their kinds
  - https://github.com/ahpio/ahpapp/blob/267ceb3/src/host-rows.ts#L56-L64 - ahpapp's saved host
  - https://github.com/ahpio/ahpapp/blob/267ceb3/src/storage.ts#L1-L26 - ahpapp keeps a host's address and its token in two stores
---

# ahpc keeps named servers

Softov wants ahpc to keep named connections to AHP hosts, as ahpx's `server` commands do.
A person then picks a host by its name, and does not type its address and token on each command.
A saved server can name a host behind a Dev Tunnel.
On 2026-11-17 Softov gave the commands: `server add`, `list`, `remove`, `test`, `status` and `health`.

## What others do

- **ahpx.**
  - `server add <name>` takes `--url <url>` or `--tunnel <tunnel-id>` with `--tunnel-cluster <cluster>`, and never both.
  - `server add` also takes `--token <token>`, `--default`, and `--tag <tag>`, which repeats.
  - `server list` and `server remove <name>` list and remove the saved servers.
  - `server test <target>` connects to a saved server or a URL.
  - `server status` checks every saved server, and `server health <name>` checks one in detail.
  - A health check connects, sends `initialize`, reads the root state and disconnects.
    It reports `healthy`, `degraded` or `unreachable`, the time it took, the protocol version, the agents with their models, and the active sessions.
  - A command picks a server with `--server <name or url>`, or uses the default.
    With neither, it stops and names `server add <name> --url <ws://...> --default`.
  - The servers are in `~/.ahpx/connections.json`, written to a temporary file and renamed, with mode `0600` in a folder with mode `0700`.
    The token is in the same file as the address.
- **VS Code.**
  The setting `chat.remoteAgentHosts` is a list of entries with an `address`, a `name` and an optional `connectionToken`.
  An entry has a kind: WebSocket, SSH, WSL, tunnel, cloud sandbox or dev container.
  VS Code keeps SSH entries in its own storage, not in the setting.
- **ahpapp.**
  A saved host has an `id`, a `name`, a `url`, a `container` and a `disabled` flag.
  Its connection token is in the Keychain, apart from the address, which is in ordinary storage.

The idea [finding a host without being told](../ideas/finding-a-host-without-being-told.md) covers hosts on this machine, found through VS Code's endpoint registry.
This brief covers hosts a person names and saves.

## What ahpc has today

- The config file holds one `host`, one `token` and one `connectionTokenFile`.
- `config.json` is hand-written, and a file that ahpc writes goes beside it through `statePath`.
- The host's token is read from `--token`, `--connection-token-file`, `AHPC_TOKEN` and the config file, in that order.
- Two places read the host: a command at `src/cli/main.ts:264`, and the screen at `src/tui.tsx:441`.
- The protocol package has `MultiHostClient` for several connections at once.
  ahpc keeps one connection, and does not use it.

## Who writes

- ahpc: no pull request is open, and no unmerged branch touches `src/config.ts`, `src/cli/main.ts` or `src/tui.tsx`.
- [ahpc connects through a Dev Tunnel](ahpc-connects-through-a-private-dev-tunnel.md) changes the same two places that read the host.
  That brief is built first, and a saved server can then hold a `tunnel:` address.

## The change

- `ahpc server add <name> --url <url>` saves a named server.
  It takes `--token <token>`, `--default`, `--tag <tag>`, which repeats, and `--tunnel <tunnel-id>`.
- `ahpc server list` lists the saved servers.
- `ahpc server remove <name>` removes one.
- `ahpc server test <target>` tests the connection to a saved server.
- `ahpc server status` checks the health of every saved server.
- `ahpc server health <name>` checks one server in detail.
- ahpc writes the saved servers to a state file beside `config.json`, not into `config.json`.
- The state file has mode `0600`, and holds each server's token with its address, as in ahpx.
  `server add` also takes `--connection-token-file <path>`, to save a path in place of the token.
- `--host`, `AHPC_HOST` and the config file's `host` take a saved server's name, as well as a URL or a `tunnel:` address.
  A value with no `ws://`, `wss://` or `tunnel:` prefix is a name.
  A name that matches no saved server is refused.
- The host is read in this order: `--host`, `AHPC_HOST`, the config file's `host`, then the default server.
  A value written by hand wins over one that a command saved.
