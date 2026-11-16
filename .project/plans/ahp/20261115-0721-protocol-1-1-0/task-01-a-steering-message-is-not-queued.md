---
title: A steering message is not listed as queued
status: todo
depends: []
layer: "ahp"
refs:
  - "[code://src/ahp/live.ts#L1515-L1528](../../../../src/ahp/live.ts#L1515-L1528) - `queued()` and the comment above it"
  - "[code://src/ahp/live.ts#L3172-L3178](../../../../src/ahp/live.ts#L3172-L3178) - the comment on `steer`, which says a steering message has one slot on the chat"
  - "[code://test/reconnect.test.ts#L543-L565](../../../../test/reconnect.test.ts#L543-L565) - the queued-message test this task copies"
  - npm://@microsoft/agent-host-protocol@1.1.0 - `src/types/channels-chat/state.ts`, `queuedMessages` holds both kinds; `src/types/channels-chat/reducer.ts` reads an absent `kind` as `queued`
---

## Objective

`queued()` lists only the entries of `queuedMessages` whose `kind` is `queued` or absent.
A steering entry, which 1.1.0 keeps in the same list, is not shown as a queued message.
This also applies on the 1.0.0 package, because a VS Code host on 1.1.0 sends steering entries in a snapshot.

## Files

- `UPDATE: src/ahp/live.ts:1515-1528` - `queued()` skips an entry whose `kind` is `steering`; the comment says why.
- `UPDATE: src/ahp/live.ts:3172-3178` - the comment on `steer` says that the host keeps a steering message in `queuedMessages` since 1.1.0.
- `UPDATE: test/reconnect.test.ts:543-565` - a new test after this one, with a steering entry between two queued ones.

## Steps

1. In `queued()`, skip an entry when `str(found.kind)` is `steering`.
2. Add a sentence to the `queued()` comment: since 1.1.0 the list holds steering entries too.
3. In the `steer` comment, replace "One slot on the chat rather than a list".
   Say that 1.1.0 keeps a steering message in `queuedMessages` with `kind: 'steering'`, and that `queued()` leaves it out.
4. Copy the test at `test/reconnect.test.ts:543` into a new test, "lists a queued message and not a steering one".
5. Give its chat `queuedMessages` of `q1` with no `kind`, `s1` with `kind: 'steering'`, and `q2` with `kind: 'queued'`.
   The scripted host sends this state in the snapshot, as a VS Code host on 1.1.0 does.
6. Expect `first.queued` to hold `q1` and `q2` only, in that order.

## Validation

- `npx vitest run test/reconnect.test.ts` passes, with the new test.
- The new test fails without the filter in step 1, on the 1.0.0 package.
- `npm run typecheck` and `npm test` pass on the 1.0.0 package.

## Resume
