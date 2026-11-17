---
title: A server's health is checked
status: todo
depends:
  - task-02-a-host-is-picked-by-its-name.md
layer: "cli"
refs:
  - "[code://src/connect.ts#L102](../../../../src/connect.ts#L102) - `connect`, which exits on a failed first connection"
  - "[code://src/ahp/live.ts#L1541-L1543](../../../../src/ahp/live.ts#L1541-L1543) - `liveHost`'s return type, which gains the protocol version"
  - "[code://src/ahp/live.ts#L1688-L1696](../../../../src/ahp/live.ts#L1688-L1696) - `initialize` and its answer"
  - "[code://src/ahp/refused.ts](../../../../src/ahp/refused.ts) - `whyNoConnection`, the reason for an unreachable server"
  - "[code://src/cli/main.ts#L563-L585](../../../../src/cli/main.ts#L563-L585) - `status`, which counts the sessions"
  - "[code://test/scenario.ts](../../../../test/scenario.ts) - a scripted host behind `liveHost`"
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/fleet/health.ts - `ServerHealth` and `check`
---

## Objective

`ahpc server test <target>`, `server status` and `server health <name>` connect, read the host, and close.
Each server is `healthy`, `degraded` or `unreachable`.

## Files

- `UPDATE: src/connect.ts` - `reach(where)`, the opening part of `connect`, which throws in place of ending the process.
- `UPDATE: src/ahp/live.ts:1541-1696` - `liveHost` returns `protocolVersion`, from the answer to `initialize`.
- `UPDATE: src/servers.ts` - `checkServer(where, name, timeout)` and `interface Health`.
- `UPDATE: src/cli/main.ts` - `server test`, `status` and `health`, and their usage lines.
- `UPDATE: test/servers.test.ts` - the three states, the timeout, the tag filter and the exit codes.

## Steps

1. In `src/connect.ts`, move the part of `connect` that builds `liveHost`'s address, token and opener into `reach(where)`.
2. Make `reach` return the open host, and throw on a failed open.
3. Make `connect` call `reach`, and keep its sinks and its exit.
4. In `liveHost`, keep `hello.protocolVersion`, and return it as `protocolVersion`.
5. In `src/servers.ts`, export `interface Health { name; address; state; ms; protocolVersion?; agents; sessions; reason? }`.
6. Export `checkServer(where, name, timeout)`, which calls `reach` and starts a clock.
7. On an open host, read `agents()` and `listSessions()`, then `close()` the host.
8. Set `state` to `degraded` when the host lists no agent, and to `healthy` otherwise.
9. On a failed open, or after `timeout` seconds, set `state` to `unreachable`.
10. Set `reason` to the `whyNoConnection` sentence for that host.
11. In `server test <target>`, build a `Where` from a name, a URL or a `tunnel:` address, with the token flags.
12. Print the state, the address, the time and the protocol version, or the reason.
13. In `server status`, check every saved server with every `--tag` given, at the same time.
14. Print one row each: the name, the address, the state, the time, the sessions and the agents.
15. In `server health <name>`, print every field of `Health`, the tags, and each agent with its models.
16. Read `--timeout <s>`, with 10 seconds as the default.
17. Give `--json` the `Health` fields on all three commands.
18. Exit 1 from `test` and `health` when unreachable, and from `status` when any row is.
19. Add the three commands to the *Servers* group of the usage text.
20. In `test/servers.test.ts`, assert `healthy` for a scripted host with an agent.
21. Assert `degraded` for a scripted host with no agent.
22. Assert `unreachable` with a reason for a closed port.
23. Assert that a host that never answers is `unreachable` after the timeout.
24. Assert that `server status --tag` checks only the tagged servers, and that its exit code is 1 with one down.

## Validation

- `npx vitest run test/servers.test.ts test/reconnect.test.ts test/refused.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- After this task, write `.project/pending/ahpc-keeps-named-servers.md`.
  Put in it `server status` against a running ahpd, one stopped host, and a `tunnel:` server.

## Resume
