---
title: Set up a test host for the checks by hand
---

# Set up a test host for the checks by hand

The checks in this folder run ahpc against a test ahpd with its own token, folder and port.
Everything here runs on the Linux machine, the one with `/github/ahpc` and `/github/ahpd`.

## Steps

1. Run `cd /github/ahpd && git switch main && git pull && pnpm install && pnpm build`.
2. Run `cd /github/ahpc && git switch main && git pull && npm install && npm run build`.
3. Run `bash /github/ahpc/.project/pending/test-host.sh`.
4. Paste the two `export` lines it prints into the terminal you check in.

## Pass and fail

- Pass: step 3 prints `host on ws://127.0.0.1:9313` and the two `export` lines, and `$AHPC session list` answers.
- Fail: step 3 waits 30 s and prints no session; read `/tmp/ahpc-check/host.log`.

## When done

- Run `bash /github/ahpc/.project/pending/test-host.sh stop`. It stops the host and removes `/tmp/ahpc-check`.
