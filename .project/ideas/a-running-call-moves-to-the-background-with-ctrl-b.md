---
title: A running call moves to the background with ctrl+b
created: 2026-11-21
refs:
  - git://3becde6 - ahpc main after the plan PR #42 that plans this key
  - file:///github/ahpd/.project/plans/host/20261121-0824-a-running-call-moves-to-the-background/plan.md - ahpd serves the move, built in PR #407
  - file:///github/ahpc/.project/plans/ahp/20261121-0639-a-running-call-moves-to-the-background/plan.md - the plan this brief asks the key for
---

A foreground call in a chat can move to the background, as Claude Code's Ctrl+B does.
ahpd marks such a call with `ahpd.backgroundToolCall: true`, and `x-ahpd/backgroundToolCall` moves it.
The move says the turn goes on, and the work shows as a row in the session's background work.

The idea: a key moves the selected running call that is movable.
The key is `ctrl+b`, which ahpc does not bind today, so nothing needs to be moved to make room.

Decided: `ctrl+b` is the default, the key people already know from Claude Code. It can be changed later in ahpc's config.

Open points before the plan:

- Inside tmux, `ctrl+b` is tmux's own prefix, so a person there would not reach ahpc with it. Accepted for now; the config key is the way out.
- The key hint shows only while the selected call is movable, and only in the running view.
- A call in a worker chat moves in that chat, not in the lead chat.
