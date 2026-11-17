---
title: A connect token rides on the socket
status: todo
depends:
  - task-01-a-tunnel-address-opens-its-port-url.md
layer: "ahp"
refs:
  - "[code://src/ahp/live.ts#L543-L556](../../../../src/ahp/live.ts#L543-L556) - `load()` and its `connect(url)`, which sends no headers"
  - "[code://src/ahp/live.ts#L1543-L1557](../../../../src/ahp/live.ts#L1543-L1557) - `liveHost`'s endpoint and `openTransport`"
  - "[code://src/ahp/refused.ts#L20-L40](../../../../src/ahp/refused.ts#L20-L40) - `whyNoConnection`'s GET, which gets the same headers"
  - "[code://src/cli/main.ts#L261-L278](../../../../src/cli/main.ts#L261-L278) - `where`, which reads the token flags"
  - "[code://src/tui.tsx#L237-L240](../../../../src/tui.tsx#L237-L240) - the screen's flag parse"
  - "[code://src/tui.tsx#L440-L455](../../../../src/tui.tsx#L440-L455) - the screen reads the token the same way"
  - npm://@microsoft/agent-host-protocol@1.1.0 - `ws`: `WebSocketTransport.fromSocket(socket)`
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/tunnel/discovery.ts - `buildTunnelHeaders`
---

## Objective

`--tunnel-token <token>` or `AHPC_TUNNEL_TOKEN` puts `X-Tunnel-Authorization: tunnel <token>` and `X-Tunnel-Skip-AntiPhishing-Page: true` on the upgrade.
The GET that reads a refusal sends the same two headers.
A socket with no connect token is opened as it is today.

## Files

- `UPDATE: src/ahp/tunnel.ts` - `tunnelHeaders(token)`, the two headers.
- `UPDATE: src/ahp/live.ts:543-556` - `Loaded` gains `fromSocket`, and `load()` reads it from the `ws` entry point.
- `UPDATE: src/ahp/live.ts:1543-1557` - `LiveHostOptions.headers`; with headers, the opener is `new WebSocket(endpoint, { headers })` wrapped by `fromSocket`.
- `UPDATE: src/ahp/refused.ts:20-40` - `whyNoConnection` takes headers and sends them on its GET.
- `UPDATE: src/connect.ts` - `Where.tunnelToken`; `connect` passes `tunnelHeaders` to `liveHost` and to `whyNoConnection`.
- `UPDATE: src/cli/main.ts:261-278` - `where` reads `--tunnel-token`, then `AHPC_TUNNEL_TOKEN`.
- `UPDATE: src/tui.tsx:237-240` - the screen reads `--tunnel-token`, then `AHPC_TUNNEL_TOKEN`.
- `UPDATE: src/cli/main.ts:175-178` - the usage text names `--tunnel-token`.
- `UPDATE: test/tunnel.test.ts` - the headers on the upgrade and on the GET, against a local server.

## Steps

1. In `src/ahp/tunnel.ts`, export `tunnelHeaders(token)`, which returns the two headers.
2. In `load()`, read `WebSocketTransport.fromSocket` and return it as `fromSocket` in `Loaded`.
3. Add `headers?: Record<string, string>` to `LiveHostOptions`.
4. In `liveHost`, when `options.headers` has entries, open `new WebSocket(endpoint, { headers })`, wait for `open`, and pass it to `fromSocket`.
5. Reject that open with the socket's `error` event, so a failed open reaches the same path as today.
6. Without headers, keep `ahp.connect(endpoint)`.
7. Give `whyNoConnection` a third parameter, `headers`, and send them on its `fetch`.
8. Add `tunnelToken?: string` to `Where`.
9. In `connect`, for a tunnel host with `options.tunnelToken`, pass `tunnelHeaders(options.tunnelToken)` to `liveHost` and to both `whyNoConnection` calls.
10. In `where`, set `tunnelToken` from `--tunnel-token`, else from `AHPC_TUNNEL_TOKEN`.
11. In the screen's parse, read `--tunnel-token` into the options, and fall back to `AHPC_TUNNEL_TOKEN`.
12. Add `--tunnel-token <t>` to the usage text, after `--connection-token-file`.
13. In `test/tunnel.test.ts`, start an `http` server whose `upgrade` handler records the headers, as the 2026-11-17 check did.
14. Assert that a `liveHost` with headers sends both headers on the upgrade.
15. Assert that `whyNoConnection` with headers sends both headers on its GET.

## Validation

- `npx vitest run test/tunnel.test.ts test/refused.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- `rg -n "tunnel-token|AHPC_TUNNEL_TOKEN" src` finds `where`, the screen's parse and the usage text.

## Resume
