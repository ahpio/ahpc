---
title: The docs say how to reach a tunnel
status: todo
depends:
  - task-03-a-refused-tunnel-stops-and-says-how.md
layer: "docs"
refs:
  - "[code://docs/start/CONNECT.md](../../../../docs/start/CONNECT.md) - the connection guide; *A host on another machine* is where a tunnel belongs"
  - "[code://src/cli/main.ts#L174-L182](../../../../src/cli/main.ts#L174-L182) - the usage text's *The host* group; the CLI page is built from it"
  - "[code://docs/reference/ENVIRONMENT.md](../../../../docs/reference/ENVIRONMENT.md) - the variable table"
---

## Objective

The docs say how to reach a host behind a Dev Tunnel.
They name the address, the person's own token, and a connect token from the tunnel's owner.

## Files

- `UPDATE: docs/start/CONNECT.md` - a subsection *A host behind a Dev Tunnel* under *A host on another machine*.
- `UPDATE: src/cli/main.ts:174-182` - the `--host` line names `tunnel:<id>.<cluster>`; the CLI page is built from this text.
- `UPDATE: docs/reference/ENVIRONMENT.md` - a row for `AHPC_TUNNEL_TOKEN`.

## Steps

1. In `docs/start/CONNECT.md`, add *A host behind a Dev Tunnel* under *A host on another machine*.
2. Say that `tunnel:<id>.<cluster>` reaches the port URL, and that the id and the cluster are in that URL.
3. Say that an anonymous tunnel still needs the person's own token for the host.
4. Say that a private tunnel takes a connect token from `devtunnel token <id> --scopes connect`, through `--tunnel-token` or `AHPC_TUNNEL_TOKEN`.
5. Say that a connect token lasts 24 hours, and that ahpc stops when it has expired.
6. In the usage text, add `tunnel:<id>.<cluster>` to the `--host` line.
7. Add `AHPC_TUNNEL_TOKEN` to `docs/reference/ENVIRONMENT.md`, and say that `--tunnel-token` wins over it.
8. Keep each file's own wrap and style.

## Validation

- `rg -n "tunnel" docs/start/CONNECT.md docs/reference/ENVIRONMENT.md src/cli/main.ts` finds each new part.
- `npm run docs:build` passes, and the CLI page shows `tunnel:` and `--tunnel-token`.

## Resume
