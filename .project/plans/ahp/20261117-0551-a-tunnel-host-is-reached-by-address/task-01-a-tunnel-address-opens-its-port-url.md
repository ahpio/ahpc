---
title: A tunnel address opens its port URL
status: todo
depends: []
layer: "ahp"
refs:
  - "[code://src/connect.ts#L102-L140](../../../../src/connect.ts#L102-L140) - `connect(Where)`, where the host string is handed to `liveHost`"
  - "[code://src/ahp/refused.ts#L45-L60](../../../../src/ahp/refused.ts#L45-L60) - `address`, the pattern for turning one URL into another"
  - "[code://test/refused.test.ts](../../../../test/refused.test.ts) - the test file whose shape the new one copies"
  - https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/cli-commands - the port URL `https://<id>-<port>.<cluster>.devtunnels.ms/`
---

## Objective

`--host tunnel:<id>.<cluster>` connects to `wss://<id>-31546.<cluster>.devtunnels.ms` with the person's own token in `?tkn=`.
A tunnel address with no token of the person's own, or with no cluster, stops before any socket opens, with one sentence.

## Files

- `CREATE: src/ahp/tunnel.ts` - `TUNNEL_PORT`, `tunnelOf(host)`, `portUrl(tunnel)` and the sentences for a tunnel address that cannot be opened.
- `UPDATE: src/connect.ts:102-140` - `connect` turns a `tunnel:` host into its port URL before it calls `liveHost`.
- `CREATE: test/tunnel.test.ts` - the address, the URL and the two refusals.

## Steps

1. In `src/ahp/tunnel.ts`, export `TUNNEL_PORT = 31546`, with a comment naming VS Code's `TUNNEL_AGENT_HOST_PORT`.
2. Export `tunnelOf(host)`, which returns `{ id, cluster? }` for a host that starts with `tunnel:`, and `undefined` otherwise.
3. Split the text after `tunnel:` at its last `.`, into the id and the cluster.
4. Export `portUrl(tunnel)`, which returns `wss://<id>-31546.<cluster>.devtunnels.ms`.
5. Export `noCluster(host)`, the sentence: "Name the tunnel as tunnel:<id>.<cluster> to reach it without a sign-in."
6. Export `noOwnToken(host)`, the sentence: "A tunnel needs a token of your own for the host. Pass --token or --connection-token-file."
7. In `connect`, call `tunnelOf(options.host)` before `liveHost`.
8. For a tunnel with no cluster, write `noCluster` to stderr and exit 1.
9. For a tunnel with no `options.token`, write `noOwnToken` to stderr and exit 1.
10. Otherwise, pass `portUrl(tunnel)` as `url` to `liveHost`, and keep `options.host` for every sentence the person reads.
11. In `test/tunnel.test.ts`, test `tunnelOf` on `tunnel:l3rs99qw.usw2`, on `tunnel:l3rs99qw`, and on `ws://127.0.0.1:9187`.
12. Test that `portUrl` of `{ id: 'l3rs99qw', cluster: 'usw2' }` is `wss://l3rs99qw-31546.usw2.devtunnels.ms`.

## Validation

- `npx vitest run test/tunnel.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- By hand: `ahpc --host tunnel:l3rs99qw session list` prints the `noCluster` sentence and exits 1.
- By hand: `ahpc --host tunnel:l3rs99qw.usw2 session list` with no token prints the `noOwnToken` sentence and exits 1.

## Resume
