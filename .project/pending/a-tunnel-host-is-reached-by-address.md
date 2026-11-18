---
title: ahpc reaches a host through a Dev Tunnel by its address
---

# ahpc reaches a host through a Dev Tunnel by its address

Plan [ahp/20261117-0551-a-tunnel-host-is-reached-by-address](../plans/ahp/20261117-0551-a-tunnel-host-is-reached-by-address/plan.md) opens `tunnel:<id>.<cluster>` without a sign-in.
Everything runs on the Linux machine, in two terminals. It needs the `devtunnel` CLI, signed in with `devtunnel user login`.
`--tunnel-access anonymous` keeps ahpc off the signed-in way, which `auto` takes when you are signed in with `ahpc tunnel login`.

## Set up

1. In terminal 1, do steps 1 and 2 of [set-up-a-test-host.md](set-up-a-test-host.md).
2. In terminal 1, run `PORT=31546 bash /github/ahpc/.project/pending/test-host.sh`.
3. In terminal 2, paste the two `export` lines from step 2.
4. In terminal 2, run `devtunnel create ahpc-check --allow-anonymous`, then `devtunnel port create ahpc-check -p 31546`.

## Steps

1. In terminal 1, run `devtunnel host ahpc-check`. From the URL it prints, `https://ahpc-check-31546.<cluster>.devtunnels.ms`, note `<cluster>`.
2. In terminal 2, run `node /github/ahpc/dist/src/main.js --host tunnel:ahpc-check.<cluster> --connection-token-file /tmp/ahpc-check/token session list`.
3. In terminal 2, run the same command with `--tunnel-access anonymous` and without `--connection-token-file /tmp/ahpc-check/token`.
4. In terminal 2, run `devtunnel access reset ahpc-check`, which makes the tunnel private.
5. In terminal 2, run step 2 again with `--tunnel-access anonymous`.
6. In terminal 2, run `devtunnel token ahpc-check --scopes connect`, and copy the token it prints.
7. In terminal 2, run step 2 again with `--tunnel-access anonymous --tunnel-token <token>` at the end.
8. In terminal 2, run step 2 again with `--tunnel-access anonymous --tunnel-token <token>x`, a token the tunnel cannot accept.
9. In terminal 2, run step 2 with `--tunnel-token <token>` and without `session list`, to open the screen. In terminal 1, stop the tunnel with `ctrl+c`, wait 30 s, and run `devtunnel host ahpc-check` again.

## Pass and fail

- Pass: step 2 prints the session list, or `No sessions.`
- Pass: step 3 prints `needs a token of your own` and exits 1.
- Pass: step 5 prints `The tunnel at tunnel:ahpc-check.<cluster> needs a sign-in`.
- Pass: step 7 prints the session list.
- Pass: step 8 prints `refused the connect token` and exits 1 at once.
- Pass: in step 9, the screen comes back once the tunnel is back.
- Fail: any step prints a stack, or step 8 keeps retrying.

## When done

- In terminal 1, stop the tunnel with `ctrl+c`.
- Run `devtunnel delete ahpc-check --force`, `devtunnel unset` and `bash /github/ahpc/.project/pending/test-host.sh stop`.
