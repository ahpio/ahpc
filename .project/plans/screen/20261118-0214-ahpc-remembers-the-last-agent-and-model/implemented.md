---
title: ahpc remembers the last agent and model per host - implemented
date: 2026-11-18
refs:
  - git://76f8dc3
  - "[code://src/choices.ts](../../../../src/choices.ts)"
  - "[code://src/control.ts](../../../../src/control.ts)"
  - "[code://test/remember.test.tsx](../../../../test/remember.test.tsx)"
---

A new session on the screen starts with the agent, model and model options of the last session on the same host.
`rememberChoices: false` or `--no-remember` turns this off.

## What was built

- [`code://src/choices.ts`](../../../../src/choices.ts) - `choices.json`, one choice per host address: `readChoice` and `keepChoice`.
- [`code://src/control.ts`](../../../../src/control.ts) - `create` keeps the choice; `first` takes it back while no agent is chosen.
- [`code://src/app.tsx`](../../../../src/app.tsx), [`code://src/tui.tsx`](../../../../src/tui.tsx), [`code://src/config.ts`](../../../../src/config.ts) and [`code://src/flags.ts`](../../../../src/flags.ts) - `ChatOptions.remember`, `--no-remember` and `rememberChoices`.
- `docs/use/NEW-SESSION.md`, `docs/start/CONFIGURE.md` and `docs/reference/CONFIG-FILE.md` - what is kept, and how to turn it off.

## Verified

- `test/choices.test.ts` passes 2 tests: one choice per address, and a broken file read as none.
- `test/remember.test.tsx` passes 4 tests: a restart, the model and its options, what the host no longer offers, and remembering off.
- `npm run typecheck`, `npm run docs:build` and `npm test` pass: 56 files, 985 tests.
- Softov's check by hand passed on 2026-11-18: after a restart, a new session on a live host came back with its agent, model and effort.

## Departures from the plan

- `remember` is off in `registerChat` unless asked for, so a test never reads or writes a person's `choices.json`. Only the live screen turns it on; a still does not.
- The controller's parameter is `keepsChoices`, because `remember` already names the token store's function there.
