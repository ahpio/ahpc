---
title: The hosts screen scrolls and shows the host
created: 2026-11-17
refs:
  - git://487db0d - the commit of this repository the facts were checked at
  - "[code://src/control.ts#L2236-L2243](../../src/control.ts#L2236-L2243) - `hosts.show`, which pushes the screen `hosts`"
  - "[code://src/screens.tsx#L2630-L2679](../../src/screens.tsx#L2630-L2679) - `HostsScreen`, one column with no scroll and no focus"
  - "[code://src/state.ts#L359-L363](../../src/state.ts#L359-L363) - `HostState`, the only host facts in the store"
  - "[code://src/ahp/live.ts#L303-L307](../../src/ahp/live.ts#L303-L307) - `Mirror`, typed with the root's agents and terminals only"
  - "[code://src/ahp/live.ts#L1776-L1783](../../src/ahp/live.ts#L1776-L1783) - the `initialize` answer, kept in `hello` and applied to the mirror"
  - "[code://src/ahp/live.ts#L1648](../../src/ahp/live.ts#L1648) - `clientId`, this client's name to the host"
  - "[code://src/ahp/connection.ts#L41](../../src/ahp/connection.ts#L41) - `HostConnection`, which offers no read of the host's own facts"
  - "[code://src/view/wire.tsx#L201-L207](../../src/view/wire.tsx#L201-L207) - a `ScrollView` already in use"
  - npm://@textui/widgets@0.9.0 - `ScrollView` with `offset`, `Tree` with `expandedIds` and `onToggle`, `KeyValue` with `columns`
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/resources/host/Info.tsx - the host page this change follows
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/bridges/host-about.ts - how ahpw reads the root state's `_meta`
  - https://github.com/ahpio/ahpw/blob/d05e6f5/src/bridges/offers.ts - the signed-in account, an ahpd `_meta` key
---

# The hosts screen scrolls and shows the host

Softov wants the hosts screen to be a page a person can move through.
Today `/hosts.show` has no navigation and no scroll, and a long model list runs off the screen.
He wants the agents to open their models on Enter or a click.
He also wants the facts about the host that ahpw shows on its host page.
He saw a mockup on 2026-11-17 in two states: the top of the page, and the agents with one agent open.

## What others do

ahpw is the reference: its host page at `d05e6f5` has these sections, each a list of labels and values.

| Section | What it shows |
| --- | --- |
| Connection | Address, protocol version, connected since, client id, signed-in account, channels followed with `serverSeq`, last error |
| Server | Software and version, build, default folder, active sessions out of all sessions |
| Machine | Platform and architecture, CPUs, memory |
| Automations | How many, and when one last ran |
| Agents | One row per agent: name, provider, description, model count, and a button that starts a session with it |
| Agent settings | Each agent's settings page: title, provider, description and keys |
| Trusted folders | The folders the host trusts |
| Terminals | Each terminal and its state |

ahpw reads the software from `serverInfo` in the `initialize` answer.
It reads the build, the machine and the settings pages from the root state's `_meta`.
It reads the signed-in account from an ahpd `_meta` key, so a host that is not ahpd shows none.

## What ahpc has today

- `hosts.show` pushes the screen `hosts`, as [`code://src/control.ts`](../../src/control.ts#L2236-L2243) says.
- [`code://src/screens.tsx`](../../src/screens.tsx#L2630-L2679) draws it as one column: a connection badge, two notes, then each agent with every model on its own line.
- The screen has no `ScrollView` and nothing it can focus, so the arrows do nothing and the rows past the panel are cut.
- The store holds the host's id, URL and state only, as [`code://src/state.ts`](../../src/state.ts#L359-L363) says.
- `live.ts` keeps the `initialize` answer in `hello` and applies its snapshots to the mirror, as [`code://src/ahp/live.ts`](../../src/ahp/live.ts#L1776-L1783) says.
- `HostConnection` offers `agents()`, `terminals()` and `automations()`, and no read of the protocol version, the root `_meta` or the root config.
- textui 0.9.0 has `ScrollView`, `Tree` and `KeyValue`, and ahpc already uses `ScrollView` in [`code://src/view/wire.tsx`](../../src/view/wire.tsx#L201-L207).

The VS Code host on Softov's desktop answered `initialize` on 2026-11-17 with these facts, read from a wire log:

| Where | What it held |
| --- | --- |
| `initialize` answer | `protocolVersion`, `serverSeq`, `defaultDirectory`, `snapshots`; no `serverInfo` |
| Root state | `agents`, `activeSessions`, `config`, `terminals`, `_meta` |
| Root `_meta.hostBuild` | `version`, `commit`, `date`, `quality` |
| Root `_meta["vscode.agentHost.resources"]` | `platform`, `architecture`, `cpuCount`, `memoryBytes` |
| Root `_meta["vscode.agentCustomizationSettings"]` | One page per agent: `provider`, `title`, `description`, `settings` with their `key` |
| Agents | `copilotcli` with 15 models, `claude` with 4, `codex` with 6 |

## Who writes

- `main` is at `487db0d`, and no pull request is open.
- Three remote branches are not merged: `ahp/20261104-0734-a-refused-command-names-the-variable`, `ahp/20261104-0734-the-resource-token-has-its-own-flag` and `cli/20261112-0821-create-session-waits-on-progress`. None of them changes `screens.tsx`, `live.ts`, `connection.ts` or `state.ts`.
- The brief on `brief/the-client-turns-on-the-artifact-tools`, in the worktree `/github/ahpc.worktrees/artifact-tools-brief`, reads the root snapshot in `onConnected`. Its open point asks whether ahpc already holds that snapshot, and this change makes `live.ts` hold it.
- The plan `cli/20261117-0752-ahpc-keeps-named-servers` changes `connect.ts`, `tui.tsx`, `cli/main.ts` and `config.ts`, and not the screen. Its server names do not appear on this screen.

## The change

- `live.ts` keeps, from the `initialize` answer, the protocol version, `serverSeq`, `defaultDirectory`, and `serverInfo` when the host sends it.
- `live.ts` keeps, from the root state, `_meta`, `activeSessions` and `config`, and follows them through root actions and reconnects.
- `HostConnection` gains one read that answers these facts with the client id and the connection time.
- The hosts screen is a page in a `ScrollView`, with the address and the connection state on its first line.
- The page has the sections of ahpw's table in *What others do*, in that order, and the address shows once, on the first line.
- A section, or a row in it, shows only when the host sent its facts.
- The agents are a `Tree`: one row per agent, with the provider, the description and the model count.
- Enter or a click on an agent opens and closes its models, and the arrows move through the rows.
- `n` starts a new session with the selected agent, as ahpw's button does.
- Every string goes through the i18n catalog in `en`, `pt-BR` and `es`.

## Open points

- Not checked: whether ahpd writes `hostBuild` and `vscode.agentHost.resources` in its root `_meta`, as ahpw's `host-about.ts` says.
- Not checked: whether ahpc can count the channels it follows, for the *Following* row.
