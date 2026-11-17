---
title: A refused tunnel stops and says how
status: done
depends:
  - task-02-a-connect-token-rides-on-the-socket.md
layer: "ahp"
refs:
  - "[code://src/ahp/refused.ts#L20-L40](../../../../src/ahp/refused.ts#L20-L40) - `whyNoConnection` reads a status; a `fetch` follows a redirect by default"
  - "[code://src/ahp/live.ts#L1940-L1990](../../../../src/ahp/live.ts#L1940-L1990) - the reconnect loop, which retries until the host is back"
  - "[code://src/connect.ts#L140-L194](../../../../src/connect.ts#L140-L194) - `onRetryFailed`, `onState` and the first connection's failure"
  - "[code://test/refused.test.ts](../../../../test/refused.test.ts) - the sentences for a refused token and a host that is down"
---

## Objective

A tunnel that answers with a redirect to a sign-in, or with a 401, gets a sentence about the tunnel, not about the host.
With a connect token, that refusal ends the reconnect loop, and the sentence says how to get a new token.

## Files

- `UPDATE: src/ahp/tunnel.ts` - `tunnelRefused(host, hadToken)`, the two sentences.
- `UPDATE: src/ahp/refused.ts:20-40` - for a tunnel URL, the GET does not follow a redirect, and a 3xx or a 401 returns `tunnelRefused`.
- `UPDATE: src/ahp/live.ts:1940-1990` - `StopRetrying`, an error an opener throws to end the loop.
- `UPDATE: src/connect.ts:140-194` - a tunnel opener that throws `StopRetrying` when a connect token is refused.
- `UPDATE: test/tunnel.test.ts` - the two sentences, and the loop that ends.

## Steps

1. Export `tunnelRefused(host, hadToken)` from `src/ahp/tunnel.ts`.
2. Without a connect token, it says: "The tunnel at <host> needs a sign-in. Pass --tunnel-token with a token from devtunnel token <id> --scopes connect."
3. With one, it says: "The tunnel at <host> refused the connect token, which may have expired. Get a new one with devtunnel token <id> --scopes connect and set AHPC_TUNNEL_TOKEN."
4. In `whyNoConnection`, for a host on `devtunnels.ms`, call `fetch` with `redirect: 'manual'`.
5. Return `tunnelRefused` for a 3xx or a 401 from such a host.
6. In `src/ahp/live.ts`, export `class StopRetrying extends Error`.
7. In the reconnect loop, catch `StopRetrying` from `openTransport`, move to `offline`, pass its message to `options.onRefusal`, and return.
8. In `connect`, wrap the tunnel opener: on a failed open with a connect token, call `whyNoConnection`.
9. When that answer is the refused-token sentence, throw `StopRetrying` with it.
10. In `test/tunnel.test.ts`, answer a local GET with a 302, and assert the sentence without a connect token.
11. Answer it with a 401 and a connect token, and assert the refused-token sentence.
12. Give `liveHost` an opener that throws `StopRetrying` on its second call, then drop the socket.
13. Assert that the opener gets no third call.

## Validation

- `npx vitest run test/tunnel.test.ts test/refused.test.ts test/reconnect.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- After this task, write `.project/pending/a-tunnel-host-is-reached-by-address.md`.
  Put in it the checks for an anonymous tunnel, a private tunnel with a connect token, and an expired token.

## Resume
