---
title: The hosts screen scrolls and shows the host - implemented
date: 2026-11-17
refs:
  - git://def8529
  - "[code://src/ahp/about.ts](../../../../src/ahp/about.ts)"
  - "[code://src/screens.tsx](../../../../src/screens.tsx)"
  - "[code://test/hosts.test.tsx](../../../../test/hosts.test.tsx)"
  - npm://@textui/widgets@0.9.2 - `Tree` opens a row with children on a click
---

The hosts screen is a page that scrolls, with the sections of ahpw's host page, each drawn only when the host sent it.
Its agents open their models on Enter or a click, and `n` starts a new session with the selected agent.

## What was built

- [`code://src/ahp/about.ts`](../../../../src/ahp/about.ts) - `hostAbout`, the host's facts read from the `initialize` answer and the root state.
- [`code://src/ahp/live.ts`](../../../../src/ahp/live.ts) and [`code://src/ahp/fake.ts`](../../../../src/ahp/fake.ts) - `about()` on both hosts; the live one keeps the last `initialize` answer and the time the connection came up.
- [`code://src/screens.tsx`](../../../../src/screens.tsx) - `HostsScreen`, `HostSection`, `HostPage` and `HostAgents`.
- [`code://src/control.ts`](../../../../src/control.ts) and [`code://src/state.ts`](../../../../src/state.ts) - `about()` on the controller, `HOSTS_SCOPE`, `hosts.newSession` on `n`, and `HOST_AGENT`.
- [`code://src/app.tsx`](../../../../src/app.tsx) - the key row of the hosts screen.
- The three catalogs - the strings of the page, the command and the key row.
- [`code://docs/use/HOST.md`](../../../../docs/use/HOST.md), [`code://docs/img/host.svg`](../../../../docs/img/host.svg), the row in `docs/use/SCREEN.md`, the sidebar entry, and the picture in `tools/pictures.mjs`.
- `@textui/*` move to 0.9.2, in `package.json`, `package-lock.json` and `deno.lock`.

## Verified

- `test/hosts.test.tsx` passes 11 tests, from the sections and the scroll to the keys.
  They cover Enter, a click, `n` on an agent and on a model, the follow, and the columns wide and narrow.
- `test/live.test.tsx` and `test/fake.test.ts` test `about()` on both hosts, and on a live host that sent nothing.
- `npm run typecheck` and `npm test` pass: 54 files, 979 tests.
- The page against the scripted host matches the two mockups at 110 by 40, and scrolls at 80 by 24.
- At 180 columns the values line up in two columns down the page; at 90 they line up in one.
- `docs/img/host.svg` is drawn from ahpd's demo host: protocol 1.1.0, server `ahpd`, the build, the machine, one agent and one terminal.

## Departures from the plan

- A click on a `Tree` row only selected it. Softov chose to change `Tree` in textui; textui 0.9.2 opens a row with children on a click, and ahpc moved to it.
- textui 0.9.2 also carries three fixes from ahpc's ideas in textui's roadmap.
  They are a dialog's default action, one form submit at a time, and tabs that skip a disabled tab.
- The selected agent is in the store as `HOST_AGENT`, because `n` runs a command, and the command reads it there.
- `hosts.newSession` reads the agents before `harness.choose`, which picks from the list its palette last read.
- The page follows the selected row only after it moves, so it opens at its top.
- An agent's meta is cut to the width its name leaves, because a long description cut the name of ahpd's demo agent.
- After review, each section is a textui `Grid` with one label width for the page, two columns wider than `SPLIT_AT` and one below it.
- After review, `n` on a model's row also chooses that model.
- The controller had a `terminals` service already, so the page reads the `TERMINALS` store and adds no read of its own.

## Left for later

- ahpc can drop the workarounds that textui 0.9.2 fixes.
  They are the order of the stage dialog's buttons, the sign-in field's own guard, and a keyboard test for the tab past a disabled one.
