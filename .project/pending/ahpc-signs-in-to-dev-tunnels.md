---
title: ahpc signs in to Dev Tunnels and reaches a private tunnel
---

# ahpc signs in to Dev Tunnels and reaches a private tunnel

Plan [ahp/20261117-0551-ahpc-signs-in-to-dev-tunnels](../plans/ahp/20261117-0551-ahpc-signs-in-to-dev-tunnels/plan.md) signs in to Dev Tunnels, and no test reaches GitHub or the tunnel service.
ahpc runs on the Linux machine, with a config folder of its own in `/tmp/ahpc-signin`, so your own `tunnel.json` is not touched.
Two tunnels are reached, both on one GitHub account: ahpd's, on the Linux machine, and VS Code's, on the Windows machine.

## Set up

1. On the Linux machine, run `cd /github/ahpc && git switch main && git pull && npm install && npm run build`.
2. On the Linux machine, check that ahpd runs with `@ahpd/tunnel-devtunnel`, and that its `devtunnel` connector is signed in, in ahpw, with `anonymous` off.
3. On the Windows machine, check that VS Code runs with its agent host tunnel on, signed in with the same GitHub account.
4. On the Linux machine, run `mkdir -p /tmp/ahpc-signin && alias A='XDG_CONFIG_HOME=/tmp/ahpc-signin node /github/ahpc/dist/src/main.js'`.

## Steps

All the commands run on the Linux machine, in the terminal of set-up step 4.

1. Run `A tunnel login`. Open the URL it prints on any device, and enter the code.
2. Run `stat -c %a /tmp/ahpc-signin/ahpc/tunnel.json`.
3. Run `A tunnel list`. Note the address of ahpd's tunnel and of VS Code's, each `tunnel:<id>.<cluster>`.
4. Run `A --host tunnel:<ahpd id> session list`, with ahpd's id and no cluster.
5. Run `A --host tunnel:<ahpd id>`, to open the screen. In another terminal, restart ahpd, and watch the screen.
6. Run `A --host tunnel:<ahpd id>.<cluster> --token <your ahpd token> session list`.
7. Run `A --host tunnel:<VS Code id>.<cluster> session list`.
8. Run `A tunnel logout`, then step 4 again.

## Pass and fail

- Pass: step 1 prints `Signed in as <account>.`, and step 2 prints `600`.
- Pass: step 3 lists both tunnels as online.
- Pass: step 4 prints ahpd's session list.
- Pass: in step 5, the screen comes back after the restart.
- Pass: step 6 tries anonymous, meets the sign-in page, signs in, and prints the session list.
- Pass: step 7 prints VS Code's sessions and returns within a few seconds.
- Pass: step 8 prints `Signed out of Dev Tunnels.`, then `The tunnel needs a sign-in. Run ahpc tunnel login.`
- Fail: any step prints a stack, or step 4 prints a refused token.

## When done

- On the Linux machine, run `rm -rf /tmp/ahpc-signin && unalias A`.
