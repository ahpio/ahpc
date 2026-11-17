---
title: A host behind a Dev Tunnel is reached by its tunnel address - implemented
date: 2026-11-17
refs:
  - git://ec22166
  - "[code://src/ahp/tunnel.ts](../../../../src/ahp/tunnel.ts)"
  - "[code://src/connect.ts](../../../../src/connect.ts)"
  - "[code://test/tunnel.test.ts](../../../../test/tunnel.test.ts)"
---

`--host tunnel:<id>.<cluster>` reaches an AHP host behind a Dev Tunnel on port 31546, with the person's own token.
`--tunnel-token` or `AHPC_TUNNEL_TOKEN` carries a connect token for a private tunnel.
A refused connect token ends the reconnect loop, with a sentence that says how to get a new one.

## What was built

- [`code://src/ahp/tunnel.ts`](../../../../src/ahp/tunnel.ts) - `TUNNEL_PORT`, `tunnelOf`, `portUrl`, `tunnelHeaders`, and the sentences `noCluster`, `noOwnToken` and `tunnelRefused`.
- [`code://src/ahp/live.ts`](../../../../src/ahp/live.ts) - `LiveHostOptions.headers`; `socketOpener`, which opens a socket with headers through `fromSocket`; `StopRetrying`, which ends the reconnect loop.
- [`code://src/ahp/refused.ts`](../../../../src/ahp/refused.ts) - `whyNoConnection` takes a `ThroughTunnel`, sends its headers, does not follow a redirect, and names the tunnel address.
- [`code://src/connect.ts`](../../../../src/connect.ts) - `Where.tunnelToken`; `hostUrl`, the URL a host string opens; `stopsOnRefusal`, the tunnel opener.
- [`code://src/cli/main.ts`](../../../../src/cli/main.ts) and [`code://src/tui.tsx`](../../../../src/tui.tsx) - `--tunnel-token`, then `AHPC_TUNNEL_TOKEN`; the usage text names `tunnel:<id>.<cluster>` and `--tunnel-token`.
- [`code://docs/start/CONNECT.md`](../../../../docs/start/CONNECT.md) and [`code://docs/reference/ENVIRONMENT.md`](../../../../docs/reference/ENVIRONMENT.md) - *A host behind a Dev Tunnel*, and the `AHPC_TUNNEL_TOKEN` row.
- [`code://test/tunnel.test.ts`](../../../../test/tunnel.test.ts) - 12 tests: the address, the URL and the refusals.
  They also cover the headers on the upgrade and on the GET, the redirect sentences, and the loop that ends.

## Verified

- `npx vitest run test/tunnel.test.ts test/refused.test.ts test/reconnect.test.ts` passes 101 tests.
- `npm run typecheck`, `npm run build` and `npm run docs:build` pass, and `npm test` passes 51 files, 940 tests.
- By hand: `--host tunnel:l3rs99qw` prints the `noCluster` sentence and exits 1.
- By hand: `--host tunnel:l3rs99qw.usw2` with no token prints the `noOwnToken` sentence and exits 1.
- By hand: with a token, ahpc reached `l3rs99qw-31546.usw2.devtunnels.ms`, which answered 404 for a tunnel that does not exist.
- Not run: a real tunnel. The check waits in [a-tunnel-host-is-reached-by-address.md](../../../pending/a-tunnel-host-is-reached-by-address.md).

## Departures from the plan

- Only a redirect from a tunnel is a tunnel refusal. A 401 keeps the host's sentence, with the tunnel address in it. On an anonymous tunnel, a 401 is the host that refuses the person's own token.
  The tunnel sentence would send the person to the wrong fix.
- `whyNoConnection` takes a `ThroughTunnel` as its third parameter, not bare headers. The sentences need the tunnel address and the id as well.
- The opener is `socketOpener` in `src/ahp/live.ts`, which `liveHost` and `stopsOnRefusal` share. `connect` wraps it in place of building its own socket.
- A failed attempt with a connect token asks `whyNoConnection` twice: once in `stopsOnRefusal` and once in `onRetryFailed`.
- `StopRetrying` reaches the person through `onRefusal`, and on the first connection `connect` prints its message without a second GET.
- The `--host` line of the usage text names `tunnel:<id>.<cluster>`, in task 02 with `--tunnel-token`, not in task 04.

## Left for later

- What a tunnel answers an expired connect token with. If it is a 401, ahpc keeps retrying with the host's sentence; the check by hand finds out.
- A plain `tunnel:<id>`, signed in, is the [sign-in plan](../20261117-0551-ahpc-signs-in-to-dev-tunnels/plan.md).
