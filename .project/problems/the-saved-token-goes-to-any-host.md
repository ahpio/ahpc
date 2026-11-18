---
title: The saved token goes to any host
status: open
date: 2026-11-18
severity: major
refs:
  - "[code://src/config.ts#L195-L207](../../src/config.ts#L195-L207) - `connectionToken`, which falls back to the file's `token` when no flag names one"
  - "[code://src/cli/main.ts#L283](../../src/cli/main.ts#L283) - the host comes from `--host`, `AHPC_HOST` or the file, apart from the token"
  - "[code://src/ahp/tunnel.ts#L117-L120](../../src/ahp/tunnel.ts#L117-L120) - `wayIn`, which goes anonymous with any token it is given"
---

## Symptom

On 2026-11-18, `ahpc --host tunnel:giant-ant-5q89765.brs session list` listed the sessions of Softov's daemon through its anonymous Dev Tunnel, with no `--token`.
The config file names the host `ws://200.11.121.81:37537` and a `token` for it.
ahpc sent that token to the tunnel host, and went the anonymous way because it held one.
The daemon was right to admit it: the same tunnel refused no token and the derived token with `401`.

## Cause

`connectionToken` returns the file's `token` when neither `--token` nor `--connection-token-file` is given.
It does not compare the host in use with the host the file names, so the token goes to whatever `--host` or `AHPC_HOST` says.

## Impact

A person who points ahpc at another person's host or tunnel hands that host the token for their own daemon.
The token is a credential: whoever holds it reaches the daemon it was made for.

## Workaround

Pass `--token` or `--connection-token-file` for any host other than the one the config file names.

## Fix

No fix is chosen.
One way: the file's `token` and `connectionTokenFile` go only to the host the file names.
Any other host gets only a token that a flag or a variable gives.
