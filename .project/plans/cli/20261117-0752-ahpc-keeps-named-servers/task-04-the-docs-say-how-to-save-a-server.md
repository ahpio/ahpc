---
title: The docs say how to save a server
status: todo
depends:
  - task-03-server-health-is-checked.md
layer: "docs"
refs:
  - "[code://docs/start/CONNECT.md](../../../../docs/start/CONNECT.md) - the connection guide; *The host* says where the host is read from"
  - "[code://docs/reference/CONFIG-FILE.md](../../../../docs/reference/CONFIG-FILE.md) - the `host` key"
  - "[code://docs/reference/ENVIRONMENT.md](../../../../docs/reference/ENVIRONMENT.md) - the `AHPC_HOST` row"
  - "[code://docs/reference/CLI.md](../../../../docs/reference/CLI.md) - built from the usage text, so tasks 01 to 03 already change it"
---

## Objective

The docs say how to save a server, pick it by name, make it the default, and check it.

## Files

- `UPDATE: docs/start/CONNECT.md` - a section *Saved servers*, after *A host on another machine*.
- `UPDATE: docs/reference/CONFIG-FILE.md` - the `host` key takes a saved server's name.
- `UPDATE: docs/reference/ENVIRONMENT.md` - `AHPC_HOST` takes a saved server's name.

## Steps

1. In `docs/start/CONNECT.md`, add *Saved servers* after *A host on another machine*.
2. Show `ahpc server add`, `ahpc server list`, and `ahpc --host <name>`.
3. Say that, with no `--host`, `AHPC_HOST` or config `host`, ahpc reaches the default server.
4. Say that `servers.json` is beside `config.json`, has mode `0600`, and holds the tokens.
5. Say that `--connection-token-file` saves a path in place of a token.
6. Show `ahpc server status`, and say what `healthy`, `degraded` and `unreachable` mean.
7. In *The host*, add the default server to the order.
8. In `docs/reference/CONFIG-FILE.md`, say that `host` takes a saved server's name.
9. In `docs/reference/ENVIRONMENT.md`, say that `AHPC_HOST` takes a saved server's name.
10. Keep each file's own wrap and style.

## Validation

- `rg -n "server add|servers.json" docs/start/CONNECT.md` finds the new section.
- `npm run docs:build` passes, and the CLI page shows the *Servers* group.

## Resume
