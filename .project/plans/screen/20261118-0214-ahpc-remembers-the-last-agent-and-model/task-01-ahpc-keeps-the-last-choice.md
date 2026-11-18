---
title: ahpc keeps the last choice per host
status: todo
depends: []
layer: "screen"
refs:
  - "[code://src/update.ts#L75-L118](../../../../src/update.ts#L75-L118) - how `update.json` is read and written"
  - "[code://src/config.ts#L85-L91](../../../../src/config.ts#L85-L91) - `updateCheck`, the sibling key"
  - "[code://src/tui.tsx#L264](../../../../src/tui.tsx#L264) - `--no-update-check`, the sibling flag"
  - "[code://src/app.tsx#L505-L552](../../../../src/app.tsx#L505-L552) - `ChatOptions`"
  - "[code://src/control.ts#L1165-L1182](../../../../src/control.ts#L1165-L1182) - `create`"
---

## Objective

When a session starts on the screen, ahpc writes the agent, the model and the model's options to `choices.json`, under the host's address.
`rememberChoices: false` or `--no-remember` turns this off.

## Files

- `CREATE: src/choices.ts` - `choicesPath`, `readChoice(address)` and `keepChoice(address, choice)`.
- `UPDATE: src/config.ts:85-91` - `Config.rememberChoices`.
- `UPDATE: src/tui.tsx:264` - `--no-remember`, then the config key, into the screen's options and its usage text.
- `UPDATE: src/flags.ts` - `--no-remember` in `SWITCHES`.
- `UPDATE: src/app.tsx:505-552` - `ChatOptions.remember`.
- `UPDATE: src/control.ts:1165-1182` - `create` keeps the choice when remembering is on.
- `CREATE: test/choices.test.ts` - the file, per address, and a file that cannot be read.

## Steps

1. In `src/choices.ts`, keep `{ [address]: { provider, model?, modelConfig? } }` in `statePath('ahpc', 'choices.json')`.
2. Answer an empty choice for a missing or broken file, as `readUpdate` does.
3. Write the whole file again with one address changed, and leave the other addresses as they are.
4. Add `rememberChoices?: boolean` to `Config`, true when absent.
5. In the screen, read `--no-remember`, then the config key, into `remember`, and pass it to `registerChat`.
6. Add `--no-remember` to `SWITCHES` and to the screen's usage text.
7. In `create`, when `remember` is on, keep `PROVIDER`, `MODEL` and `MODEL_CONFIG` under `HOST.url`.
8. Leave the model and its options out of the file when they are empty.

## Validation

- `test/choices.test.ts`: a kept choice reads back for its address, and another address keeps its own.
- `test/choices.test.ts`: a broken file reads as empty.
- `npx vitest run test/choices.test.ts` and `npm run typecheck` pass.

## Resume
