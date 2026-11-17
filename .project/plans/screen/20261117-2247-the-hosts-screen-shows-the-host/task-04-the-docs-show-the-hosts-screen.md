---
title: The docs show the hosts screen
status: todo
depends:
  - task-03-the-agents-open-their-models.md
layer: "docs"
refs:
  - "[code://docs/use/SCREEN.md](../../../../docs/use/SCREEN.md) - *Moving between screens*, the table of screens"
  - "[code://docs/use/SESSION.md](../../../../docs/use/SESSION.md) - the sibling page for one screen"
  - "[code://docs/.vitepress/config.mts#L35](../../../../docs/.vitepress/config.mts#L35) - the sidebar's pages under *Use*"
  - "[code://tools/pictures.mjs](../../../../tools/pictures.mjs) - `npm run docs:pictures`, which draws each screen from ahpd's demo host"
---

## Objective

`docs/use/HOST.md` says what the hosts screen shows and which keys it takes, with a picture of it.
*Moving between screens* names it.

## Files

- `CREATE: docs/use/HOST.md` - the page: how to open it, its sections, its keys, and its picture.
- `UPDATE: docs/use/SCREEN.md` - a row for the hosts screen in *Moving between screens*.
- `UPDATE: docs/.vitepress/config.mts:35` - the page in the sidebar under *Use*.
- `UPDATE: tools/pictures.mjs` - a picture of the hosts screen.
- `CREATE: docs/img/host.svg` - the picture, drawn by `npm run docs:pictures`.

## Steps

1. Write `docs/use/HOST.md`: **Show hosts** in the palette opens the screen.
2. List the sections in a table, each with what it shows.
3. Say that the screen leaves out a section the host sent nothing for.
4. List the keys in a table: the arrows, Enter, a click, `n`, `pageup`, `pagedown` and `esc`.
5. Add the row `Host | **Show hosts** in the palette` to *Moving between screens*.
6. Add the page to the sidebar after *Session*.
7. In `tools/pictures.mjs`, draw the hosts screen with `--command hosts.show` into `docs/img/host.svg`.
8. Run `npm run docs:pictures` with `AHPD_DIR` set, and put the picture in the page.

## Validation

- `npm run docs:build` passes, and the sidebar shows the page.
- `docs/img/host.svg` shows the demo host's sections.
- `node ~/.claude/skills/do-spec/scripts/lint-prose.mjs docs/use/HOST.md` passes.

## Resume
