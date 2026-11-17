---
title: A private tunnel is reached signed in
status: todo
depends:
  - task-02-ahpc-tunnel-list-prints-the-host-tunnels.md
layer: "ahp"
refs:
  - "[code://src/connect.ts#L102-L194](../../../../src/connect.ts#L102-L194) - `connect`, where plan A turns a tunnel address into a URL and an opener"
  - "[code://src/config.ts#L7-L60](../../../../src/config.ts#L7-L60) - `Config`, which gains `tunnelAccess`"
  - "[code://src/cli/main.ts#L261-L278](../../../../src/cli/main.ts#L261-L278) - `where`, which reads `--tunnel-access`"
  - "[code://src/tui.tsx#L237-L240](../../../../src/tui.tsx#L237-L240) - the screen's flag parse"
  - npm://@microsoft/dev-tunnels-management@1.3.61 - `getTunnel` with `tokenScopes: ['connect']`, and `accessTokens.connect` on the answer
  - npm://@microsoft/dev-tunnels-contracts@1.3.61 - `TunnelEndpoint.getPortUri`
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/discovery.ts#L118-L150 - `deriveConnectionToken`
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/tunnel/discovery.ts - `getTunnelById`, `resolveTunnelUrl`
---

## Objective

`--host tunnel:<id>` connects through the sign-in, with a connect token fetched on each open.
`tunnelAccess` and `--tunnel-access` pick the way in, `auto` by default.
With no token of the person's own, the signed-in way sends the token VS Code derives from the tunnel id.

## Files

- `UPDATE: src/ahp/devtunnels.ts` - `openSignedIn(tunnel)`: the cluster, the connect token and the port URI.
- `UPDATE: src/ahp/tunnel.ts` - `deriveConnectionToken(id)`.
- `UPDATE: src/config.ts:7-60` - `Config.tunnelAccess`.
- `UPDATE: src/connect.ts:102-194` - `Where.tunnelAccess`, and the way in for a tunnel address.
- `UPDATE: src/cli/main.ts:261-278` - `where` reads `--tunnel-access`, then the config file.
- `UPDATE: src/tui.tsx:237-240` - the screen reads `--tunnel-access`, then the config file.
- `UPDATE: src/cli/main.ts:175-178` - the usage text names `--tunnel-access`.
- `UPDATE: test/tunnel.test.ts` - the derived token, and each way `auto` picks.

## Steps

1. In `src/ahp/tunnel.ts`, export `deriveConnectionToken(id)`, base64url of the SHA-256 of the id, unpadded, with a leading `-` prefixed by `a`.
2. Give it a test with the value ahpd's `discovery.ts` gives for the same id.
3. In `src/ahp/devtunnels.ts`, export `openSignedIn(tunnel)`, which takes the cluster from the address or from `listTunnels`.
4. Call `getTunnel` with `{ tunnelId, clusterId }`, `includePorts: true` and `tokenScopes: ['connect']`.
5. Return the URI of port `31546` from `getPortUri`, as `wss://`, and the headers of `accessTokens.connect`.
6. Add `tunnelAccess?: 'auto' | 'anonymous' | 'signed-in'` to `Config` and to `Where`, and refuse any other value with a sentence.
7. In `connect`, choose the way in for a tunnel address: `anonymous` and `signed-in` as named.
8. For `auto`, choose anonymous when the address has a cluster and the person has a token, and signed-in otherwise.
9. For `auto`, open signed-in when the tunnel refuses the anonymous open.
10. On the signed-in way, give `liveHost` an opener that calls `openSignedIn` on each attempt.
11. On the signed-in way with no token of the person's own, send `deriveConnectionToken(id)` as the token.
12. On the anonymous way, keep plan A's rule: no own token stops with its sentence.
13. With no sign-in on the signed-in way, stop with "The tunnel needs a sign-in. Run ahpc tunnel login."
14. In `where` and the screen, read `--tunnel-access`, then the config's `tunnelAccess`, then `auto`.
15. Add `--tunnel-access <auto|anonymous|signed-in>` to the usage text.
16. In `test/tunnel.test.ts`, stub `openSignedIn`, and assert the way `auto` picks for each mix of cluster, own token and refusal.
17. Assert that the signed-in way without an own token sends the derived token, and the anonymous way never does.

## Validation

- `npx vitest run test/tunnel.test.ts test/devtunnels.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- After this task, write `.project/pending/ahpc-signs-in-to-dev-tunnels.md`.
  Put in it the checks against ahpd's private tunnel, VS Code's own tunnel, and a reconnect.

## Resume
