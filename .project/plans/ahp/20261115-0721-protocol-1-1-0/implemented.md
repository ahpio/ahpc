---
title: ahpc speaks protocol 1.1.0 - implemented
date: 2026-11-16
refs:
  - git://d1f2f63
  - "[code://src/ahp/live.ts](../../../../src/ahp/live.ts)"
  - "[code://test/reconnect.test.ts](../../../../test/reconnect.test.ts)"
---

ahpc installs protocol 1.1.0 and offers it first, with every older version behind it.
The queue leaves out a steering message, from a host on any version, so a pending steering message is not shown as queued.

## What was built

- [`code://src/ahp/live.ts`](../../../../src/ahp/live.ts) - `queued()` skips an entry with `kind: 'steering'`; `VERSIONS` starts with `1.1.0`; the module, `VERSIONS` and `steer` comments say 1.1.0.
- [`code://test/reconnect.test.ts`](../../../../test/reconnect.test.ts) - "lists a queued message and not a steering one", and the offered order starts with `1.1.0`.
- [`code://package.json`](../../../../package.json) - `@microsoft/agent-host-protocol` at `^1.1.0`, with `package-lock.json` and `deno.lock` at 1.1.0.
- [`code://tools/ahp.strict.schema.json`](../../../../tools/ahp.strict.schema.json) - regenerated from 1.1.0: 536 definitions from 535 exported types, 694 closed objects.
- [`code://README.md`](../../../../README.md), [`code://docs/CONFORMANCE.md`](../../../../docs/CONFORMANCE.md) and [00-ahp.md](../00-ahp.md) - they say 1.1.0.

## Verified

- With the filter removed, the new test fails on the 1.0.0 package. With the filter, `test/reconnect.test.ts` passes 84 tests.
- On 1.1.0, `npm run typecheck` and `npm run build` pass, and `npm test` passes 50 files, 928 tests.
- `rg -n 'agent-host-protocol@1\.0\.0|agent-host-protocol-1\.0\.0|AHP-1\.0\.0' package-lock.json deno.lock README.md` finds nothing.
- Not run: the check against a VS Code host on 1.1.0. It waits in [protocol-1-1-0-against-vs-code.md](../../../pending/protocol-1-1-0-against-vs-code.md).

## Departures from the plan

- `deno.lock` also gained the VitePress packages that `package.json` got in `a0b5726`, because the lock was stale before this plan. Softov chose the full regeneration on 2026-11-16.
- The `VERSIONS` comment no longer tells how `1.0.0` was offered, withdrawn and offered again. That history stays in `docs/CONFORMANCE.md`.
- `docs/CONFORMANCE.md` line 94 also changed, because it said `1.0.0` is offered first.

## Left for later

- Drawing what 1.1.0 adds, windowed delivery and the TCP channel, as *Answers* in [plan.md](plan.md) says.
