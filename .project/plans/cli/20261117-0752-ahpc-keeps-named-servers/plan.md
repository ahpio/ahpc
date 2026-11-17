---
title: ahpc keeps named servers
domain: cli
status: draft
priority: medium
created: 2026-11-17
revalidated: 2026-11-17
requires:
  - plans/ahp/20261117-0551-a-tunnel-host-is-reached-by-address/plan.md
  - plans/ahp/20261117-0551-ahpc-signs-in-to-dev-tunnels/plan.md
changes: []
creates: []
decisions: []
refs:
  - git://dd15f5a - the last commit that holds the brief `briefs/ahpc-keeps-named-servers.md`, which this plan covers
  - "[code://src/config.ts#L8-L22](../../../../src/config.ts#L8-L22) - the config file holds one `host`, one `token` and one `connectionTokenFile`"
  - "[code://src/config.ts#L100-L101](../../../../src/config.ts#L100-L101) - `statePath`: a file that ahpc writes goes beside the hand-written `config.json`"
  - "[code://src/config.ts#L159-L175](../../../../src/config.ts#L159-L175) - `connectionToken`, the token order both front ends share; the host order is shared the same way"
  - "[code://src/cli/main.ts#L261-L278](../../../../src/cli/main.ts#L261-L278) - `where`: a command reads `--host`, `AHPC_HOST` and the config file"
  - "[code://src/tui.tsx#L441](../../../../src/tui.tsx#L441) - the screen reads `AHPC_HOST` and the config file a second time"
  - "[code://src/cli/main.ts#L465-L475](../../../../src/cli/main.ts#L465-L475) - `config`, a command answered before any connection, which `server` copies"
  - "[code://src/connect.ts#L102](../../../../src/connect.ts#L102) - `connect` ends the process when the first connection fails, so a health check cannot call it"
  - "[code://src/ahp/live.ts#L1688-L1696](../../../../src/ahp/live.ts#L1688-L1696) - `initialize`, whose answer names the protocol version and is not kept"
  - "[code://src/flags.ts#L26-L33](../../../../src/flags.ts#L26-L33) - `COMMANDS` and `SWITCHES`, the words the command line is made of"
  - "[code://test/scenario.ts](../../../../test/scenario.ts) - a scripted host behind `liveHost`, for the health tests"
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/config/connections.ts - ahpx's server store, which this plan copies
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/fleet/health.ts - ahpx's health check and its three states
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/bin.ts#L520-L790 - ahpx's `server` commands and their output
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/remoteAgentHostService.ts - VS Code `chat.remoteAgentHosts` entries name the host `address`
---

## Goal

