---
title: Servers are saved by name
status: todo
depends: []
layer: "cli"
refs:
  - "[code://src/config.ts#L100-L101](../../../../src/config.ts#L100-L101) - `statePath`, where `servers.json` goes"
  - "[code://src/config.ts#L159-L175](../../../../src/config.ts#L159-L175) - `connectionToken` refuses `--token` with `--connection-token-file`"
  - "[code://src/cli/main.ts#L465-L475](../../../../src/cli/main.ts#L465-L475) - `config`, answered before any connection, with `--json`"
  - "[code://src/flags.ts#L26-L64](../../../../src/flags.ts#L26-L64) - `COMMANDS` and `SWITCHES`"
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/config/connections.ts - `add`, `remove`, `setDefault` and the rules they check
---

## Objective

`ahpc server add`, `list`, `remove` and `default` keep named servers in `servers.json`, with mode `0600`.
No command here opens a connection.

## Files

- `CREATE: src/servers.ts` - the server shape, `serversPath`, `readServers`, `addServer`, `removeServer`, `setDefault`, and the name and address rules.
- `UPDATE: src/flags.ts:26-64` - `server` joins `COMMANDS`, and `--default` joins `SWITCHES`.
- `UPDATE: src/cli/main.ts:465` - `server add`, `list`, `remove` and `default`, answered before any connection, and their usage lines.
- `CREATE: test/servers.test.ts` - the file, its mode, the rules and the four commands, with `XDG_CONFIG_HOME` in a temporary folder.

## Steps

1. In `src/servers.ts`, export `interface Server { name; address; token?; tokenFile?; default?; tags? }`.
2. Export `serversPath()`, which is `statePath('ahpc', 'servers.json')`.
3. Export `readServers()`, which returns `[]` when the file is missing.
4. Make `readServers()` throw a sentence that names the file when it is not JSON or has no `servers` list.
5. Export `isAddress(value)`, true for a value that starts with `ws://`, `wss://` or `tunnel:`.
6. Export `addServer(server)`, which refuses a name with `:` or `/`, and a saved name.
7. Make `addServer` refuse an address for which `isAddress` is false.
8. When the new server is the default, clear `default` on every other server.
9. Write `{ servers }` with `writePrivate` from `src/config.ts`.
10. Export `removeServer(name)`, which returns the removed server or `undefined`.
11. Export `setDefault(name)`, which refuses a name that is not saved.
12. Add `server` to `COMMANDS` and `--default` to `SWITCHES`.
13. In `cli`, answer `server add`, `list`, `remove` and `default` before `connect`, as `config` is.
14. In `server add`, refuse `--url` with `--tunnel`, and refuse neither.
15. Save `--tunnel <id>` as the address `tunnel:<id>`.
16. Refuse `--token` with `--connection-token-file`, and save the file as an absolute path.
17. Save every `--tag`, and print the saved server without its token.
18. In `server list`, print the name, the address, `*` for the default, and the tags.
19. Print `saved`, `file` or `none` for the token.
20. Show only the servers with every `--tag` given.
21. With `--json`, print the same fields as a list, with no token.
22. With an empty file, print `No saved servers. Add one with ahpc server add <name> --url <address>.`
23. In `server remove`, say when the removed server was the default, and refuse a name that is not saved.
24. Add a *Servers* group to the usage text, after *The host*, with `add`, `list`, `remove` and `default`.
25. In `test/servers.test.ts`, assert that `server add` writes the file with mode `0600`.
26. Assert the refusals: a name with `:`, a saved name, `--url` with `--tunnel`, and `--token` with `--connection-token-file`.
27. Assert that a second `--default` clears the first, and that `server default` moves it.
28. Assert that a broken `servers.json` stops `server add` and stays as it was.
29. Assert that `server list --json` prints no token.

## Validation

- `npx vitest run test/servers.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- By hand: `ahpc server add home --url ws://127.0.0.1:9187 --token t --default`, then `stat -c %a ~/.config/ahpc/servers.json` prints `600`.

## Resume
