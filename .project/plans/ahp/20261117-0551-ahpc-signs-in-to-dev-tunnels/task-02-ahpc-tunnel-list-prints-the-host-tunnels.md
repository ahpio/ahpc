---
title: ahpc tunnel list prints the host tunnels
status: done
depends:
  - task-01-ahpc-tunnel-login-keeps-a-sign-in.md
layer: "ahp"
refs:
  - "[code://src/ahp/live.ts#L543-L580](../../../../src/ahp/live.ts#L543-L580) - `load()`, the pattern for a package loaded on demand and a sentence when it is missing"
  - "[code://package.json](../../../../package.json) - the dependencies"
  - npm://@microsoft/dev-tunnels-management@1.3.61 - `TunnelManagementHttpClient`, `listTunnels`
  - npm://@microsoft/dev-tunnels-contracts@1.3.61 - the `Tunnel` shape
  - file:///github/externals/vscode/src/vs/platform/agentHost/common/tunnelAgentHost.ts - VS Code `1564f100807a`: `vscode-server-launcher`, `protocolv`, and the display name rule
  - https://github.com/TylerLeonhardt/ahpx/blob/056d44e72/src/tunnel/discovery.ts - `listAgentHostTunnels`
---

## Objective

`ahpc tunnel list` prints the signed-in account's tunnels that VS Code would list: name, `<id>.<cluster>`, and whether the host is online.
The Dev Tunnels packages are dependencies of ahpc and load only for a tunnel command or a signed-in connection.

## Files

- `UPDATE: package.json` - `@microsoft/dev-tunnels-management` and `@microsoft/dev-tunnels-contracts` at `^1.3.61`.
- `UPDATE: package-lock.json` - written by `npm i`.
- `UPDATE: deno.lock` - written by `deno install`.
- `UPDATE: src/ahp/devtunnels.ts` - `management()`, which loads the packages on demand, and `hostTunnels()`.
- `UPDATE: src/cli/main.ts` - `tunnel list`, with `--json`, and its usage line.
- `UPDATE: test/devtunnels.test.ts` - the label filter, the display name and the rows, with the client stubbed.

## Steps

1. Run `npm i @microsoft/dev-tunnels-management@^1.3.61 @microsoft/dev-tunnels-contracts@^1.3.61`.
2. Run `deno install`, and check that `git diff deno.lock` adds only these packages and theirs.
3. In `src/ahp/devtunnels.ts`, export `management(token)`, which imports both packages as `load()` does in `live.ts`.
4. Give it the user agent `ahpc` and the token callback `github <token>`.
5. When an import fails, throw a sentence that names `npm install @microsoft/dev-tunnels-management @microsoft/dev-tunnels-contracts`.
6. Export `hostTunnels()`, which calls `signedIn()` and stops with "Sign in with ahpc tunnel login." when there is none.
7. Call `listTunnels` with `labels: ['vscode-server-launcher']` and `includePorts: true`.
8. Keep a tunnel only when it has a `protocolv<N>` label with `N` of 5 or more.
9. Take as the name the first label that VS Code's display rule allows.
10. Skip `vscode-server-launcher`, each label that starts with `_`, and each `protocolv<N>` label.
11. Read online from `status.hostConnectionCount`, as a number or as `{ current }`.
12. In `src/cli/main.ts`, print one row per tunnel: name, address and online.
13. Print the rows as JSON with `--json`.
14. In `test/devtunnels.test.ts`, stub `management` with three tunnels, one without the launcher label and one at `protocolv4`.
15. Assert that the command prints one row, with its name and `<id>.<cluster>`.

## Validation

- `npx vitest run test/devtunnels.test.ts` passes.
- `npm run typecheck` and `npm test` pass, and the tests import no Dev Tunnels package.
- By hand: after `ahpc tunnel login`, `ahpc tunnel list` shows the tunnel ahpd hosts.

## Resume
