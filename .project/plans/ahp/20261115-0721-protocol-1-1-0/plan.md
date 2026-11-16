---
title: ahpc speaks protocol 1.1.0
domain: ahp
status: draft
priority: high
created: 2026-11-15
revalidated: 2026-11-15
requires:
  - plans/ahp/05-protocol-1-0-0/plan.md
  - plans/ahp/08-a-vs-code-1-141-host-is-reached-at-0-10-0/plan.md
changes: []
creates: []
decisions: []
refs:
  - "[code://package.json#L61](../../../../package.json#L61) - `@microsoft/agent-host-protocol` at `^1.0.0`"
  - "[code://src/ahp/live.ts#L209-L237](../../../../src/ahp/live.ts#L209-L237) - `VERSIONS`, the versions offered at `initialize`, `1.0.0` first, and the comment that explains each entry"
  - "[code://src/ahp/live.ts#L1515-L1528](../../../../src/ahp/live.ts#L1515-L1528) - `queued()`, which lists every entry of `queuedMessages` as a queued message"
  - "[code://src/ahp/live.ts#L3172-L3189](../../../../src/ahp/live.ts#L3172-L3189) - `steer`, which sends `chat/pendingMessageSet` with `kind: 'steering'`"
  - "[code://test/reconnect.test.ts#L1171-L1177](../../../../test/reconnect.test.ts#L1171-L1177) - the test that pins the offered versions"
  - "[code://tools/schema.mjs](../../../../tools/schema.mjs) - the strict schema, generated from the installed package"
  - npm://@microsoft/agent-host-protocol@1.1.0 - published 2026-11-13; `PROTOCOL_VERSION` is `1.1.0`
  - "file:///github/ahpd/.project/plans/host/117-ahpd-speaks-ahp-1-1-0/plan.md - ahpd's side of 1.1.0, a draft; until it is built, ahpd answers a `1.1.0` offer with `1.1.0` by the caret rule of its 1.0.0 package"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/common/agentHostProtocolCompatibility.ts - VS Code `1564f100807a` (2026-11-10) is on `1.1.0` and still accepts `1.0.0` and the `0.10.0` alias"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/chatContributions/queueDrain/queueDrainContribution.ts - the same VS Code keeps steering entries in `queuedMessages` and removes each with `kind: 'steering'`"
  - "file:///github/externals/vscode/src/vs/platform/agentHost/node/protocolServerHandler.ts - the same VS Code changes only `multipleChatProviders` by the negotiated version, so a client at 1.0.0 gets the 1.1.0 state"
---

## Goal

ahpc installs protocol 1.1.0 and offers it first, so a host that speaks 1.1.0 runs at 1.1.0.
The screen shows the same queue it shows today, although 1.1.0 keeps steering messages in the same list as queued ones.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- 2026-11-15, in a scratch worktree at `f20c948`: `npm i @microsoft/agent-host-protocol@1.1.0`, then `npx tsc -p tsconfig.json --noEmit` gives 0 errors and `npx vitest run` passes 50 files, 927 tests.
- The same worktree: `npm run schema` writes 536 definitions from 535 exported types, 694 closed objects, and `test/conformance.test.ts` passes on the new schema.
- `diff -ru` of the 1.0.0 and 1.1.0 tarballs, `src/types/` - what 1.1.0 adds is in *Gaps*. The one change to existing behaviour is in the chat reducer. A steering `chat/pendingMessageSet` now adds an entry with `kind` to `queuedMessages`, and `steeringMessage` is deprecated.
- `rg -n "steeringMessage|queuedMessages" src` - ahpc never reads `steeringMessage`; `queued()` reads `queuedMessages` and ignores `kind`.
- The one rename in 1.1.0, `url` to `uri` in `channels-canvas/state.ts`, is in a canvas shape that ahpc does not read.

### Runtime path

```
steer(uri, text) -> chat/pendingMessageSet kind steering -> the 1.1.0 Mirror reducer -> chat.queuedMessages gains { id, kind: 'steering', message }
  -> queued(chat) -> QueuedMessage[] -> the queue the screen and `ahpc prompt` show
unqueue(uri, id) -> chat/pendingMessageRemoved kind queued -> the 1.1.0 reducer removes only an entry with that id and that kind
```

### Gaps

- A VS Code host on 1.1.0 already keeps steering entries in `queuedMessages`.
  It sends the same state to a client that negotiated 1.0.0.
  Thus ahpc on the 1.0.0 package shows a pending steering message from a snapshot as a queued message now.
