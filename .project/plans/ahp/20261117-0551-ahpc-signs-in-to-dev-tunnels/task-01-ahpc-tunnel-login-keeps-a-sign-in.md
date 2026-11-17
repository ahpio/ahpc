---
title: ahpc tunnel login keeps a sign-in
status: done
depends: []
layer: "ahp"
refs:
  - "[code://src/config.ts#L92-L100](../../../../src/config.ts#L92-L100) - `statePath`"
  - "[code://src/update.ts#L105-L118](../../../../src/update.ts#L105-L118) - the state file pattern"
  - "[code://src/flags.ts#L26-L33](../../../../src/flags.ts#L26-L33) - `COMMANDS`, which gains `tunnel`"
  - "[code://src/cli/main.ts#L36-L80](../../../../src/cli/main.ts#L36-L80) - the usage text"
  - https://github.com/ahpio/ahpd/blob/acc5b9b9c/packages/tunnel-devtunnel/src/adapter.ts - the client id, the scope, the device code and token URLs, and the refresh
---

## Objective

`ahpc tunnel login` signs in to the Dev Tunnels GitHub app by a device code, and keeps the token pair in `tunnel.json` with mode `0600`.
`ahpc tunnel logout` removes the file.
`signedIn()` gives a token that is not expired, refreshing it first when it is.

## Files

- `CREATE: src/ahp/devtunnels.ts` - the client id, the scope, `login`, `logout`, `signedIn` and the refresh.
- `UPDATE: src/config.ts:100` - `writePrivate(path, text)`, a file with mode `0600` written through a temporary file and a rename.
- `UPDATE: src/flags.ts:26-33` - `tunnel` joins `COMMANDS`.
- `UPDATE: src/cli/main.ts` - `tunnel login` and `tunnel logout`, and their usage lines.
- `CREATE: test/devtunnels.test.ts` - the device flow, the file and its mode, the refresh and the logout, with `fetch` stubbed.

## Steps

1. In `src/ahp/devtunnels.ts`, export `CLIENT_ID = 'Iv1.e7b89e013f801f03'` and `SCOPE = 'tunnels'`, with a comment naming ahpd's `adapter.ts`.
2. Export `signInPath()`, which is `statePath('ahpc', 'tunnel.json')`.
3. Export `login(say)`, which posts to `https://github.com/login/device/code` with the client id and the scope.
4. Pass the user code and the verification URL to `say`, so the command prints them.
5. Poll `https://github.com/login/oauth/access_token` at the interval GitHub gives, and slow down on `slow_down`.
6. Read the account from `https://api.github.com/user` with the new token.
7. In `src/config.ts`, export `writePrivate(path, text)`: make the folder, write a temporary file with mode `0600`, and rename it.
8. Write `{ account, token, refreshToken, expiresAt }` to `signInPath()` with `writePrivate`.
9. Export `logout()`, which removes `signInPath()` and says whether there was a sign-in.
10. Export `signedIn()`, which reads the file and returns `undefined` when there is none.
11. When the token expires within a minute, refresh it with `grant_type=refresh_token`, write the new pair, and return the new token.
12. In `src/cli/main.ts`, add `tunnel login` and `tunnel logout`, and print the account after a login.
13. Add both to the usage text under a new *Tunnels* group.
14. In `test/devtunnels.test.ts`, stub `fetch` with the GitHub answers, and set `XDG_CONFIG_HOME` to a temporary folder.
15. Assert the file's contents and that its mode is `0600`.
16. Assert that `signedIn` refreshes an expired token and writes the new pair.
17. Assert that `logout` removes the file.

## Validation

- `npx vitest run test/devtunnels.test.ts` passes.
- `npm run typecheck` and `npm test` pass.
- By hand: `ahpc tunnel login` prints a code and a URL, and `stat -c %a ~/.config/ahpc/tunnel.json` prints `600` after the sign-in.

## Resume
