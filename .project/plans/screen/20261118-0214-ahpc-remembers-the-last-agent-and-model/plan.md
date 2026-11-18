---
title: ahpc remembers the last agent and model per host
domain: screen
status: built
priority: medium
created: 2026-11-18
revalidated: 2026-11-18
requires:
  - plans/screen/20261117-2247-the-hosts-screen-shows-the-host/plan.md
changes: []
creates: []
decisions: []
refs:
  - git://247a67a - the last commit that holds the brief `briefs/ahpc-remembers-the-last-agent-and-model.md`, which this plan covers
  - "[code://src/state.ts#L129-L140](../../../../src/state.ts#L129-L140) - `PROVIDER`, `MODEL` and `MODEL_CONFIG`, the choice to keep"
  - "[code://src/control.ts#L783-L790](../../../../src/control.ts#L783-L790) - `first`, where the composer takes the host's first agent"
  - "[code://src/control.ts#L1165-L1182](../../../../src/control.ts#L1165-L1182) - `create`, where a new session starts"
  - "[code://src/control.ts#L393-L409](../../../../src/control.ts#L393-L409) - `offerModel`, which offers a model's options as commands"
  - "[code://src/control.ts#L2419-L2445](../../../../src/control.ts#L2419-L2445) - `model.choose`, the order a model and its options are set in"
  - "[code://src/config.ts#L85-L91](../../../../src/config.ts#L85-L91) - `updateCheck`, the key that turns a behaviour off"
  - "[code://src/config.ts#L115](../../../../src/config.ts#L115) - `statePath`, where the file goes"
  - "[code://src/update.ts#L75-L118](../../../../src/update.ts#L75-L118) - how `update.json` is read and written, the pattern the file copies"
  - "[code://src/tui.tsx#L264](../../../../src/tui.tsx#L264) - `--no-update-check`, the flag the new one copies"
  - "[code://src/app.tsx#L505-L552](../../../../src/app.tsx#L505-L552) - `ChatOptions`, which carries what the screen was told"
  - file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputModelSelectionController.ts - VS Code `1564f100807a`: the remembered model, taken when the host lists it
---

## Goal

A new session starts with the agent, the model and the model's options that Softov used last on that host.
Closing ahpc and opening it again keeps them, per host.
A setting, on by default, turns this off.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "store.set\((PROVIDER|MODEL|MODEL_CONFIG)" src/control.ts` - `first`, `harness.choose` and an opened session set the agent.
  `model.choose` and an opened session set the model and its options.
- `rg -n "statePath\(" src` - ahpc keeps `update.json` and `tunnel.json`, and no composer choice.
- `rg -n "updateCheck|no-update-check" src docs` - the key, the flag and their two docs.

### Runtime path

```
boot -> host.agents() -> first(): remembered agent if listed, else the first
  -> remembered model if the agent lists it -> offerModel(options) -> remembered options it still offers
send on a new session -> controller.create() -> write { provider, model, modelConfig } under HOST.url
```

### Gaps

- No file keeps a composer choice.
- `first` knows only the host's first agent.
- No setting turns remembering off.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Remember the agent, the model and the model's options, such as effort | Softov, 2026-11-17: "Agent, model, model options" | 01, 02 |
| Keep them per host | Softov, 2026-11-17: "Per host" | 01 |
| A setting turns remembering off, and it is on by default | Softov, 2026-11-17: "A setting, on by default" | 01 |
| The key is `rememberChoices`, and the flag `--no-remember` | (defaulted: `updateCheck` and `--no-update-check` are the sibling) | 01 |
| The file is `choices.json`, written through `statePath` beside `update.json` | (defaulted: the brief, committed in `247a67a`) | 01 |
| The key in the file is the host's address as `HOST.url` holds it | (defaulted: the brief) | 01 |
| The choice is written when a session starts, in `create` | (defaulted: the brief) | 01 |
| The remembered choice is taken only while no agent is chosen, so a chip, the palette or `n` wins | (defaulted: the brief) | 02 |
| A remembered model option is kept only when the model still offers its key and its value | (defaulted: a value the model does not offer is one the host refuses) | 02 |
| Only the screen remembers; the commands do not | (defaulted: the composer is the screen's) | 01 |
| This plan builds on the hosts screen plan, whose pull request changes the same files | (defaulted: pull request #36 changes `control.ts` and `state.ts`) | - |

## Proposed architecture

- **Data flow** - `src/choices.ts` reads and writes `choices.json`; `create` writes the choice, and `first` reads it.
- **Event flow** - nothing new; the boot's `host.agents()` answer is when the choice is taken.
- **State flow** - `choices.json` holds `{ [address]: { provider, model?, modelConfig? } }`; the store keys do not change.
- **Layer responsibilities** - `src/choices.ts`: the file · `src/control.ts`: when it is read and written · `src/tui.tsx` and `src/config.ts`: the setting.
- **Source-of-truth files** - [`code://src/choices.ts`](../../../../src/choices.ts), created by task 01.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - ahpc keeps the last choice per host](task-01-ahpc-keeps-the-last-choice.md) | done | - |
| [02 - A new session starts from the last choice](task-02-a-new-session-starts-from-it.md) | done | 01 |
| [03 - The docs say ahpc remembers](task-03-the-docs-say-ahpc-remembers.md) | done | 02 |

## Risks and tradeoffs

- The model rides on the first message, so a session that fails before its first message still writes the choice - the person did choose it.
- A host reached by two addresses, such as a `tunnel:` name and a port URL, keeps two choices - the address is what the person typed.
- The file holds no secret, so it is written with the default mode, as `update.json` is.

## Resume state

- **Done so far:** tasks 01 to 03, on 2026-11-18, as [implemented.md](implemented.md) says.
- **Next action:** review, then the check by hand in [ahpc-remembers-the-last-agent-and-model.md](../../../pending/ahpc-remembers-the-last-agent-and-model.md).
- **Open questions:** none; every row in *Answers* is Softov's or defaulted, and he may erase a defaulted one.
- **Watch out for:** never let a remembered value override a choice made in the screen.

## Final verification checklist

- [x] Starting a session writes the agent, the model and the model's options under the host's address.
- [ ] After a restart against a live host, a new session on that host starts with them.
- [x] A remembered agent, model or option the host no longer offers is left out.
- [x] `rememberChoices: false` and `--no-remember` neither read nor write the file.
- [x] `npm run typecheck`, `npm test` and `npm run docs:build` pass.
