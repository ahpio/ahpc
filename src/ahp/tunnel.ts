/**
 * A host behind a Dev Tunnel, named by its tunnel.
 *
 * `tunnel:<id>.<cluster>` is the address a person types. The tunnel's port URL
 * is what the socket opens: Dev Tunnels forwards each port of a tunnel at
 * `https://<id>-<port>.<cluster>.devtunnels.ms`, so the id and the cluster are
 * all it takes to build one.
 */

/**
 * The port an agent host listens on inside a tunnel.
 *
 * VS Code's `TUNNEL_AGENT_HOST_PORT`, in
 * `src/vs/platform/agentHost/common/tunnelAgentHost.ts`. ahpd forwards the same
 * port, so one number reaches either host.
 */
export const TUNNEL_PORT = 31546;

/** What a `tunnel:` address names. */
export interface Tunnel {
  /** The tunnel id, as `devtunnel list` prints it. */
  id: string;
  /** The cluster the tunnel lives in, such as `usw2`. Absent when the address gave none. */
  cluster?: string;
}

/**
 * The tunnel a host names, or nothing for any other host.
 *
 * The text after `tunnel:` is split at its last `.`, because a tunnel id has no
 * dot in it and a cluster is the one part after it.
 */
export function tunnelOf(host: string): Tunnel | undefined {
  if (!host.startsWith('tunnel:')) return undefined;
  const named = host.slice('tunnel:'.length);
  const at = named.lastIndexOf('.');
  if (at <= 0) return { id: named };
  return { id: named.slice(0, at), cluster: named.slice(at + 1) };
}

/** The address the socket opens for a tunnel with a cluster. */
export function portUrl(tunnel: Tunnel & { cluster: string }): string {
  return `wss://${tunnel.id}-${String(TUNNEL_PORT)}.${tunnel.cluster}.devtunnels.ms`;
}

/** The sentence for a tunnel address with no cluster in it. */
export function noCluster(host: string): string {
  return `Name the tunnel as tunnel:<id>.<cluster> to reach it without a sign-in, not ${host}.`;
}

/**
 * The sentence for a tunnel address with no token of the person's own.
 *
 * An anonymous tunnel lets anybody reach the port, so the host's own token is
 * the only thing that says who is connecting.
 */
export function noOwnToken(host: string): string {
  return `The tunnel at ${host} needs a token of your own for the host. Pass --token or --connection-token-file.`;
}

/**
 * The headers that carry a connect token to a tunnel.
 *
 * `X-Tunnel-Authorization: tunnel <token>` is where Dev Tunnels reads a client
 * access token. `X-Tunnel-Skip-AntiPhishing-Page` stops the tunnel answering a
 * first visit with its warning page, which a socket cannot click through.
 */
export function tunnelHeaders(connectToken: string): Record<string, string> {
  return {
    'X-Tunnel-Authorization': `tunnel ${connectToken}`,
    'X-Tunnel-Skip-AntiPhishing-Page': 'true',
  };
}

/**
 * The sentence for a tunnel that sent the request to a sign-in.
 *
 * With no connect token, the tunnel is private and needs one. With one, the
 * tunnel would not take it, and a connect token lasts 24 hours, so the likely
 * reason is that it has expired.
 */
export function tunnelRefused(host: string, id: string, hadToken: boolean): string {
  return hadToken
    ? `The tunnel at ${host} refused the connect token, which may have expired. Get a new one with devtunnel token ${id} --scopes connect and set AHPC_TUNNEL_TOKEN.`
    : `The tunnel at ${host} needs a sign-in. Pass --tunnel-token with a token from devtunnel token ${id} --scopes connect.`;
}
