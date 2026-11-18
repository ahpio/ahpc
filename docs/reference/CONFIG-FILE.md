# Config file

`$XDG_CONFIG_HOME/ahpc/config.json`, or `~/.config/ahpc/config.json`. `--config-file <path>` reads another one. See [Configure](../start/CONFIGURE.md).

| Key | Type | Flag | |
| --- | --- | --- | --- |
| `host` | string | `--host` | The host, `ws://host:port` |
| `token` | string | `--token` | A token for the host. Prefer `connectionTokenFile` |
| `connectionTokenFile` | string | `--connection-token-file` | A file that holds the token |
| `tunnelAccess` | string | `--tunnel-access` | How a `tunnel:` host is reached: `auto` (default), `anonymous` or `signed-in`. See [Connect](../start/CONNECT.md#a-host-behind-a-dev-tunnel) |
| `tunnelHost` | string | `--tunnel-host` | The agent host on a VS Code tunnel: `editor` (default) or `dedicated`. See [Connect](../start/CONNECT.md#a-vs-code-tunnel) |
| `trust` | string[] | `--trust` | [Trusted folders](../start/CONFIGURE.md#trusted-folders) |
| `theme` | string | `--theme` | The theme to open on |
| `lang` | string | `--lang` | `en`, `pt-br` or `es` |
| `shell` | string | `--shell` | The screen layout |
| `keys` | object | | [Keys](../start/CONFIGURE.md#keys): a chord to a command id, or `null` |
| `updateCheck` | boolean | `--no-update-check` | `false` never asks npm for a newer version |
| `rememberChoices` | boolean | `--no-remember` | `false` starts each new session at the host's first agent and default model. See [New session](../use/NEW-SESSION.md#the-agent) |
| `boodInline` | boolean | | Show the creature in place of the header's name, in an open session |
| `boodFloat` | boolean | `--bood` | Let the creature move over the whole screen |
