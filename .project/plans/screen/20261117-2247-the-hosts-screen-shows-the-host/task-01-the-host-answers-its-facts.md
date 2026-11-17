---
title: The host connection answers the host's facts
status: todo
depends: []
layer: "ahp"
refs:
  - "[code://src/ahp/live.ts#L1776-L1783](../../../../src/ahp/live.ts#L1776-L1783) - the `initialize` answer, kept in `hello`"
  - "[code://src/ahp/live.ts#L303-L307](../../../../src/ahp/live.ts#L303-L307) - `Mirror`, whose `root` holds the root state"
  - "[code://src/ahp/live.ts#L1648](../../../../src/ahp/live.ts#L1648) - `clientId`"
  - "[code://src/ahp/channels.ts#L73-L75](../../../../src/ahp/channels.ts#L73-L75) - `held()` and `seq()`"
  - "[code://src/ahp/connection.ts#L41](../../../../src/ahp/connection.ts#L41) - `HostConnection`"
  - "[code://src/ahp/fake.ts#L236](../../../../src/ahp/fake.ts#L236) - `fakeHost`"
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/bridges/host-about.ts - how the root `_meta` keys are read, `cpuCount` among them
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/bridges/ahpd-meta.ts - `ahpd.principal`, the signed-in account on ahpd
---

## Objective

`HostConnection.about()` answers the facts a host sent about itself, from both the live host and the scripted one.
A fact the host did not send is absent from the answer.

## Files

- `UPDATE: src/ahp/types.ts` - `HostAbout`: the connection, the server, the build, the machine, the settings pages, the active sessions and the trusted folders.
- `UPDATE: src/ahp/connection.ts:41` - `about(): Promise<HostAbout>` on `HostConnection`.
- `UPDATE: src/ahp/live.ts:303-307` - `Mirror.root` names `_meta`, `activeSessions` and `config`.
- `UPDATE: src/ahp/live.ts:1776-1783` - keep the protocol version, `defaultDirectory`, `serverInfo`, the `initialize` `_meta` and the time of the connection.
- `UPDATE: src/ahp/live.ts` - `about()`, read from the kept answer, `mirror.root` and the channel registry.
- `UPDATE: src/ahp/fake.ts:236` - `about()` with scripted facts for every section.
- `UPDATE: test/live.test.tsx` - `about()` from a scripted `initialize` and root snapshot.
- `UPDATE: test/fake.test.ts` - `about()` from the scripted host.

## Steps

1. In `src/ahp/types.ts`, add `HostAbout`, with every field optional except `clientId`, `channels`, `serverSeq` and `settings`.
2. Add `about(): Promise<HostAbout>` to `HostConnection`.
3. In `liveHost`, keep `protocolVersion`, `defaultDirectory`, `serverInfo` and `_meta` from each `initialize` answer, and the time it came.
4. Keep them again after each reconnect, from the new answer.
5. Read the client id, `channels.held().length` and `channels.seq()` on each call.
6. Read `activeSessions` and the root `_meta` from `mirror.root`, so root actions keep them current.
7. Read `hostBuild` as the build: `version`, `commit` and `date`.
8. Read `vscode.agentHost.resources` as the machine: `platform`, `architecture`, `cpuCount` and `memoryBytes`.
9. Read `vscode.agentCustomizationSettings` as the settings pages: `provider`, `title`, `description` and each setting's `key`.
10. Read `config.values.workspaceTrust.trustedUris` from the root state as the trusted folders.
11. Read `ahpd.principal` from the `initialize` `_meta` as the signed-in account.
12. Leave out each field the host did not send, or sent with the wrong type.
13. In `fakeHost`, answer `about()` with a value for every field, so each section draws.
14. Test both hosts, and a live host whose answer leaves out the build and the machine.

## Validation

- `test/live.test.tsx`: `about()` answers the scripted values, and leaves out what the scripted host did not send.
- `test/fake.test.ts`: `about()` answers every field.
- `npx vitest run test/live.test.tsx test/fake.test.ts` and `npm run typecheck` pass.

## Resume
