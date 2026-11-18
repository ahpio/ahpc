#!/usr/bin/env bash
# A tunnel host is reached again after its tunnel restarts, in one command,
# on the Linux machine: the screen comes back by itself, by `reconnect`.
#   bash /github/ahpc/.project/pending/tunnel-reconnect-check.sh
# Needs /github/ahpd and /github/ahpc built, and `devtunnel user login` done.
set -uo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
W=/tmp/ahpc-reconnect
# A new name each run: the service refuses tokens for a name deleted a while ago.
TUNNEL=ahpc-check-$(date +%H%M%S)

say() { printf '%s\n' "$*"; }
cleanup() {
  [ -n "${SCREEN_PID:-}" ] && kill "$SCREEN_PID" 2>/dev/null
  [ -n "${HOST_PID:-}" ] && kill "$HOST_PID" 2>/dev/null
  devtunnel delete "$TUNNEL" --force > /dev/null 2>&1
  devtunnel unset > /dev/null 2>&1
  bash "$HERE/test-host.sh" stop > /dev/null 2>&1
  rm -rf "$W"
}
trap cleanup EXIT

rm -rf "$W"; mkdir -p "$W"
bash "$HERE/test-host.sh" stop > /dev/null 2>&1
say "1. test host on port 31546"
PORT=31546 bash "$HERE/test-host.sh" > "$W/host.out" 2>&1 || { cat "$W/host.out"; exit 1; }

say "2. a private tunnel, $TUNNEL, on that port"
devtunnel create "$TUNNEL" > /dev/null 2>&1
devtunnel port create "$TUNNEL" -p 31546 > /dev/null 2>&1
host_tunnel() {
  devtunnel host "$TUNNEL" > "$W/tunnel.log" 2>&1 & HOST_PID=$!
  for _ in $(seq 1 30); do grep -q "Ready to accept" "$W/tunnel.log" && return 0; sleep 1; done
  say "FAIL  the tunnel did not start: $(tail -2 "$W/tunnel.log")"; exit 1
}
host_tunnel
CLUSTER=$(grep -o "ready.*$TUNNEL\.[a-z0-9]*" -i "$W/tunnel.log" | grep -o "$TUNNEL\.[a-z0-9]*" | head -1 | cut -d. -f2)
# A tunnel just made can refuse a token for a few seconds, so it is asked again.
TOK=""
for _ in $(seq 1 10); do
  TOK=$(devtunnel token "$TUNNEL.$CLUSTER" --scopes connect 2>/dev/null | awk '/^Token:/ {print $2}')
  [ -n "$TOK" ] && break
  sleep 3
done
[ -n "$TOK" ] || { say "FAIL  devtunnel gave no connect token: $(devtunnel token "$TUNNEL.$CLUSTER" --scopes connect 2>&1 | tail -1)"; exit 1; }

say "3. the screen, through tunnel:$TUNNEL.$CLUSTER"
script -q -c "node /github/ahpc/dist/src/main.js --host tunnel:$TUNNEL.$CLUSTER --connection-token-file /tmp/ahpc-check/token --tunnel-access anonymous --tunnel-token $TOK --wire $W/wire.jsonl" /dev/null > "$W/screen.out" 2>&1 &
SCREEN_PID=$!
for _ in $(seq 1 30); do grep -q '"from":"host"' "$W/wire.jsonl" 2>/dev/null && break; sleep 1; done
grep -q '"from":"host"' "$W/wire.jsonl" 2>/dev/null || { say "FAIL  the screen did not connect"; exit 1; }
say "   connected"

say "4. stop the tunnel, wait 30 s, and start it again"
kill "$HOST_PID"; wait "$HOST_PID" 2>/dev/null
before=$(wc -l < "$W/wire.jsonl")
sleep 30
host_tunnel

say "5. wait up to 60 s for the screen to come back"
# Back means a new handshake: a `reconnect` or `initialize` sent after the
# stop, and a host frame after it. A frame from the old socket is not that.
came_back() {
  tail -n +"$((before + 1))" "$W/wire.jsonl" | awk '
    /"from":"client"/ && /"method":"(reconnect|initialize)"/ { sent = 1; if (how == "") { match($0, /"method":"[a-z]+"/); how = substr($0, RSTART + 10, RLENGTH - 11) } }
    sent && /"from":"host"/ { print how; exit }'
}
for _ in $(seq 1 60); do
  how=$(came_back)
  [ -n "$how" ] && break
  sleep 1
done
if [ -n "$how" ]; then
  say "PASS  the screen came back after the tunnel restarted, by $how"
  exit 0
fi
say "FAIL  no new handshake in 60 s after the tunnel restarted"
say "      the client's frames since the stop: $(tail -n +"$((before + 1))" "$W/wire.jsonl" | grep -o '"from":"client"[^}]*"method":"[a-zA-Z]*"' | grep -o '"method":"[a-zA-Z]*"' | sort | uniq -c | tr '\n' ' ')"
exit 1
