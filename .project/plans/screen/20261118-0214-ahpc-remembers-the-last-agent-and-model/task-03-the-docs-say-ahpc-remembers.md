---
title: The docs say ahpc remembers
status: todo
depends:
  - task-02-a-new-session-starts-from-it.md
layer: "docs"
refs:
  - "[code://docs/use/NEW-SESSION.md](../../../../docs/use/NEW-SESSION.md) - *The agent*, where the first chip is described"
  - "[code://docs/reference/CONFIG-FILE.md](../../../../docs/reference/CONFIG-FILE.md) - the table of config keys"
  - "[code://docs/start/CONFIGURE.md](../../../../docs/start/CONFIGURE.md) - where the update check's two switches are listed"
---

## Objective

The new-session page says that a new session starts with the last agent, model and options on that host, and how to turn it off.

## Files

- `UPDATE: docs/use/NEW-SESSION.md` - a paragraph under *The agent*.
- `UPDATE: docs/reference/CONFIG-FILE.md` - the `rememberChoices` row.
- `UPDATE: docs/start/CONFIGURE.md` - `--no-remember` and `"rememberChoices": false`.

## Steps

1. Under *The agent*, say that a new session takes the agent, model and options last used on that host.
2. Say that a value the host no longer offers falls back to the host's own.
3. Add the `rememberChoices` row, with `--no-remember` as its flag.
4. Add both ways to turn it off where `CONFIGURE.md` lists the update check's.

## Validation

- `npm run docs:build` passes.
- `node ~/.claude/skills/do-spec/scripts/lint-prose.mjs docs/use/NEW-SESSION.md` passes.

## Resume
