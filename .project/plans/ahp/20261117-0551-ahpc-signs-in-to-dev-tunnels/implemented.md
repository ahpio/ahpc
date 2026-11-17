---
title: ahpc signs in to Dev Tunnels and reaches a private tunnel - implemented
date: 2026-11-17
refs:
  - git://c4c7967
  - "[code://src/ahp/devtunnels.ts](../../../../src/ahp/devtunnels.ts)"
  - "[code://src/connect.ts](../../../../src/connect.ts)"
  - "[code://test/devtunnels.test.ts](../../../../test/devtunnels.test.ts)"
  - "[code://src/ahp/gateway.ts](../../../../src/ahp/gateway.ts)"
  - "[code://src/exit.ts](../../../../src/exit.ts)"
---

`ahpc tunnel login` signs in to Dev Tunnels by a device code, and `ahpc tunnel list` shows the account's tunnels with an agent host.
Signed in, `--host tunnel:<id>` reaches a private tunnel, with a fresh connect token on each attempt.
`--tunnel-access` or `tunnelAccess` picks the way in, and `auto` signs in when an anonymous open meets a sign-in page.
A VS Code tunnel at `protocolv6` is reached through its gateway, and `--tunnel-host` or `tunnelHost` picks the agent host.

## What was built

- [`code://src/ahp/devtunnels.ts`](../../../../src/ahp/devtunnels.ts) - the device sign-in, `tunnel.json`, the refresh, `management()` over `fetch`, `hostTunnels`, `openSignedIn` and `NeedsPerson`.
- [`code://src/ahp/tunnel.ts`](../../../../src/ahp/tunnel.ts) - `deriveConnectionToken`, `TunnelAccess` and `wayIn`.
- [`code://src/config.ts`](../../../../src/config.ts) - `writePrivate`, `Config.tunnelAccess` and `tunnelAccessOf`.
- [`code://src/connect.ts`](../../../../src/connect.ts) - `Where.tunnelAccess`; `routeOf`, the anonymous or signed-in route; the `auto` fallback.
- [`code://src/cli/main.ts`](../../../../src/cli/main.ts), [`code://src/tui.tsx`](../../../../src/tui.tsx) and [`code://src/flags.ts`](../../../../src/flags.ts) - `tunnel login`, `logout` and `list`, `--tunnel-access`, and the *Tunnels* group of the usage text.
- [`code://docs/start/CONNECT.md`](../../../../docs/start/CONNECT.md) and [`code://docs/reference/CONFIG-FILE.md`](../../../../docs/reference/CONFIG-FILE.md) - *Signed in*, and the `tunnelAccess` row.
- [`code://test/devtunnels.test.ts`](../../../../test/devtunnels.test.ts) - 10 tests: the device flow, the file and its mode, the refresh, the list, the two GETs and the signed-in open.
- [`code://test/tunnel.test.ts`](../../../../test/tunnel.test.ts) - 3 more tests: the derived token, `wayIn`, and the derived token on the signed-in way only.
- [`code://src/ahp/gateway.ts`](../../../../src/ahp/gateway.ts) - the gateway of a VS Code tunnel at protocol 6: the inventory, the pick and the handshake.
- [`code://src/ahp/live.ts`](../../../../src/ahp/live.ts) - a handshake on the open socket, and a `close` that waits at most 2 seconds.
- [`code://src/exit.ts`](../../../../src/exit.ts) and [`code://src/main.tsx`](../../../../src/main.tsx) - the exit of a run that a socket left closing would hold open.
- [`code://src/ahp/refused.ts`](../../../../src/ahp/refused.ts) - a short body with no type or `text/plain` goes in the sentence.
- [`code://test/gateway.test.ts`](../../../../test/gateway.test.ts) - 9 tests: the pick, the inventory and the handshake. `test/devtunnels.test.ts` and `test/refused.test.ts` gain 1 and 2.

## Verified

- `npx vitest run test/devtunnels.test.ts test/tunnel.test.ts` passes 25 tests.
- `npm run typecheck`, `npm run build` and `npm run docs:build` pass, and `npm test` passes 53 files, 965 tests.
- Softov signed in and listed his tunnels: ahpd's at `protocolv5`, and VS Code's on his desktop at `protocolv6`, bound to the editor.
- VS Code's tunnel answered the root route with 503: `This tunnel serves a specific agent host; upgrade required`.
- Through the gateway, `session list` and a still against that tunnel printed the editor's sessions over AHP 1.1.0, and exited 0 in about 4.5 seconds.
- The gateway never answered the close frame: a bare socket stayed `CLOSING` after 25 seconds.
- `deriveConnectionToken` gives the values of ahpd's built `discovery.js` for `l3rs99qw`, `abc`, `x` and `t176`, which starts with `-`.
- `curl` with no token: the list URL answered 401, and the URL of a tunnel that does not exist answered 404.
- By hand: `tunnel login` printed a GitHub device code; `tunnel list` and `--host tunnel:<id>` with no sign-in printed their sentences and exited 1.
- By hand: `--tunnel-access bogus` printed `Tunnel access is auto, anonymous or signed-in, not bogus.` and exited 1.
- Not run: a signed-in connection to ahpd's tunnel, a reconnect, and `tunnelHost` on a tunnel not bound to one. The checks wait in [ahpc-signs-in-to-dev-tunnels.md](../../../pending/ahpc-signs-in-to-dev-tunnels.md).

## Departures from the plan

- No Dev Tunnels package. `@microsoft/dev-tunnels-management` loads `@microsoft/dev-tunnels-ssh`, which it does not declare.
  Softov chose `fetch` on 2026-11-17, and `management()` sends the same two GETs with `api-version=2023-09-27-preview`.
- `writePrivate` makes its folder with mode `0700` as well.
- `tunnel list` prints the address as `tunnel:<id>.<cluster>`, which `--host` takes as it is.
- A refusal only the person can fix is a `NeedsPerson` error. A signed-in opener turns it into `StopRetrying`, so the loop ends.
- The `auto` fallback runs in `connect`, which ends the process on a failure, so no unit test drives it. The check by hand does.
- Task 05 was added after the check on Softov's desktop: the plan reached only tunnels below protocol 6.
- `exitIfHeld` has no unit test, because it ends the process. The real runs against the VS Code tunnel cover it.

## Left for later

- [The servers plan](../../cli/20261117-0752-ahpc-keeps-named-servers/plan.md) builds on `routeOf`.
