---
title: A running call moves to the background - implemented
date: 2026-11-21
refs:
  - git://b2e9df837 - the merge of PR #44 that holds the key
  - "[code://src/control.ts](../../../../src/control.ts) - `turn.background`, bound to ctrl+b in a running chat"
  - "[code://src/ahp/live.ts](../../../../src/ahp/live.ts) - `moveToBackground` sends `x-ahpd/backgroundToolCall`; `toolCall` keeps the flag as `movable`"
  - "[code://src/state.ts](../../../../src/state.ts) - `movableCall`, the call the person is looking at"
---

ctrl+b moves the running call the person is looking at to the background, as Claude Code's Ctrl+B does.
The key is the default; the config can change it later.

## What was built

- [`code://src/ahp/types.ts`](../../../../src/ahp/types.ts) - `ToolCall.movable`, set only while the call runs.
- [`code://src/ahp/live.ts`](../../../../src/ahp/live.ts) - `toolCall` reads `_meta['ahpd.backgroundToolCall']`, which the flattening dropped before, and `moveToBackground` sends `x-ahpd/backgroundToolCall` with the session's chat.
- [`code://src/ahp/connection.ts`](../../../../src/ahp/connection.ts) and [`code://src/ahp/fake.ts`](../../../../src/ahp/fake.ts) - the host method, and the fake that answers `backgrounded: false`.
- [`code://src/control.ts`](../../../../src/control.ts) - `turn.background` in the palette and on `ctrl+b`, in a running chat only.
- [`code://src/state.ts`](../../../../src/state.ts) - `movableCall`, which picks the last running movable call in the active turn.
- Labels in the English, Spanish and Portuguese command files.

## Verified

- `test/movable-call.test.ts` covers `movableCall`: no turn, no movable call, the last of several, and a finished call that was movable.
- `npm run typecheck` passes.
- `npx vitest run` passes (58 files, 998 tests).
- PR #44 merged.

## Departures from the plan

- The flag reaches the UI through `ToolCall.movable`, not through the block. The wire flattening dropped `_meta`, so the plan's assumption that the block carried it was wrong.
- The key hint in the running view is not added. A hint that shows only on movable calls needs its own state, and that is left for later.
- The key acts on the last movable running call, not on a selected block; ahpc has no block selection.

## Left for later

- The key hint in the running view.
- The key in the config, which the brief names.
