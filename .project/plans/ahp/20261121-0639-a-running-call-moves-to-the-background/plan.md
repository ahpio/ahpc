---
title: A running call moves to the background
domain: ahp
status: planned
priority: medium
created: 2026-11-21
revalidated: 2026-11-21
requires:
  - ahpd plans/host/20261121-0824-a-running-call-moves-to-the-background/plan.md - built in ahpd PR #407, merged as `eb832a04f`
changes: []
creates: []
decisions: []
refs:
  - git://eb832a04f - the ahpd merge that holds the method and the two keys this plan reads
  - "[code://src/blocks.ts#L95-L100](../../../../src/blocks.ts#L95-L100) - the `toolCall` case that turns a call into a block, where the flag is read"
  - "[code://src/ahp/connection.ts](../../../../src/ahp/connection.ts) - the connection's request API, the way ahpc sends `x-ahpd` commands"
  - "[code://src/app.tsx#L290-L340](../../../../src/app.tsx#L290-L340) - the key hints per view; the new key is listed with `ctrl+c`"
---

## Goal

ahpc can move a running foreground call to the background from the keyboard, as ahpw's button does.
ahpd marks a call that can move with `_meta['ahpd.backgroundToolCall']: true`.
The key sends `x-ahpd/backgroundToolCall` with `{ chat, toolCallId }`, and the answer is `{ backgrounded }`.
Once the work is a row, the completed call carries `_meta['ahpd.backgroundWork']`, which the Shells view already lists.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg "backgroundToolCall|backgroundWork" src` - no hits; the keys are new to ahpc.
- `rg "x-ahpd/" src` - ahpc already sends `x-ahpd` commands through the connection; the move follows the same shape.
- `rg "ctrl\+" src/app.tsx` - the key hints are per view, and `ctrl+c` already stops a running turn.

### Gaps

- The block builder in `blocks.ts` does not keep `_meta` on a tool call block, so the flag must be carried into the block.
- No key is bound to a single call; the chosen key must not clash with the existing ones.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The move shows only while a running call carries `ahpd.backgroundToolCall: true` | ahpd PR #407 | 01 |
| The key sends `x-ahpd/backgroundToolCall` for the selected running call | `(defaulted: the call the person is looking at, the way ctrl+c stops the turn)` | 01 |
| The key is `ctrl+b`, the same as Claude Code's | `(defaulted: Claude Code's own key; check it does not clash in ahpc's views)` | 01 |

## Proposed architecture

- **Data flow** - `blocks.ts` carries the flag on the tool call block; the key reads the selected block and sends its `toolCallId`.
- **Event flow** - the answer takes the hint off; the row arrives through the Shells view.
- **State flow** - none new.
- **Layer responsibilities** - `blocks.ts` for the flag; `control.ts` or `connection.ts` for the request; `app.tsx` for the key hint.
- **Source-of-truth files** - [`code://src/blocks.ts`](../../../../src/blocks.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The key moves the selected call](task-01-the-key-moves-the-selected-call.md) | todo | - |

## Risks and tradeoffs

- `ctrl+b` may clash with a terminal's own binding; check it on the platforms ahpc runs on before shipping.
- A call selected in a worker chat needs that chat's URI; the block must carry it.

## Resume state

- **Done so far:** nothing in ahpc. The ahpd side is merged.
- **Next action:** build task 01.
- **Open questions:** whether the key is `ctrl+b` or another key; the default is `ctrl+b`.
- **Watch out for:** `ahpd.backgroundToolCall` is a flag on the call, not a method; the method is `x-ahpd/backgroundToolCall`.

## Final verification checklist

- [ ] A running foreground Bash call shows the key hint.
- [ ] The key sends the method; the turn goes on; the hint goes.
- [ ] The row appears in Shells.
