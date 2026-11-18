---
title: A connect token the tunnel refuses is reported as the host's token
status: open
date: 2026-11-18
severity: minor
refs:
  - "[code://src/ahp/refused.ts](../../src/ahp/refused.ts) - `whyNoConnection` reads every 401 as the host refusing the connection token"
  - "[code://src/ahp/tunnel.ts](../../src/ahp/tunnel.ts) - `tunnelRefused`, the sentence for a refused connect token, used for a redirect only"
---

## Symptom

`--tunnel-token <token>x` against a private tunnel prints `The host at tunnel:<id>.<cluster> refused the connection token.`
The token the tunnel refused is the connect token, so the sentence sends the person to the wrong token.
Step 8 of [a-tunnel-host-is-reached-by-address.md](../pending/a-tunnel-host-is-reached-by-address.md) showed it on 2026-11-18.

## Cause

The tunnel answers a connect token it cannot accept with a bare `401`: no body and no `WWW-Authenticate`.
`whyNoConnection` turns a tunnel's redirect into `tunnelRefused`, and a `401` into the host's sentence, whoever sent it.
A good connect token reaches the host, which answers the same probe with `426`.

## Impact

A person with an expired or mistyped connect token is told to check the host's token. ahpc still stops at once.

## Workaround

None.

## Fix

- Through a tunnel with a connect token sent, read a `401` with no body as the tunnel refusing it, and say `tunnelRefused`.
- Or probe once more without the connect token: a `302` to a sign-in then means the tunnel, and a `401` the host.
