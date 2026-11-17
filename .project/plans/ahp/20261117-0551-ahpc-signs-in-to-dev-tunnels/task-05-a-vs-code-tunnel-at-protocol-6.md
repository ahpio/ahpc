---
title: A VS Code tunnel at protocol 6 is reached through its gateway
status: done
depends:
  - task-03-a-private-tunnel-is-reached-signed-in.md
layer: "ahp"
refs:
  - "[code://src/connect.ts#L273-L311](../../../../src/connect.ts#L273-L311) - `signedInRoute`, which opens the root route of the port today"
  - "[code://src/ahp/live.ts#L344-L386](../../../../src/ahp/live.ts#L344-L386) - `openWithHeaders` and `socketOpener`, where the handshake runs before the transport takes the socket"
  - "[code://src/ahp/refused.ts#L35-L70](../../../../src/ahp/refused.ts#L35-L70) - `whyNoConnection`, which drops the body that says why"
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHost.ts - VS Code `1564f100807a`: `TUNNEL_GATEWAY_SELECT_PATH`, `TUNNEL_GATEWAY_MIN_PROTOCOL_VERSION`, the inventory and the acknowledgement
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelGatewaySelection.ts - VS Code `1564f100807a`: `resolveGatewaySelection` and `selectGatewayFallbackAfterRejection`
  - https://github.com/microsoft/vscode/blob/1564f100807a/cli/src/tunnels/agent_host.rs - `serve_agent_host_tunnel_connection`: a delegated tunnel answers the root route with 503
  - https://github.com/ahpio/ahpd/blob/9e030f996/packages/tunnel-devtunnel/src/discovery.ts#L40-L55 - ahpd labels its tunnels `protocolv5`, because it serves no gateway
---

## Objective

`--host tunnel:<id>` reaches a VS Code tunnel labelled `protocolv6` or higher, through the gateway at `/agent-host/select`.
`tunnelHost` and `--tunnel-host` pick the agent host on a tunnel that is not bound to one.
A failed connection to a tunnel says the reason the host wrote in its answer.
A run ends after its work, also when the gateway never answers the close frame.

## Files

- `CREATE: src/ahp/gateway.ts` - the gateway path, the inventory, the pick, and the three-message handshake.
- `UPDATE: src/ahp/live.ts:344-386` - `openWithHeaders` and `socketOpener` run a handshake on the open socket.
- `UPDATE: src/ahp/live.ts` - `close` waits at most `CLOSE_WAIT_MS` for `client.shutdown`, and marks a socket left closing.
- `CREATE: src/exit.ts` - `socketHeld` and `exitIfHeld`, the exit for a run that a socket would hold open.
- `UPDATE: src/main.tsx` - the entry point calls `exitIfHeld` after a command and after a still.
- `UPDATE: src/ahp/devtunnels.ts` - `openSignedIn` answers the protocol from the tunnel's labels.
- `UPDATE: src/connect.ts:273-311` - `Where.tunnelHost`; the signed-in route opens the gateway from protocol 6.
- `UPDATE: src/ahp/refused.ts:35-70` - a short text body goes in the sentence.
- `UPDATE: src/config.ts` - `Config.tunnelHost` and `tunnelHostOf`.
- `UPDATE: src/cli/main.ts` - `where` reads `--tunnel-host`, and the usage text names it.
- `UPDATE: src/tui.tsx` - the screen reads `--tunnel-host`.
- `CREATE: test/gateway.test.ts` - the pick and the handshake.
- `UPDATE: test/devtunnels.test.ts` - `openSignedIn` answers the protocol.
- `UPDATE: test/refused.test.ts` - the body in the sentence.
- `UPDATE: docs/start/CONNECT.md` - a VS Code tunnel, and the `tunnelHost` table.
- `UPDATE: docs/reference/CONFIG-FILE.md` - the `tunnelHost` row.

## Steps

1. In `src/ahp/gateway.ts`, read the inventory: `endpoints`, each with `type` and `instanceId`, and `delegatedInstanceId`.
2. Pick the bound host when the inventory names `delegatedInstanceId`.
3. For `editor`, pick the first live editor host by `instanceId`, and fall back as `dedicated` does.
4. For `dedicated`, pick the first standalone host by `instanceId`, or ask for `newDedicated`.
5. Skip a host that the gateway refused on an earlier attempt.
6. Send the pick, read the acknowledgement, and throw `GatewayRefused` with the gateway's error when it is not `ok`.
7. Stop each read after 30 seconds, as VS Code's `TUNNEL_STEP_TIMEOUT_MS` does.
8. In `src/ahp/live.ts`, run the handshake on the open socket before the transport takes it.
9. In `openSignedIn`, answer the protocol of the tunnel's `protocolv` label.
10. In `signedInRoute`, open `/agent-host/select` from protocol 6, with the headers and no `?tkn=`.
11. Below protocol 6, keep the root route and its token.
12. Say the gateway's error as the reason when it refuses the pick.
13. In `whyNoConnection`, read a short `text/plain` body and put it in the sentence.
14. Add `tunnelHost?: 'editor' | 'dedicated'` to `Config` and to `Where`, `editor` by default, and refuse any other value with a sentence.
15. In `where` and the screen, read `--tunnel-host`, then the config's `tunnelHost`, then `editor`.
16. Add `--tunnel-host <editor|dedicated>` to the usage text.
17. In `close`, stop waiting for `client.shutdown` after 2 seconds, and mark the socket left closing.
18. In the entry point, flush both streams and end the process when `close` marked a socket.
19. Write the tests and the docs.

## Validation

- `npx vitest run test/gateway.test.ts test/devtunnels.test.ts test/refused.test.ts test/tunnel.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- `ahpc --host tunnel:<id> session list` against a VS Code tunnel at `protocolv6` prints the session list and exits.

## Resume

Done. `session list` and a still against the VS Code tunnel on Softov's desktop exit 0 in about 4.5 seconds.
