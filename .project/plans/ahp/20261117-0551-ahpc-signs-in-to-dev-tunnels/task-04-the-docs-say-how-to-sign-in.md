---
title: The docs say how to sign in to a tunnel
status: done
depends:
  - task-03-a-private-tunnel-is-reached-signed-in.md
layer: "docs"
refs:
  - "[code://docs/start/CONNECT.md](../../../../docs/start/CONNECT.md) - plan A's subsection *A host behind a Dev Tunnel*"
  - "[code://docs/reference/CONFIG-FILE.md](../../../../docs/reference/CONFIG-FILE.md) - the config keys"
---

## Objective

The docs say how to sign in to Dev Tunnels, list the host tunnels, and pick the way in.

## Files

- `UPDATE: docs/start/CONNECT.md` - the sign-in, `tunnel:<id>`, and how another person gets access.
- `UPDATE: docs/reference/CONFIG-FILE.md` - the `tunnelAccess` key.

## Steps

1. In *A host behind a Dev Tunnel*, add `ahpc tunnel login` and `ahpc tunnel list`.
2. Say that `tunnel:<id>` works after a sign-in, and `tunnel:<id>.<cluster>` works without one.
3. Name the file that holds the sign-in, and say that `ahpc tunnel logout` removes it.
4. Say that another person needs access from the tunnel's owner, such as `devtunnel access create <id> --org <org>`.
5. Say what `auto`, `anonymous` and `signed-in` do.
6. Add `tunnelAccess` to `docs/reference/CONFIG-FILE.md`, with `auto` as the default.
7. Keep each file's own wrap and style.

## Validation

- `rg -n "tunnel login|tunnelAccess" docs` finds each new part.
- `npm run docs:build` passes, and the CLI page shows the three commands and `--tunnel-access`.

## Resume
