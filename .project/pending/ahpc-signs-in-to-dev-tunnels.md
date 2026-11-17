---
title: ahpc signs in to Dev Tunnels and reaches a private tunnel
---

# ahpc signs in to Dev Tunnels and reaches a private tunnel

Plan [ahp/20261117-0551-ahpc-signs-in-to-dev-tunnels](../plans/ahp/20261117-0551-ahpc-signs-in-to-dev-tunnels/plan.md) signs in to Dev Tunnels, and no test reaches GitHub or the tunnel service.
This check needs a GitHub account, and ahpd with its devtunnel plugin hosting a private tunnel for that account.

## Set up

1. In the ahpc checkout, on the plan's branch, run `npm install` and `npm run build`.
2. Make an empty folder `<scratch>`, and let `<ahpc>` be `XDG_CONFIG_HOME=<scratch> node <ahpc>/dist/src/main.js`.
3. In ahpd, open a devtunnel connector signed in to the same account, with `anonymous` off.

## Steps

1. Run `<ahpc> tunnel login`, open the URL, and enter the code.
2. Run `stat -c %a <scratch>/ahpc/tunnel.json`.
3. Run `<ahpc> tunnel list`.
4. Run `<ahpc> --host tunnel:<id> session list`, with the id from step 3.
5. Run `<ahpc> --host tunnel:<id>`, restart ahpd, and wait for the screen.
6. Run `<ahpc> --host tunnel:<id>.<cluster> --token <your ahpd token> session list`, with the address from step 3.
7. Run `<ahpc> tunnel logout`, then step 4 again.
8. If VS Code hosts its own agent host tunnel on the account, run steps 3 and 4 against it.
9. If that tunnel is not bound to the editor, run step 4 against it with `--tunnel-host dedicated`.

## Pass and fail

- Pass: step 1 prints `Signed in as <account>.`, and step 2 prints `600`.
- Pass: step 3 lists the ahpd tunnel as `tunnel:<id>.<cluster>`, online.
- Pass: step 4 prints the session list, which ahpd admits with the derived token.
- Pass: in step 5, the screen comes back after the restart.
- Pass: step 6 tries anonymous, meets the sign-in page, signs in, and prints the session list.
- Pass: step 7 prints `Signed out of Dev Tunnels.`, then `The tunnel needs a sign-in. Run ahpc tunnel login.`
- Pass: step 8 prints the editor's sessions and returns within a few seconds.
- Pass: step 9 prints the sessions of a standalone agent host.
- Fail: any step prints a stack, or step 4 prints a refused token.
