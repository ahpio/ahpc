---
title: The hosts screen is a page with sections
status: done
depends:
  - task-01-the-host-answers-its-facts.md
layer: "screen"
refs:
  - "[code://src/screens.tsx#L2630-L2679](../../../../src/screens.tsx#L2630-L2679) - `HostsScreen`, which this task rewrites"
  - "[code://src/view/wire.tsx#L201-L207](../../../../src/view/wire.tsx#L201-L207) - the `ScrollView` pattern"
  - "[code://src/i18n/en/screens.ts#L150-L153](../../../../src/i18n/en/screens.ts#L150-L153) - the hosts screen's strings today"
  - npm://@textui/widgets@0.9.0 - `ScrollView` and `KeyValue`
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/resources/host/Info.tsx - the sections, their rows and their order
---

## Objective

The hosts screen is a page in a `ScrollView`, as [mockup-01-top.png](mockup-01-top.png) shows.
It has ahpw's sections, and a section or a row the host sent nothing for is not drawn.

## Files

- `UPDATE: src/screens.tsx:2630-2679` - `HostsScreen`: the first line, the sections and the scroll.
- `UPDATE: src/i18n/en/screens.ts:150-153` - the section titles, the row labels and the values with words.
- `UPDATE: src/i18n/pt-BR/screens.ts` - the same keys in Portuguese.
- `UPDATE: src/i18n/es/screens.ts` - the same keys in Spanish.
- `CREATE: test/hosts.test.tsx` - the page against the scripted host.

## Steps

1. Read `about()`, `agents()`, `automations()` and `terminals()` when the screen opens, and `about()` again when the sessions change.
2. Draw the address and the connection state on the first line, and the rest in a `ScrollView`.
3. Draw *Connection*: protocol, connected since, client, signed-in account, channels followed with `serverSeq`, and the last host error.
4. Draw *Server*: software and version, build, default folder, and active sessions out of all sessions.
5. Draw *Machine*: platform with architecture, CPUs, and memory in GiB.
6. Draw *Automations*: how many, and when one last ran.
7. Draw *Agents* as the plain list task 03 replaces, with a count in its title.
8. Draw *Agent settings*: each page's title, provider, description and keys.
9. Draw *Trusted folders* and *Terminals*, each terminal with its state.
10. Draw each section with a `KeyValue` of two columns where its rows are labels and values.
11. Leave out a row with no value, and a section with no rows.
12. Remove the two notes on the scripted and the live host, and their catalog keys.
13. Put every new string in the three catalogs.
14. Compare the page with [mockup-01-top.png](mockup-01-top.png) at 110 by 40, and at 80 by 24.

## Validation

- `test/hosts.test.tsx`: against the scripted host, the page draws each section title and one row of each section.
- `test/hosts.test.tsx`: a host whose `about()` has no machine draws no *Machine*.
- `test/hosts.test.tsx`: `pagedown` brings *Terminals* on screen at 80 by 24.
- `test/i18n.test.ts` passes, so the three catalogs have the same keys.
- `npm run typecheck` and `npm test` pass.

## Resume

Done. The controller gained `about()`; the terminals come from the controller's `terminals` service and the `TERMINALS` store. *Connected* shows the clock time and how long ago. The page matches mockup 01 at 110 by 40, and scrolls at 80 by 24.

After review: `KeyValue` with `columns` sized each pair by its value, so the second column moved from line to line.
Each section also measured its own labels. Each section is now a textui `Grid` of one pair per cell, with one label width for the page. It has two columns wider than `SPLIT_AT` and one below it.
