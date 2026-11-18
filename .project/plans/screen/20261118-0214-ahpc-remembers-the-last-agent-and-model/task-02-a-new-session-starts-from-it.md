---
title: A new session starts from the last choice
status: todo
depends:
  - task-01-ahpc-keeps-the-last-choice.md
layer: "screen"
refs:
  - "[code://src/control.ts#L783-L790](../../../../src/control.ts#L783-L790) - `first`, which takes the host's first agent"
  - "[code://src/control.ts#L393-L409](../../../../src/control.ts#L393-L409) - `offerModel`"
  - "[code://src/control.ts#L2419-L2445](../../../../src/control.ts#L2419-L2445) - `model.choose`, the order to copy"
  - file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputModelSelectionController.ts - VS Code `1564f100807a`: the remembered model, taken when the host lists it
---

## Objective

When the composer has no agent chosen, it takes the agent, the model and the model's options remembered for the host.
What the host no longer offers is left out, and a choice made in the screen wins.

## Files

- `UPDATE: src/control.ts:783-790` - `first` takes the remembered choice before the first agent.
- `CREATE: test/remember.test.tsx` - the composer against the scripted host, over a temporary config folder.

## Steps

1. In `first`, while no agent is in `PROVIDER` and remembering is on, read the choice for `HOST.url`.
2. Take the remembered agent when the host lists it, and the host's first agent otherwise.
3. Take the remembered model when that agent lists it, and offer its options with `offerModel`.
4. Keep each remembered option whose key the model offers, with a value among that key's values.
5. Take nothing when an agent is already chosen.

## Validation

- `test/remember.test.tsx`: after a restart, a new session has the agent, model and option of the last one.
- `test/remember.test.tsx`: the composer leaves out an agent, a model or an option the host no longer offers.
- `test/remember.test.tsx`: with `remember` off, a restart starts at the host's first agent.
- `npm run typecheck` and `npm test` pass.

## Resume
