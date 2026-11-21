---
title: A running call shows the ctrl+b key while it can move
created: 2026-11-21
refs:
  - git://b2e9df837 - ahpc main after PR #44, which binds ctrl+b to the move
  - file:///github/ahpc/.project/ideas/a-running-call-moves-to-the-background-with-ctrl-b.md - the brief that chose ctrl+b
  - file:///github/ahpc/.project/plans/ahp/20261121-0639-a-running-call-moves-to-the-background/implemented.md - the built plan, which left the hint for later
---

The running view's key line lists the keys a person can press, such as `ctrl+c stop`.
`ctrl+b` moves a running call to the background, but nothing on screen shows it, so a person has to read the docs to find it.
The idea: show `ctrl+b` in the key line, with a label such as "background", while the selected chat has a call that can move.

Open points before a plan:

- Show it only while a movable call is running, so the key line never offers a key that does nothing. This needs the line to follow the active turn as calls start, finish and stop being movable.
- Show it always while a turn runs. Simpler, but the key does nothing when an approval is waiting or the call has finished.
- A key line in a worker chat's view would need the same check on that chat's calls.
