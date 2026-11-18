---
title: The agents open their models
status: done
depends:
  - task-02-the-hosts-screen-is-a-page.md
layer: "screen"
refs:
  - "[code://src/screens.tsx#L2630-L2679](../../../../src/screens.tsx#L2630-L2679) - `HostsScreen`, whose *Agents* section this task replaces"
  - "[code://src/control.ts#L2394](../../../../src/control.ts#L2394) - `harness.choose`, which sets a new session's agent"
  - "[code://src/control.ts#L2775](../../../../src/control.ts#L2775) - `session.new`, which opens a new session"
  - npm://@textui/widgets@0.9.0 - `Tree`: `nodes`, `selectedId`, `expandedIds`, `onSelect`, `onToggle`
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/resources/host/Info.tsx - `AgentRows`, one row per agent with a button that starts a session
---

## Objective

The agents are a `Tree`, as [mockup-02-agents.png](mockup-02-agents.png) shows.
Enter or a click opens and closes an agent's models, and `n` starts a new session with the selected agent.

## Files

- `UPDATE: src/screens.tsx:2630-2679` - the *Agents* section as a `Tree`, the selection and the keys.
- `UPDATE: src/i18n/en/screens.ts` - the model count and the key hints.
- `UPDATE: src/i18n/pt-BR/screens.ts` - the same keys in Portuguese.
- `UPDATE: src/i18n/es/screens.ts` - the same keys in Spanish.
- `UPDATE: test/hosts.test.tsx` - the keys and the click.

## Steps

1. Draw one `Tree` node per agent: the display name, and as `meta` the provider, the description and the model count.
2. Give each agent its models as children: the display name, and the model id as `meta`.
3. Start with every agent closed, and the first agent selected.
4. Move the selection with the arrows, and scroll the page to keep the selected row on screen.
5. Open or close the selected agent on Enter, and the clicked agent on a click.
6. On `n`, run `session.new`, then `harness.choose` with the selected agent's provider.
7. Name the keys on the last row: move, open, new session with the agent, back.
8. Put every new string in the three catalogs.
9. Compare the page with [mockup-02-agents.png](mockup-02-agents.png).

## Validation

- `test/hosts.test.tsx`: Enter opens the selected agent and draws its models; Enter again closes it.
- `test/hosts.test.tsx`: a click on an agent's row opens it.
- `test/hosts.test.tsx`: `n` on an agent opens a new session whose agent is that one.
- `npm run typecheck` and `npm test` pass.

## Resume

Done with textui 0.9.2; before it, blocked on that release. A click on a `Tree` row only selected it. Softov chose to change `Tree` in textui.
Now a click on a row with children opens or closes it.
textui released it in 0.9.2, and ahpc moved to that release; all of `test/hosts.test.tsx` passes.

Besides the files above, this task changed:

- `src/state.ts`: `HOST_AGENT`, the selected agent, because the `n` key runs a command and the command reads it from the store.
- `src/control.ts`: `HOSTS_SCOPE`, the command `hosts.newSession` and its key `n`. The command reads the agents first, because `harness.choose` picks from the list its palette last read.
- `src/app.tsx`: the key row of the hosts screen.
- The page follows the selected row only after it moves, so it opens at its top.
- An agent's meta is cut to the width its name leaves, because a long description cut the name.
