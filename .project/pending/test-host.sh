#!/usr/bin/env bash
# Start a test ahpd on this machine for the checks in this folder, or stop it.
#   bash test-host.sh          start on port 9313 (PORT=31546 for the tunnel check)
#   bash test-host.sh stop     stop it and remove /tmp/ahpc-check
# Needs /github/ahpd and /github/ahpc built (pnpm build, npm run build).
set -euo pipefail
AHPD=${AHPD:-/github/ahpd}
AHPC_DIR=${AHPC_DIR:-/github/ahpc}
PORT=${PORT:-9313}
S=/tmp/ahpc-check

if [ "${1:-}" = stop ]; then
  if [ -f "$S/host.pid" ]; then
    pid=$(cat "$S/host.pid")
    kill "$pid" 2>/dev/null || true
    # The host writes to the folder while it shuts down, so it goes first.
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.25; done
  fi
  rm -rf "$S"
  echo "stopped, $S removed"
  exit 0
fi
if [ -e "$S" ]; then echo "$S is there already: run 'bash $0 stop' first"; exit 1; fi

mkdir -p "$S/xdg" "$S/work"
openssl rand -hex 16 > "$S/token"
printf '{"plugins":[{"name":"%s/packages/agent-claude"}]}\n' "$AHPD" > "$S/config.json"

# A repository with one edit, one deletion and one new file, for the changes screen.
( cd "$S/work" && git init -q && printf 'one\n' > a.txt && printf 'two\n' > b.txt && git add . \
  && git -c user.name=check -c user.email=check@example.com commit -qm first \
  && printf 'changed\n' >> a.txt && rm b.txt && printf 'new\n' > c.txt )

XDG_CONFIG_HOME="$S/xdg" nohup node "$AHPD/packages/server/dist/main.js" --port "$PORT" \
  --config-file "$S/config.json" --sessions memory --automations memory --no-update-check \
  --connection-token-file "$S/token" --path "$S/work" --no-cwd > "$S/host.log" 2>&1 &
echo $! > "$S/host.pid"

AHPC="node $AHPC_DIR/dist/src/main.js --host ws://127.0.0.1:$PORT --connection-token-file $S/token"
for _ in $(seq 1 30); do $AHPC status > /dev/null 2>&1 && break; sleep 1; done
SESSION=$($AHPC session new --cwd "$S/work" 2>&1 | grep -o 'ahp-session:[^ ]*' | head -1)

echo "host on ws://127.0.0.1:$PORT, log in $S/host.log"
echo "paste these two lines into the terminal you check in:"
echo "export AHPC=\"$AHPC\""
echo "export SESSION=$SESSION"
