---
title: ahpc reaches a host through a Dev Tunnel
---

# ahpc reaches a host through a Dev Tunnel

Plan [ahp/20261117-0551-a-tunnel-host-is-reached-by-address](../plans/ahp/20261117-0551-a-tunnel-host-is-reached-by-address/plan.md) opens `tunnel:<id>.<cluster>`, and no test reaches a real tunnel.
This check needs the `devtunnel` CLI, signed in with `devtunnel user login`.

## Set up

1. Follow steps 1 to 7 of [set-up-a-test-host.md](set-up-a-test-host.md).
2. Start the host as step 8 of that file says, with `--port 31546` in place of `--port 9313`.
3. In the ahpc checkout, on the plan's branch, run `npm install` and `npm run build`.
4. Let `<ahpc>` be `node <ahpc>/dist/src/main.js`.

## Steps

1. Run `devtunnel host -p 31546 --allow-anonymous`, and read the id and the cluster from the URL it prints.
2. Run `<ahpc> --host tunnel:<id>.<cluster> --connection-token-file <scratch>/token session list`.
3. Run `<ahpc> --host tunnel:<id>.<cluster> session list`, with no token.
4. Stop the tunnel, and run `devtunnel host -p 31546` with no `--allow-anonymous`.
5. Run step 2 again.
6. Run `devtunnel token <id> --scopes connect`, and copy the token.
7. Run step 2 again with `--tunnel-token <token>`.
8. Run step 2 again with `--tunnel-token <token>x`, which the tunnel cannot accept.
9. Run `<ahpc> --host tunnel:<id>.<cluster> --connection-token-file <scratch>/token --tunnel-token <token>`, stop the tunnel, and start it again after 30 seconds.

## Pass and fail

- Pass: step 2 prints the session list.
- Pass: step 3 prints `needs a token of your own` and exits 1 before any connection.
- Pass: step 5 prints `The tunnel at tunnel:<id>.<cluster> needs a sign-in`.
- Pass: step 7 prints the session list.
- Pass: step 8 prints `refused the connect token`. Write down the status the tunnel answered, from `--wire` or `curl -I`.
- Pass: in step 9, the screen comes back when the tunnel is back.
- Fail: any step prints a stack, or step 8 retries with no end.
