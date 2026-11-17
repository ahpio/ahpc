---
title: A host is picked by its name
status: todo
depends:
  - task-01-servers-are-saved-by-name.md
layer: "cli"
refs:
  - "[code://src/config.ts#L159-L175](../../../../src/config.ts#L159-L175) - `connectionToken`, which `chosenHost` wraps"
  - "[code://src/cli/main.ts#L261-L278](../../../../src/cli/main.ts#L261-L278) - `where` reads the host and the token"
  - "[code://src/tui.tsx#L436-L458](../../../../src/tui.tsx#L436-L458) - the screen reads them the same way"
  - "[code://src/cli/main.ts#L174-L182](../../../../src/cli/main.ts#L174-L182) - the usage text's *The host* group"
---

## Objective

`--host`, `AHPC_HOST` and the config file's `host` take a saved server's name.
With none of them, the default server is the host.
Both front ends pick the host and its token through one function.

## Files

- `UPDATE: src/servers.ts` - `chosenHost(said, file)`, the host and its token in Softov's order.
- `UPDATE: src/cli/main.ts:261-278` - `where` calls `chosenHost`.
- `UPDATE: src/tui.tsx:436-458` - the screen calls `chosenHost`.
- `UPDATE: src/cli/main.ts:174-182` - the `--host` line says it takes a saved server's name.
- `UPDATE: test/servers.test.ts` - the order, the token, and a name that is not saved.

## Steps

1. In `src/servers.ts`, export `chosenHost(said, file)`, where `said` holds `host`, `token` and `tokenFile`.
2. Take the host from `said.host`, then `AHPC_HOST`, then `file.host`.
3. With none, take the default server's name, and with no default, return no host.
4. When the host is not an address, look it up by name.
5. For a name that is not in the file, throw `No saved server is called <name>. List them with ahpc server list.`
6. For a saved server, return its address as the host.
7. Take the token from `said.token`, `said.tokenFile`, then `AHPC_TOKEN`.
8. With none of them, take the saved server's `token`, then its `tokenFile`, and never the config file's token.
9. For a host that is an address, return `connectionToken(said, file)` as today.
10. In `where`, replace the host and token lines with one `chosenHost` call, and turn its error into a `Fault`.
11. In the screen, replace the host and token lines with `chosenHost`, and print its error as today.
12. In the usage text, say that `--host` takes a saved server's name.
13. In `test/servers.test.ts`, assert that `--host` wins over `AHPC_HOST`, the config file and the default.
14. Assert that the config file's `host` wins over the default server.
15. Assert that a saved server's token replaces the config file's token, and that `AHPC_TOKEN` wins over both.
16. Assert that a name that is not saved throws the sentence.

## Validation

- `npx vitest run test/servers.test.ts test/cli.test.ts test/tokens.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- `rg -n "process.env.AHPC_HOST" src` finds only `src/servers.ts`.

## Resume
