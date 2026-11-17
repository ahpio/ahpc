---
title: The docs say how to reach a tunnel
status: todo
depends:
  - task-03-a-refused-tunnel-stops-and-says-how.md
layer: "docs"
refs:
  - "[code://docs/start/CONNECT.md](../../../../docs/start/CONNECT.md) - the connection guide; *A host on another machine* is where a tunnel belongs"
  - "[code://docs/reference/CLI.md](../../../../docs/reference/CLI.md) - the flag list"
  - "[code://docs/reference/ENVIRONMENT.md](../../../../docs/reference/ENVIRONMENT.md) - the variable table"
---

## Objective

The docs say how to reach a host behind a Dev Tunnel.
They name the address, the person's own token, and a connect token from the tunnel's owner.

## Files

- `UPDATE: docs/start/CONNECT.md` - a subsection *A host behind a Dev Tunnel* under *A host on another machine*.
- `UPDATE: docs/reference/CLI.md` - `--host tunnel:<id>.<cluster>` and `--tunnel-token`.
- `UPDATE: docs/reference/ENVIRONMENT.md` - a row for `AHPC_TUNNEL_TOKEN`.

## Steps

1. In `docs/start/CONNECT.md`, add *A host behind a Dev Tunnel* under *A host on another machine*.
2. Say that `tunnel:<id>.<cluster>` reaches the port URL, and that the id and the cluster are in that URL.
3. Say that an anonymous tunnel still needs the person's own token for the host.
4. Say that a private tunnel takes a connect token from `devtunnel token <id> --scopes connect`, through `--tunnel-token` or `AHPC_TUNNEL_TOKEN`.
5. Say that a connect token lasts 24 hours, and that ahpc stops when it has expired.
6. Add `--tunnel-token` to `docs/reference/CLI.md` beside `--token`.
7. Add `AHPC_TUNNEL_TOKEN` to `docs/reference/ENVIRONMENT.md`, and say that `--tunnel-token` wins over it.
8. Keep each file's own wrap and style.

## Validation

- `rg -n "tunnel" docs/start/CONNECT.md docs/reference/CLI.md docs/reference/ENVIRONMENT.md` finds each new part.
- `npm run docs:build` passes.

## Resume
