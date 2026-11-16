---
title: ahpc runs at protocol 1.1.0 against a VS Code host
---

# ahpc runs at protocol 1.1.0 against a VS Code host

Plan [ahp/20261115-0721-protocol-1-1-0](../plans/ahp/20261115-0721-protocol-1-1-0/plan.md) offers `1.1.0` first, and no test reaches a real host on 1.1.0.
This check needs a VS Code whose agent host is on protocol 1.1.0, such as an Insiders build from 2026-11-10 or later.
The local `code` 1.132.1 is too old for it.

## Set up

1. In the ahpc checkout, on the plan's branch, run `npm install` and `npm run build`.
2. Make an empty folder `<scratch>`.
3. Write a token with `openssl rand -hex 16 > <scratch>/token`.
4. Start the host with `code-insiders agent --host 127.0.0.1 --port 9314 --connection-token-file <scratch>/token --replace`.

## Steps

1. Run `node <ahpc>/dist/src/main.js --host ws://127.0.0.1:9314 --connection-token-file <scratch>/token --wire <scratch>/wire.jsonl session list`.
2. Run `grep -m1 protocolVersion <scratch>/wire.jsonl`.

## Pass and fail

- Pass: step 1 prints the session list, and the line from step 2 holds `"protocolVersion":"1.1.0"`.
- Fail: the line holds `1.0.0` or `0.10.0`, or step 1 prints a refusal of the offered versions.
