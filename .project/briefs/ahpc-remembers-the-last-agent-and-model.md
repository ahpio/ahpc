---
title: ahpc remembers the last agent and model per host
created: 2026-11-17
refs:
  - git://def8529 - the commit of this repository the facts were checked at
  - "[code://src/state.ts#L129-L140](../../src/state.ts#L129-L140) - `PROVIDER`, `MODEL` and `MODEL_CONFIG`, the composer's agent, model and model options"
  - "[code://src/control.ts#L345-L356](../../src/control.ts#L345-L356) - at boot the store holds the host's address, and the agent and model start empty"
  - "[code://src/control.ts#L783-L790](../../src/control.ts#L783-L790) - `first`, which takes the first agent the host lists while none is chosen"
  - "[code://src/control.ts#L1165-L1182](../../src/control.ts#L1165-L1182) - `create`, where a new session starts"
  - "[code://src/control.ts#L2394-L2445](../../src/control.ts#L2394-L2445) - `harness.choose` and `model.choose`, which clear the model and its options when the agent or the model changes"
  - "[code://src/control.ts#L426](../../src/control.ts#L426) - where a model option, such as effort, is answered"
  - "[code://src/config.ts#L11-L91](../../src/config.ts#L11-L91) - `Config`, where `updateCheck` is the sibling of a key that turns a behaviour off"
  - "[code://src/config.ts#L115](../../src/config.ts#L115) - `statePath`, where `update.json` and `tunnel.json` are kept"
  - "[code://src/update.ts#L115](../../src/update.ts#L115) - how `update.json` is written"
  - file:///github/externals/vscode/src/vs/workbench/contrib/chat/browser/widget/input/chatInputModelSelectionController.ts - VS Code `1564f100807a`: `initialize` takes the remembered model, shows the default while the model is not listed, and selects it when it is
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/remoteAgentHostLocationPreference.ts - VS Code `1564f100807a`: a choice kept per host, keyed by `tunnel:<id>` or `ssh:<alias>`
---

# ahpc remembers the last agent and model per host

Softov wants a new session to start with the agent, model and model options he used last on that host.
Today, when he closes ahpc and opens it again, the composer starts at the host's first agent and its default model.
He chose on 2026-11-17 to remember the agent, the model and the model's options, such as effort.
They are kept per host, and a setting, on by default, turns the behaviour off.

## What others do

- VS Code remembers the model a person picked. `initialize` in `chatInputModelSelectionController.ts` takes the remembered model id. While the host has not listed that model, it shows the default, and it selects the model when it appears.
- VS Code keeps a choice per remote host in `remoteAgentHostLocationPreference.ts`, keyed by a stable host key such as `tunnel:<id>`.

## What ahpc has today

- The composer's agent, model and model options are `PROVIDER`, `MODEL` and `MODEL_CONFIG` in the store, as [`code://src/state.ts`](../../src/state.ts#L129-L140) says. They live in memory only.
- At boot the store holds the host's address in `HOST.url`, and the agent and the model start empty, as [`code://src/control.ts`](../../src/control.ts#L345-L356) says.
- `first` takes the first agent the host lists while none is chosen, as [`code://src/control.ts`](../../src/control.ts#L783-L790) says.
- `harness.choose` clears the model when the agent changes, and `model.choose` clears the model options when the model changes.
- A new session starts in `create`, as [`code://src/control.ts`](../../src/control.ts#L1165-L1182) says. The model and its options ride on the first message.
- ahpc keeps two files with `statePath`: `update.json` and `tunnel.json`. No file holds a composer choice.
- `Config.updateCheck` is a key that turns a behaviour off, and `--no-update-check` is its flag.

## Who writes

- `main` is at `def8529`.
- Pull request #36, `screen/20261117-2247-the-hosts-screen-shows-the-host`, is open. It changes `control.ts` and `state.ts`. Its `n` key on the hosts screen runs `harness.choose` and `model.choose`, so a remembered choice must not override the agent and model that `n` chose.
- The plan `cli/20261117-0752-ahpc-keeps-named-servers` adds named servers to the config file. A named server opens an address, and this change keys by that address.
- The brief on `brief/the-client-turns-on-the-artifact-tools` changes `connect.ts` only, which this change does not touch.

## The change

- When a session starts on a host, ahpc writes the agent, the model and the model's options for that host.
- The file is a state file beside `update.json`.
- The key is the host's address as `HOST.url` holds it.
- When the composer has no agent chosen, ahpc takes the remembered agent in place of the first one, if the host lists it.
- It then takes the remembered model, if that agent lists it, and the remembered options that the model still offers.
- A remembered value that the host no longer offers is left out, and the composer falls back to what it does today.
- A choice made in the screen, by a chip, by the palette or by `n`, wins over the remembered one.
- A config key, on by default, turns the behaviour off. With it off, ahpc neither reads nor writes the file.