- With the 1.1.0 package and no other change, a steering message from any host shows as a queued message.
- `unqueue` on that message does nothing, because the reducer matches `kind` and `unqueue` always sends `queued`.
- No test feeds `queued()` an entry with `kind: 'steering'`.
- 1.1.0 adds this state, which ahpc does not draw:
  - per-chat config: `ChatState.config`, `chat/configChanged` and `chatMutable`
  - `chat/moved`, with a chat's own `provider`
  - `SessionModelInfo.vendor`
  - `startedAt` and `duration` on a reasoning part
  - `multipleChatProviders`
  - `HostEnvironment.pathStyle`
  - a changeset file's `status` and `nonce`
- 1.1.0 adds two experimental surfaces: windowed delivery (`channel/frame`, `channel/credit`, `channel/snapshot`) and the TCP channel (`tcp/data`, `tcp/eof`, `tcp/reset`). Windowed delivery is a client offer per subscription, and ahpc offers none, so its subscriptions keep ordinary delivery.
- `deno.lock` pins the package at 1.0.0.
- `README.md:8`, `docs/CONFORMANCE.md:8-11` and the module comment at `src/ahp/live.ts:41` say 1.0.0.
- The domain reference [00-ahp.md](../00-ahp.md) names `npm://@microsoft/agent-host-protocol@^0.9.0`, which was stale before this plan.

## Answers

| What | Source | Task |
| --- | --- | --- |
| Take `@microsoft/agent-host-protocol@^1.1.0` | Softov, 2026-11-15: "We need a plan to update ahpc @microsoft/agent-host-protocol to 1.1.0." | 02 |
| `VERSIONS` is `['1.1.0', '1.0.0', '0.10.0', '0.9.0', '0.8.0', '0.7.0']` | (defaulted: 1.1.0 first and every version offered today kept for older hosts, as [plan 05](../05-protocol-1-0-0/plan.md) did) | 02 |
| `queued()` lists only an entry whose `kind` is `queued` or absent; a steering entry is not listed | (defaulted: ahpc draws no pending steering message today, and the 1.1.0 reducer reads an absent `kind` as `queued`) | 01 |
| The steering filter lands before the package, so no commit lists a steering message as queued | (defaulted: the filter also fixes a bug that is present now, because a VS Code host on 1.1.0 sends steering entries in `queuedMessages` to a client at 1.0.0) | 01 |
| `deno.lock` is regenerated with `deno`, not by hand | (defaulted: `deno` is installed at `~/.deno/bin/deno` now; [plan 05's implemented.md](../05-protocol-1-0-0/implemented.md) left it stale because it was not) | 02 |
| Drawing what 1.1.0 adds, windowed delivery and the TCP channel are later plans | (defaulted: this plan moves the wire, as plan 05 did; ahpd plan 117 leaves the two experimental surfaces out too) | - |

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - A steering message is not listed as queued](task-01-a-steering-message-is-not-queued.md) | todo | - |
| [02 - Take 1.1.0 and offer it first](task-02-take-1-1-0.md) | todo | 01 |

## Risks and tradeoffs

- ahpd on its 1.0.0 package answers a `1.1.0` offer with `1.1.0` - ahpc reads no changed field, and lists no steering message from either version.
- A VS Code host on 1.1.0 can send `chat/configChanged` and `chat/moved` - the 1.1.0 `Mirror` reduces both, and nothing in ahpc reads the result yet.
- A host on 1.0.0, 0.10.0 or older still settles on its own version - nothing ahpc sends is 1.1.0-only.

## Resume state

- **Done so far:** nothing. The trial in *Searches performed* ran in a scratch worktree that was removed.
- **Next action:** [task-01-a-steering-message-is-not-queued.md](task-01-a-steering-message-is-not-queued.md).
- **Open questions:** none; every row in *Answers* is defaulted except the first, and the user may erase any of them.
- **Watch out for:** `VERSIONS` is in preference order, and `0.10.0` stays right behind `1.0.0`, as [plan 08](../08-a-vs-code-1-141-host-is-reached-at-0-10-0/plan.md) says.

## Final verification checklist

- [ ] An `initialize` offers `1.1.0, 1.0.0, 0.10.0, 0.9.0, 0.8.0, 0.7.0`.
- [ ] A chat with a steering entry and a queued entry in `queuedMessages` lists only the queued one.
- [ ] `npm run typecheck` and `npm test` pass; `tools/ahp.strict.schema.json` is regenerated from 1.1.0.
- [ ] `package-lock.json` and `deno.lock` both pin 1.1.0.
- [ ] `README.md`, `docs/CONFORMANCE.md`, `src/ahp/live.ts` and `00-ahp.md` say 1.1.0.
