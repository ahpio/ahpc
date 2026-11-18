---
title: A new session starts with the last agent, model and effort on a host
---

# A new session starts with the last agent, model and effort on a host

Plan [screen/20261118-0214-ahpc-remembers-the-last-agent-and-model](../plans/screen/20261118-0214-ahpc-remembers-the-last-agent-and-model/plan.md) keeps the choice in `choices.json`, and the tests use the scripted host only.
This check needs a live host with two agents, such as a VS Code tunnel.

## Set up

1. In the ahpc checkout, run `npm install` and `npm run build`.
2. Let `<ahpc>` be `node <checkout>/dist/src/main.js --host <your host>`.

## Steps

1. Run `<ahpc>`, pick an agent that is not the first one, a model, and an effort.
2. Send one message, then quit with `ctrl+c` twice.
3. Run `cat ~/.config/ahpc/choices.json`.
4. Run `<ahpc>` again.
5. Quit, and run `<ahpc> --no-remember`.

## Pass and fail

- Pass: step 3 shows your host's address with the agent, the model and the effort.
- Pass: in step 4, the new-session chips show the same agent, model and effort.
- Pass: in step 5, the chips show the host's first agent and its default model.
- Fail: step 4 shows the host's first agent, or a chip the host refuses on the first message.
