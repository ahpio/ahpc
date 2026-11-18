---
title: The hosts screen scrolls and shows the host
domain: screen
status: built
priority: medium
created: 2026-11-17
revalidated: 2026-11-17
requires: []
changes: []
creates: []
decisions: []
refs:
  - git://513d1b6 - the last commit that holds the brief `briefs/the-hosts-screen-scrolls-and-shows-the-host.md`, which this plan covers
  - "[code://src/screens.tsx#L2630-L2679](../../../../src/screens.tsx#L2630-L2679) - `HostsScreen`, one column with no scroll and no focus"
  - "[code://src/control.ts#L2236-L2243](../../../../src/control.ts#L2236-L2243) - `hosts.show`, which pushes the screen `hosts`"
  - "[code://src/ahp/live.ts#L1776-L1783](../../../../src/ahp/live.ts#L1776-L1783) - the `initialize` answer, kept in `hello` and applied to the mirror"
  - "[code://src/ahp/live.ts#L303-L307](../../../../src/ahp/live.ts#L303-L307) - `Mirror`, typed with the root's agents and terminals only"
  - "[code://src/ahp/channels.ts#L73-L75](../../../../src/ahp/channels.ts#L73-L75) - `held()` and `seq()`, the channels followed and the last `serverSeq`"
  - "[code://src/ahp/connection.ts#L41](../../../../src/ahp/connection.ts#L41) - `HostConnection`, which gains the read of the host's facts"
  - "[code://src/ahp/fake.ts#L236](../../../../src/ahp/fake.ts#L236) - `fakeHost`, which answers the same read"
  - "[code://src/view/wire.tsx#L201-L207](../../../../src/view/wire.tsx#L201-L207) - a `ScrollView` already in use, the pattern the page copies"
  - "[code://src/control.ts#L2394](../../../../src/control.ts#L2394) - `harness.choose`, which sets the agent of a new session"
  - npm://@textui/widgets@0.9.0 - `ScrollView` with `offset`, `Tree` with `expandedIds` and `onToggle`, `KeyValue` with `columns`
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/resources/host/Info.tsx - the host page this plan follows, section by section
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/bridges/host-about.ts - the root `_meta` keys for the build, the machine and the settings pages
  - https://github.com/ahpio/ahpd/blob/9e030f996/packages/sdk/src/host/root.ts#L844-L881 - ahpd writes `vscode.agentHost.resources` and `hostBuild` in its root `_meta`
  - https://github.com/ahpio/ahpd/blob/9e030f996/packages/sdk/src/host/handshake.ts#L444 - ahpd sends `serverInfo` in its `initialize` answer
---

## Goal

The hosts screen becomes a page a person can move through and read.
It scrolls, and its agents open their models on Enter or a click.
It shows the sections of ahpw's host page, from the connection to the terminals.
Each fact on the page is one the host sent, so a section the host has nothing for is left out.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.
The brief, in the commit `513d1b6`, holds the facts read from a VS Code host on 2026-11-17.

### Searches performed

- `rg -n "hostBuild|vscode.agentHost.resources" packages` in ahpd - `root.ts` writes both; `hostBuild` holds `version` only.
- `rg -n "serverInfo" packages/sdk/src/host/handshake.ts` in ahpd - `{ name: 'ahpd', version }`. VS Code sends no `serverInfo`.
- `rg -n "held\(\)|seq\(\)" src/ahp/channels.ts` - the channel registry counts what it follows and keeps the last `serverSeq`.
- `rg -n "principal" src/bridges/offers.ts` in ahpw - the signed-in account is an ahpd `_meta` key.
- `rg -n "session.new|harness.choose" src/control.ts` - a new session with a named agent is these two commands.

### Runtime path

```
hosts.show -> screens.push('hosts') -> HostsScreen
  -> controller -> host.about() -> live.ts: hello + mirror.root + channels -> HostAbout
  -> ScrollView: first line, sections (KeyValue), agents (Tree) -> Enter toggles models, n -> session.new + harness.choose
```

### Gaps

