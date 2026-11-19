---
title: Initialize names ahpc
status: todo
depends: []
layer: "ahp"
refs:
  - "[code://src/ahp/live.ts#L1649](../../../../src/ahp/live.ts#L1649) - the client id"
  - "[code://src/ahp/live.ts#L1777-L1783](../../../../src/ahp/live.ts#L1777-L1783) - the first `initialize`"
  - "[code://src/ahp/live.ts#L2074-L2079](../../../../src/ahp/live.ts#L2074-L2079) - the fallback `initialize`"
  - "[code://src/version.ts#L43](../../../../src/version.ts#L43) - `version()`"
---

## Objective

Each `initialize` ahpc sends carries `clientInfo: { name: 'ahpc', title: 'ahpc', version }` and its `locale`.
A new client id is `ahpc-` and a whole UUID.

## Files

- `UPDATE: src/ahp/live.ts:1649` - the id is `ahpc-${randomUUID()}`.
- `UPDATE: src/ahp/live.ts:1777-1783` - the first `initialize` goes through `hello()`.
- `UPDATE: src/ahp/live.ts:2074-2079` - the fallback `initialize` goes through `hello()`.
- `CREATE: test/client-info.test.ts` - the `initialize` a scripted host receives, and the id.

## Steps

1. Add `CLIENT_INFO`, `{ name: 'ahpc', title: 'ahpc', version: version() }`, beside `VERSIONS` in `live.ts`.
2. Add `hello(client, subscriptions)`, which sends `client.request('initialize', ...)` with `channel`, `clientId`, `protocolVersions`, `clientInfo`, `initialSubscriptions` and `locale`.
3. Replace the first `client.initialize` with `hello(client, [ROOT])`.
4. Replace the fallback `fresh.initialize` with `hello(fresh, held)`.
5. Make the default id `ahpc-${randomUUID()}`.
6. Add the cases, with a scripted host as in `test/session-page.test.ts`.

## Validation

- Check these cases in `test/client-info.test.ts`:
  - The `initialize` that the scripted host gets has `clientInfo` with ahpc's version.
  - It has `locale` when ahpc has one.
  - A host made with no `clientId` gets `ahpc-` and a UUID.
- `pnpm typecheck` and `pnpm test` pass.
- On the test daemon, an ahpc row in ahpw's Clients list reads "ahpc" with its version.

## Resume

