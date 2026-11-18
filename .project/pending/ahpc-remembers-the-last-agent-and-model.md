---
title: A new session starts with the last agent, model and effort on a host
---

# A new session starts with the last agent, model and effort on a host

Plan [screen/20261118-0214-ahpc-remembers-the-last-agent-and-model](../plans/screen/20261118-0214-ahpc-remembers-the-last-agent-and-model/plan.md) keeps the choice in `choices.json`, and the tests use the scripted host only.
ahpc runs on the Linux machine. The host is VS Code's tunnel, on the Windows machine, because it offers several agents.

## Set up

1. On the Linux machine, run `cd /github/ahpc && git switch main && git pull && npm install && npm run build`.
2. On the Linux machine, run `node /github/ahpc/dist/src/main.js tunnel list`, and note VS Code's address, `tunnel:<id>.<cluster>`.

## Steps

All the commands run on the Linux machine.

1. Run `node /github/ahpc/dist/src/main.js --host tunnel:<id>.<cluster>`. On the new-session screen, pick an agent that is not the first one, a model, and an effort.
2. Send one message, wait for the answer, then quit with `ctrl+c` twice.
3. Run `cat ~/.config/ahpc/choices.json`.
4. Run the command of step 1 again, and look at the new-session chips.
5. Quit, and run the command of step 1 with `--no-remember` at the end.

## Pass and fail

- Pass: step 3 shows `tunnel:<id>.<cluster>` with the agent, the model and the effort of step 1.
- Pass: in step 4, the chips show that agent, model and effort.
- Pass: in step 5, the chips show the host's first agent and `default`.
- Fail: step 4 shows the host's first agent, or the host refuses the first message.
