# Connect

ahpc needs two things: the host's address and, if the host asks for one, a token.

## The host

| Source | Example |
| --- | --- |
| Flag | `--host ws://127.0.0.1:9187` |
| Environment | `AHPC_HOST=ws://127.0.0.1:9187` |
| Config file | `"host": "ws://127.0.0.1:9187"` |

A flag wins over the environment, and the environment wins over the file. With none of them, ahpc uses the scripted host.

The address is `ws://`, `wss://`, or `tunnel:<id>.<cluster>` for a host behind a Dev Tunnel.

## The token

| Source | Example |
| --- | --- |
| Flag | `--token <token>` |
| Flag | `--connection-token-file <path>` |
| Environment | `AHPC_TOKEN=<token>` |
| Config file | `"connectionTokenFile": "<path>"` |
| Config file | `"token": "<token>"` |

ahpc reads them in that order and uses the first one it finds. `--token` and `--connection-token-file` together is an error.

Prefer a file to the token itself. A path is safe in a config file you share or back up; a token is not. The file is read as written: give an absolute path, because ahpc does not expand `~` (your shell does, on the command line).

ahpd writes its token to `~/.config/ahpd/connection-token`. On the same machine, point ahpc at that file:

```sh
ahpc --host ws://127.0.0.1:9187 --connection-token-file ~/.config/ahpd/connection-token
```

## A host on another machine

The host must listen on the network and have a token. For ahpd, see [Remote access](https://ahpio.github.io/ahpd/server/REMOTE) in its docs. Then:

```sh
ahpc --host ws://203.0.113.5:9187 --token <token>
ahpc --host wss://ahpd.example.com --token <token>
```

ahpd can give each person their own token. See [Users](https://ahpio.github.io/ahpd/server/USERS) in its docs.

### A host behind a Dev Tunnel

A host behind NAT can be reached through a [Dev Tunnel](https://learn.microsoft.com/azure/developer/dev-tunnels/), with no public port. ahpc opens port 31546 of the tunnel, where VS Code and ahpd put their agent host:

```sh
ahpc --host tunnel:l3rs99qw.usw2 --token <token>
```

The id and the cluster are in the tunnel's port URL, `https://l3rs99qw-31546.usw2.devtunnels.ms`.

Bring your own token for the host, even on an anonymous tunnel. Anybody with the URL can reach an anonymous tunnel, so the token is what tells the host who you are.

A private tunnel also needs a connect token from its owner. The owner runs `devtunnel token <id> --scopes connect`, and you pass it with `--tunnel-token` or `AHPC_TUNNEL_TOKEN`:

```sh
AHPC_TUNNEL_TOKEN=<connect token> ahpc --host tunnel:l3rs99qw.usw2 --token <token>
```

A connect token lasts 24 hours. When the tunnel refuses it, ahpc stops and says how to get a new one.

#### Signed in

Sign in to Dev Tunnels once, with a code that GitHub shows you, and list the tunnels with an agent host:

```sh
ahpc tunnel login
ahpc tunnel list
```

Signed in, `tunnel:<id>` reaches a tunnel with no cluster and no connect token. ahpc asks the tunnel service for a fresh connect token each time it connects:

```sh
ahpc --host tunnel:l3rs99qw
```

With no token of your own, ahpc sends the token VS Code derives from the tunnel id, as VS Code does. Your sign-in is the check, so this works only signed in, never on an anonymous tunnel.

The sign-in is kept in `tunnel.json` beside the config file, readable only by you. `ahpc tunnel logout` removes it.

To reach a tunnel that another person owns, ask the owner for access, such as `devtunnel access create <id> --org <org>` for a GitHub organization.

`--tunnel-access`, or `tunnelAccess` in the config file, picks the way in:

| Value | |
| --- | --- |
| `auto` | Anonymous when the address has a cluster and you gave your own token, signed in otherwise. When the tunnel asks for a sign-in, ahpc signs in. The default |
| `anonymous` | Only the port URL, with your own token |
| `signed-in` | Only through your sign-in |

#### A VS Code tunnel

VS Code's own tunnel is reached signed in, as any other. A tunnel labelled `protocolv6` or higher can serve more than one agent host, so ahpc picks one on each connection. A tunnel bound to one agent host, such as the editor's own, always gets that host.

`--tunnel-host`, or `tunnelHost` in the config file, picks the agent host on a tunnel that is not bound to one:

| Value | |
| --- | --- |
| `editor` | The editor's own agent host when it runs, else a standalone one. The default |
| `dedicated` | A standalone agent host, which the tunnel starts when none runs |

## Protected resources

Some hosts protect a resource, such as a model API, and ask the client for a token for it. `ahpc auth` lists what the host protects, and `ahpc auth <resource>` sends a token:

```sh
ahpc auth
ahpc auth https://api.anthropic.com --resource-token <token> --expires-in 3600
```

ahpc also reads a token for a resource from `AHPC_TOKEN_<RESOURCE>`. The name is the resource URL without its scheme, in capitals, with every run of characters that are not letters or digits turned into `_`. For `https://api.anthropic.com` it is `AHPC_TOKEN_API_ANTHROPIC_COM`.

## Check the connection

```sh
ahpc status
```

`ahpc status` prints the host, the connection, and whether a newer ahpc is on npm. `ahpc config` prints the config file and the values in force, and it works without a host.