A person saves an AHP host under a name, and then picks it by that name.
The person does not type the address and the token on each command.
A saved server can be a `ws://` or `wss://` URL, or a `tunnel:` address.
`ahpc server` saves, lists, removes and checks the servers, and one server is the default.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "statePath\(" src` - only `src/update.ts:28` writes a state file, with no mode.
- `rg -n "process.exit" src/connect.ts` - `connect` exits on a failed first connection, so a check of several servers needs a path that throws.
- `rg -n "hello\." src/ahp/live.ts` - only `hello.snapshots` is read; `protocolVersion` is dropped.
- `docs/reference/CLI.md` prints `ahpc help` through `reference.data`, so the usage text is the CLI page.
- ahpx at `056d44e72`: a corrupt `connections.json` is read as empty, and the next write replaces it.
- ahpx at `056d44e72`: `degraded` is a state in `ServerHealth`, and no code sets it.
- ahpx at `056d44e72`: a saved `token` goes to `authenticate` for each protected resource; ahpc's `--token` is the host's connection token.

### Runtime path

```
ahpc server add <name> --url <address> -> servers.ts add -> writePrivate(servers.json, 0600)
--host <name> | AHPC_HOST | config host | default server -> servers.ts chosenHost -> { host, token } -> connect(Where)
ahpc server status -> servers.ts list -> reach(Where) per server -> liveHost -> agents, sessions, version -> close -> one row each
```

### Gaps

- No file holds more than one host, and no name stands for a host.
- `connect` cannot report a failure without ending the process.
- `liveHost` does not keep the protocol version that `initialize` answered.
- `Not found: server, servers.json - searched rg -n "servers\.json|'server'" src test docs`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The commands are `server add`, `list`, `remove`, `test`, `status` and `health` | Softov, 2026-11-17: "ahpc server add <name> --url <url> ... server list ... server remove <name> ... server test <target> ... server status ... server health <name>" | 01, 03 |
| `server add` takes `--token`, `--default`, `--tag`, which repeats, and `--tunnel <tunnel-id>` | Softov, 2026-11-17: "server add options: --token <token>, --default, --tag <tag> (repeatable), --tunnel <tunnel-id>" | 01 |
| Servers are a brief of their own, after the tunnel plans | Softov, 2026-11-17: "Own brief" | - |
| `--host`, `AHPC_HOST` and the config file's `host` take a saved server's name | Softov, 2026-11-17: "--host takes a name" | 02 |
| The servers and their tokens are in one state file with mode `0600` | Softov, 2026-11-17: "Same file, mode 0600" | 01 |
| The host order is `--host`, `AHPC_HOST`, the config file's `host`, then the default server | Softov, 2026-11-17: "Config host wins" | 02 |
| A tag filters `server list --tag` and `server status --tag` | Softov, 2026-11-17: "Filter list and status" | 01, 03 |
| `server status` prints every saved server, and one that does not answer is `unreachable` with the reason | Softov, 2026-11-17: "Every server" | 03 |
| `degraded` means the host answered and lists no agent | Softov, 2026-11-17: "Answers with no agent" | 03 |
| `server default <name>` makes a saved server the default | Softov, 2026-11-17: "server default <name>" | 01 |
| The file is `servers.json` beside `config.json`, through `statePath` | (defaulted: as `update.json` and `tunnel.json` are) | 01 |
| A server is `{ name, address, token?, tokenFile?, default?, tags? }` | (defaulted: `address` is VS Code's key, and a value can be a `tunnel:` address that is not a URL) | 01 |
| `servers.json` is written by `writePrivate`, which the sign-in plan adds to `src/config.ts` | (defaulted: the sign-in plan's task 01 writes `tunnel.json` with it; one writer for both files) | 01 |
| A `servers.json` that cannot be read stops the command with a sentence, and is never written over | (defaulted: as `loadConfig` does; ahpx reads a broken file as empty and the next write loses every server) | 01 |
| `--url` takes a `ws://`, `wss://` or `tunnel:` address; `--tunnel <id>` saves `tunnel:<id>`; both together, or neither, is refused | (defaulted: ahpx refuses both and neither; `tunnel:` is the address the tunnel plans read) | 01 |
| A name has no `:` and no `/`, so it never reads as an address; a name that exists is refused by `server add` | (defaulted: ahpx refuses a name that exists) | 01 |
| `server add` takes `--connection-token-file <path>`, saved as an absolute path; it and `--token` together are refused | (defaulted: the brief; `connectionToken` refuses the two together) | 01 |
| `--token` saves the host's connection token, as ahpc's `--token` means; not a sign-in token as in ahpx | (defaulted: one flag keeps one meaning in ahpc) | 01 |
| `server list` and `--json` never print a token; they say `saved`, `file` or `none` | (defaulted: a list is pasted into chats and logs) | 01 |
| `server remove` of the default says so and sets no new default | (defaulted: as ahpx) | 01 |
| A connect token and the tunnel access way are not saved; the flags, the variable and the config file apply | (defaulted: a connect token lasts 24 hours) | 01 |
| With a saved server, its token or file replaces the config file's token; `--token`, `--connection-token-file` and `AHPC_TOKEN` still win | (defaulted: the config file's token is never sent to a host it was not written for) | 02 |
| A name that matches no saved server stops with a sentence that names `ahpc server list` | (defaulted: the brief; ahpx says the same) | 02 |
| `server test <target>` takes a name, a URL or a `tunnel:` address, and says connected or why not | (defaulted: as ahpx, with ahpc's `whyNoConnection` sentence) | 03 |
| A check waits `--timeout <s>` seconds, 10 by default | (defaulted: ahpx waits 10 seconds; ahpc's `--timeout` is in seconds) | 03 |
| `server status` checks every server at the same time | (defaulted: as ahpx) | 03 |
| A check reports the state, the time it took, the protocol version, the agents with their models, and the session count | (defaulted: ahpx's `ServerHealth`; the count is what `ahpc status` prints) | 03 |
| `server test` and `server health` exit 1 when unreachable; `server status` exits 1 when any listed server is | (defaulted: a script can test the exit code) | 03 |
| The screen has no server picker in this plan; it takes a name through `--host` | (defaulted: not asked) | 02 |

## Proposed architecture

- **Data flow** - `src/servers.ts` reads and writes `servers.json`. `chosenHost` turns the host and token flags into a `Where` host and token, for both front ends.
- **Event flow** - none; each command reads the file, acts, and exits.
- **State flow** - `servers.json`, mode `0600`, beside `config.json`. `config.json` stays hand-written.
- **Layer responsibilities**
  - `src/servers.ts`: the store, the name rules and `chosenHost`.
  - `src/connect.ts`: `reach`, which opens a host and throws.
  - `src/cli/main.ts`: the `server` commands and their output.
  - `src/tui.tsx`: calls `chosenHost`.
- **Source-of-truth files** - `src/servers.ts`, created by task 01.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - Servers are saved by name](task-01-servers-are-saved-by-name.md) | todo | - |
| [02 - A host is picked by its name](task-02-a-host-is-picked-by-its-name.md) | todo | 01 |
| [03 - A server's health is checked](task-03-server-health-is-checked.md) | todo | 02 |
| [04 - The docs say how to save a server](task-04-the-docs-say-how-to-save-a-server.md) | todo | 03 |

## Risks and tradeoffs

- `servers.json` holds tokens - mode `0600`, and `connectionTokenFile` saves a path in place of a token.
- A name in the config file's `host` hides the default server - the order is Softov's answer, and `ahpc config` prints the `host` in force.
- A health check opens a full `liveHost` - it closes the host after one answer, and the timeout ends a host that never answers.
- `reach` moves code out of `connect`, which both tunnel plans change first - task 03 is built after them.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-servers-are-saved-by-name.md](task-01-servers-are-saved-by-name.md), after both tunnel plans are built.
- **Open questions:** none; every row in *Answers* is the user's or defaulted, and the user may erase a defaulted one.
- **Watch out for:** ahpx's `token` is a sign-in token; ahpc's is the host's connection token.

## Final verification checklist

- [ ] `ahpc server add home --url ws://127.0.0.1:9187 --token t --default` writes `servers.json` with mode `0600`.
- [ ] `ahpc server list` shows the server, the default and the tags, and no token.
- [ ] `ahpc --host home status` and `ahpc status` with no host reach the saved server.
- [ ] `ahpc server status` prints every server, with `healthy`, `degraded` or `unreachable`.
- [ ] `ahpc server default`, `remove`, `test` and `health` do what the usage text says.
- [ ] `npm run typecheck` and `npm test` pass.
- [ ] `docs/start/CONNECT.md`, `docs/reference/CONFIG-FILE.md`, `docs/reference/ENVIRONMENT.md` and the usage text describe saved servers.
