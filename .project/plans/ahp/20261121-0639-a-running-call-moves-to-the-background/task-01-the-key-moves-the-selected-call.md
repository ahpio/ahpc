---
title: The key moves the selected call
status: todo
---

## Goal

A key moves the selected running call with `ahpd.backgroundToolCall: true` to the background.

## Files

- `UPDATE: src/blocks.ts` - keep the call's `_meta` flag on its tool call block.
- `UPDATE: src/control.ts` or `src/ahp/connection.ts` - a `moveToBackground(chat, toolCallId)` that sends `x-ahpd/backgroundToolCall`.
- `UPDATE: src/app.tsx` - the key hint in the running view, beside `ctrl+c`.
- `CREATE: test/tool-move.test.ts` - the flag, the key, the request.

## Steps

1. Carry the flag on the block; a missing key reads false.
2. Add the request helper, answering `backgrounded`.
3. Bind the key to the selected block when it is movable and running; a not-movable block ignores the key.
4. On `backgrounded: true` or `false`, clear the block's movable flag so the hint goes.
5. Add the hint to the running view's key list.

## Validation

- `test/tool-move.test.ts` covers: the flag read, the key on a movable block, the key ignored on a plain block, the request's parameters.
- The test suite and the typecheck pass.

## Resume

Not started.