- `HostConnection` has no read of the protocol version, `serverInfo`, `defaultDirectory`, the root `_meta`, `activeSessions` or the root config.
- The hosts screen has no `ScrollView` and nothing it can focus.
- No docs page names the hosts screen.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The hosts screen work is its own brief and plan, beside the servers plan | Softov, 2026-11-17: "Its own brief" | - |
| The page has ahpw's sections: Connection, Server, Machine, Automations, Agents, Agent settings, Trusted folders, Terminals | Softov, 2026-11-17: "Connection, Server and machine, Automations and terminals, Settings and trusted folders" | 02 |
| Enter or a click on an agent opens and closes its models | Softov, 2026-11-17: "maybe it could expand the models on agents on enter or click" | 03 |
| A click opens an agent through textui: `Tree` opens or closes a row with children on a click, released in textui, and ahpc moves to that release | Softov, 2026-11-17: "Click opens in textui's Tree" | 03 |
| The page follows the two mockups in this folder: [mockup-01-top.png](mockup-01-top.png) and [mockup-02-agents.png](mockup-02-agents.png) | Softov, 2026-11-17: "write the brief", after he saw both | 02, 03 |
| `n` starts a new session with the selected agent | (defaulted: ahpw's chat button; in the mockup Softov saw) | 03 |
| `n` on a model's row also chooses that model; on an agent's row the host's default stands | Softov, 2026-11-17: "it select the agent but does not select the model"; "The host's default" | 03 |
| A section's rows are a textui `Grid`: two pairs to a line wider than `SPLIT_AT`, one below it, with one label width for the page | Softov, 2026-11-17: "can it align the host info?"; "KeyValue, halves in ahpc"; "you forget to make it responsive" | 02 |
| The address shows once, on the first line | (defaulted: in the mockup Softov saw) | 02 |
| The two notes on the scripted and the live host go | (defaulted: the mockup Softov saw has neither) | 02 |
| A section, or a row, shows only when the host sent its facts | (defaulted: ahpw's `Info.tsx` leaves out what the host did not send) | 02 |
| Trusted folders are the ones the host holds in its root config, not ahpc's `trust` setting | (defaulted: the page shows what the host sent) | 01, 02 |
| The read is `HostConnection.about()`, answered by both hosts | (defaulted: one read, as `agents()` is) | 01 |
| The arrows move through the agents, and the page scrolls to keep the selected row on screen; `pageup` and `pagedown` scroll the page | (defaulted: one focus on the page, as the wire view has) | 03 |
| Every string goes through the i18n catalog in `en`, `pt-BR` and `es` | (defaulted: every screen string is in the catalog) | 02, 03 |
| The docs get a page for the hosts screen in `docs/use/`, beside the other screens | (defaulted: `docs/use/SESSION.md` is the sibling) | 04 |

## Proposed architecture

- **Data flow** - `live.ts` reads the `initialize` answer, the root state and the channels into one `HostAbout`. The screen asks `about()` when it opens.
- **Event flow** - Enter or a click on an agent toggles it in the expanded set; `n` runs `session.new`, then `harness.choose` with the agent.
- **State flow** - the expanded agents and the selected row are screen state; nothing new goes in the store.
- **Layer responsibilities** - `src/ahp/`: the host's facts · `src/screens.tsx`: the page · `src/control.ts`: nothing new · `docs/use/`: the page's doc.
- **Source-of-truth files** - [`code://src/ahp/types.ts`](../../../../src/ahp/types.ts) for `HostAbout`, created by task 01.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The host connection answers the host's facts](task-01-the-host-answers-its-facts.md) | done | - |
| [02 - The hosts screen is a page with sections](task-02-the-hosts-screen-is-a-page.md) | done | 01 |
| [03 - The agents open their models](task-03-the-agents-open-their-models.md) | done | 02 |
| [04 - The docs show the hosts screen](task-04-the-docs-show-the-hosts-screen.md) | done | 03 |

## Risks and tradeoffs

- VS Code sends no `serverInfo`, so its Server section starts at the build - the section shows what is there.
- The root `_meta` keys are VS Code's names, read by name as ahpw reads them - a renamed key is a missing row, not a failure.
- A model list of 15 rows is long - the agents start closed, and the page scrolls.

## Resume state

- **Done so far:** tasks 01 to 04, on 2026-11-17, as [implemented.md](implemented.md) says.
- **Next action:** review, then the pull request.
- **Open questions:** none; every row in *Answers* is Softov's or defaulted, and he may erase a defaulted one.
- **Watch out for:** draw no fact the host did not send, and name no host or agent in the screen's code.

## Final verification checklist

- [x] `about()` answers the protocol version, the client id, the channels followed and `serverSeq` from both hosts.
- [x] The root `_meta` build, machine and settings pages reach the page from a live host.
- [x] The page scrolls, and a section the host sent nothing for is not drawn.
- [x] Enter and a click open and close an agent's models; `n` opens a new session with that agent.
- [x] The page matches the two mockups in this folder.
- [x] `npm run typecheck`, `npm test` and `npm run docs:build` pass.
- [x] Against a VS Code tunnel and an ahpd host, the page shows each one's own facts.

