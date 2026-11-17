/**
 * A sign-in to Dev Tunnels, and what it reads from the tunnel service.
 *
 * The sign-in is a device code on the Dev Tunnels GitHub app, the one the
 * `devtunnel` CLI, VS Code and ahpd's devtunnel plugin use. It is kept in
 * `tunnel.json` beside the config file, with mode `0600`, because it holds a
 * refresh token.
 *
 * The tunnel service is asked with two GETs over `fetch`: the account's
 * tunnels, and one tunnel with a connect token.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { statePath, writePrivate } from '../config.js';
import { TUNNEL_PORT, tunnelHeaders, type Tunnel } from './tunnel.js';

/**
 * The Dev Tunnels GitHub app, and the scope it asks for.
 *
 * ahpd's `packages/tunnel-devtunnel/src/adapter.ts` names the same two. A
 * device sign-in needs no client secret.
 */
export const CLIENT_ID = 'Iv1.e7b89e013f801f03';
export const SCOPE = 'tunnels';

/** Where a device sign-in starts, where its token is answered, and who it is. */
export const DEVICE_CODE_URL = 'https://github.com/login/device/code';
export const ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const ACCOUNT_URL = 'https://api.github.com/user';

/** The label every host tunnel carries, VS Code's `TUNNEL_LAUNCHER_LABEL`. */
export const LAUNCHER_LABEL = 'vscode-server-launcher';

/** The prefix of the label carrying the host's version, VS Code's `PROTOCOL_VERSION_TAG_PREFIX`. */
export const PROTOCOL_LABEL_PREFIX = 'protocolv';

/** The lowest protocol label VS Code lists a host tunnel at. */
export const LOWEST_PROTOCOL = 5;

/** What `tunnel.json` holds. */
export interface SignIn {
  /** The GitHub login the token belongs to. */
  account: string;
  token: string;
  refreshToken: string;
  /** When the token was answered, in milliseconds since the epoch. */
  issuedAt: number;
  /** When it stops working. Absent when GitHub gave it no lifetime. */
  expiresAt?: number;
}

/** The sentence for a command that needs a sign-in and has none. */
export const NO_SIGN_IN = 'The tunnel needs a sign-in. Run ahpc tunnel login.';

/**
 * A refusal that only the person can fix: no sign-in, one the service refused
 * or that expired, or a tunnel the account does not have. A retry never fixes
 * one, so a connection stops on it.
 */
export class NeedsPerson extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeedsPerson';
  }
}

/** How long a request to GitHub waits for its answer. */
const ASK_TIMEOUT_MS = 15_000;

/** The wait between two polls when GitHub names none, and what a `slow_down` adds, in seconds. */
const DEFAULT_INTERVAL = 5;
const SLOW_DOWN = 5;

/** Where the sign-in is kept. */
export const signInPath = (): string => statePath('ahpc', 'tunnel.json');

/** Post one form to GitHub, and read its JSON answer. */
async function post(url: string, fields: Record<string, string>): Promise<Record<string, unknown>> {
  const answer = await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields),
    signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
  });
  if (!answer.ok) {
    await answer.body?.cancel();
    throw new Error(`GitHub answered ${String(answer.status)}`);
  }
  return await answer.json() as Record<string, unknown>;
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
const seconds = (value: unknown): number | undefined => (typeof value === 'number' && value > 0 ? value : undefined);

/** The login a token belongs to. */
async function accountOf(token: string): Promise<string> {
  const answer = await fetch(ACCOUNT_URL, {
    headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
  });
  if (!answer.ok) {
    await answer.body?.cancel();
    throw new Error(`GitHub answered ${String(answer.status)} for the account`);
  }
  const login = text((await answer.json() as Record<string, unknown>).login);
  if (login === undefined) throw new Error('GitHub named no account');
  return login;
}

/** A token answer as the sign-in keeps it. */
function pairOf(held: Record<string, unknown>, account: string, refreshToken: string | undefined, now: number): SignIn {
  const token = text(held.access_token);
  const refresh = text(held.refresh_token) ?? refreshToken;
  if (token === undefined) throw new Error('GitHub answered no token');
  if (refresh === undefined) throw new Error('GitHub answered no refresh token');
  const lifetime = seconds(held.expires_in);
  return {
    account,
    token,
    refreshToken: refresh,
    issuedAt: now,
    ...(lifetime !== undefined ? { expiresAt: now + lifetime * 1000 } : {}),
  };
}

/**
 * Sign in by a device code, and keep the answer.
 *
 * `say` is given the code and the page to type it on. GitHub answers a poll
 * that comes too soon with `slow_down`, and each one adds five seconds to the
 * wait, as RFC 8628 says.
 */
export async function login(
  say: (code: string, url: string) => void,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((done) => setTimeout(done, ms)),
): Promise<SignIn> {
  const started = await post(DEVICE_CODE_URL, { client_id: CLIENT_ID, scope: SCOPE });
  const code = text(started.user_code);
  const url = text(started.verification_uri);
  const handle = text(started.device_code);
  if (code === undefined || url === undefined || handle === undefined) throw new Error('GitHub answered no device code');
  say(code, url);
  let interval = seconds(started.interval) ?? DEFAULT_INTERVAL;
  const ends = Date.now() + (seconds(started.expires_in) ?? 900) * 1000;
  while (Date.now() < ends) {
    await wait(interval * 1000);
    const held = await post(ACCESS_TOKEN_URL, {
      client_id: CLIENT_ID,
      device_code: handle,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    });
    const error = text(held.error);
    if (error === 'authorization_pending') continue;
    if (error === 'slow_down') { interval += SLOW_DOWN; continue; }
    if (error !== undefined) throw new Error(`GitHub refused the sign-in: ${error}`);
    const token = text(held.access_token);
    if (token === undefined) throw new Error('GitHub answered no token');
    const kept = pairOf(held, await accountOf(token), undefined, Date.now());
    writePrivate(signInPath(), `${JSON.stringify(kept, null, 2)}\n`);
    return kept;
  }
  throw new Error('The device code expired before it was entered. Run ahpc tunnel login again.');
}

/** Forget the sign-in. True when there was one. */
export function logout(): boolean {
  const had = existsSync(signInPath());
  rmSync(signInPath(), { force: true });
  return had;
}

/** The sign-in on disk, or nothing. A file that is not a sign-in is refused with a sentence. */
export function readSignIn(): SignIn | undefined {
  let raw: string;
  try {
    raw = readFileSync(signInPath(), 'utf8');
  }
  catch {
    return undefined;
  }
  try {
    const held = JSON.parse(raw) as Partial<SignIn>;
    if (typeof held.token !== 'string' || typeof held.refreshToken !== 'string' || typeof held.account !== 'string') {
      throw new Error('it holds no token');
    }
    return held as SignIn;
  }
  catch (error) {
    throw new NeedsPerson(`${signInPath()} could not be read: ${error instanceof Error ? error.message : String(error)}. Run ahpc tunnel login.`);
  }
}

/**
 * A token that works now, or nothing when there is no sign-in.
 *
 * Refreshed once two thirds of its lifetime have gone, as ahpd and VS Code's
 * CLI keep theirs alive. A refresh that fails while the token still works
 * keeps the old one; one that fails after it has expired asks for a new sign-in.
 */
export async function signedIn(now: number = Date.now()): Promise<{ account: string; token: string } | undefined> {
  const held = readSignIn();
  if (held === undefined) return undefined;
  if (held.expiresAt === undefined) return { account: held.account, token: held.token };
  const due = held.issuedAt + (held.expiresAt - held.issuedAt) * 2 / 3;
  if (now < due) return { account: held.account, token: held.token };
  try {
    const answered = await post(ACCESS_TOKEN_URL, {
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: held.refreshToken,
    });
    if (text(answered.error) !== undefined) throw new Error(text(answered.error));
    const kept = pairOf(answered, held.account, held.refreshToken, now);
    writePrivate(signInPath(), `${JSON.stringify(kept, null, 2)}\n`);
    return { account: kept.account, token: kept.token };
  }
  catch {
    if (now < held.expiresAt) return { account: held.account, token: held.token };
    throw new NeedsPerson('The Dev Tunnels sign-in has expired. Run ahpc tunnel login.');
  }
}

/** The part of a tunnel record this client reads. */
export interface TunnelRecord {
  tunnelId?: string;
  clusterId?: string;
  name?: string;
  labels?: string[];
  status?: { hostConnectionCount?: number | { current?: number } };
  accessTokens?: Record<string, string>;
  endpoints?: { portUriFormat?: string }[];
}

/** The two calls this client makes to the tunnel service. */
export interface Management {
  listTunnels(options: { labels: string[]; includePorts: boolean }): Promise<TunnelRecord[]>;
  getTunnel(tunnel: { tunnelId: string; clusterId: string }, options: { includePorts: boolean; tokenScopes: string[] }): Promise<TunnelRecord | null>;
}

/**
 * The tunnel service's API version, as `@microsoft/dev-tunnels-management`
 * 1.3.62 names it in `ManagementApiVersions`.
 */
export const API_VERSION = '2023-09-27-preview';

/** The service host for a cluster, or the global one that lists every cluster. */
const serviceHost = (cluster?: string): string => `https://${cluster ?? 'global'}.rel.tunnels.api.visualstudio.com`;

/**
 * The query the management client builds: its options, each a comma list,
 * then the API version.
 */
function queryOf(options: Record<string, string[] | boolean>, global: boolean): string {
  const items: string[] = global ? ['global=true'] : [];
  for (const [key, value] of Object.entries(options)) {
    if (value === false) continue;
    const values = value === true ? ['true'] : value;
    if (values.length > 0) items.push(`${key}=${values.map(encodeURIComponent).join(',')}`);
  }
  items.push(`api-version=${API_VERSION}`);
  return items.join('&');
}

/**
 * The tunnel service, with the person's token, over `fetch`.
 *
 * The same two GETs `@microsoft/dev-tunnels-management` sends. The service
 * reads a GitHub token under its own `github` scheme.
 */
export function management(token: string): Management {
  const ask = async (url: string): Promise<unknown> => {
    const answer = await fetch(url, {
      headers: { accept: 'application/json', authorization: `github ${token}`, 'user-agent': 'ahpc' },
      signal: AbortSignal.timeout(ASK_TIMEOUT_MS),
    });
    if (answer.status === 404) {
      await answer.body?.cancel();
      return null;
    }
    if (answer.status === 401 || answer.status === 403) {
      await answer.body?.cancel();
      throw new NeedsPerson('The tunnel service refused the sign-in. Run ahpc tunnel login.');
    }
    if (!answer.ok) {
      await answer.body?.cancel();
      throw new Error(`The tunnel service answered ${String(answer.status)}.`);
    }
    return answer.json();
  };
  return {
    // The answer groups tunnels by region: `{ value: [{ value: [tunnel] }] }`.
    listTunnels: async (options) => {
      const held = await ask(`${serviceHost()}/tunnels?${queryOf(options, true)}`) as { value?: { value?: TunnelRecord[] }[] } | null;
      return (held?.value ?? []).flatMap((region) => region.value ?? []);
    },
    getTunnel: async (tunnel, options) => (
      await ask(`${serviceHost(tunnel.clusterId)}/tunnels/${encodeURIComponent(tunnel.tunnelId)}?${queryOf(options, false)}`)
    ) as TunnelRecord | null,
  };
}

/**
 * The public URI of one port, as `TunnelEndpoint.getPortUri` answers it.
 *
 * `{port}` in the endpoint's `portUriFormat`, replaced by the port number.
 */
export const portUri = (endpoint: { portUriFormat?: string }, port: number): string | undefined =>
  endpoint.portUriFormat?.replace('{port}', String(port));

/** What `tunnel list` prints for one tunnel. */
export interface HostTunnel {
  name: string;
  /** `tunnel:<id>.<cluster>`, the address `--host` takes, with or without a sign-in. */
  address: string;
  online: boolean;
}

/** The version a `protocolv<N>` label names, or nothing. */
const protocolOf = (labels: readonly string[]): number | undefined => {
  for (const label of labels) {
    if (!label.startsWith(PROTOCOL_LABEL_PREFIX)) continue;
    const found = Number(label.slice(PROTOCOL_LABEL_PREFIX.length));
    if (Number.isInteger(found)) return found;
  }
  return undefined;
};

/**
 * The name VS Code shows for a tunnel.
 *
 * The first label that is not the launcher label, does not start with `_` and
 * is not a protocol label; the tunnel's own name or id when there is none.
 */
export function displayName(tunnel: TunnelRecord): string {
  const named = (tunnel.labels ?? []).find((label) => (
    label !== LAUNCHER_LABEL && !label.startsWith('_') && !label.startsWith(PROTOCOL_LABEL_PREFIX)
  ));
  return named ?? tunnel.name ?? tunnel.tunnelId ?? '';
}

/** Whether a host is accepting connections on a tunnel. */
const onlineOf = (tunnel: TunnelRecord): boolean => {
  const count = tunnel.status?.hostConnectionCount;
  const current = typeof count === 'number' ? count : count?.current;
  return (current ?? 0) > 0;
};

/** The signed-in account's tunnels that VS Code would list. */
export async function hostTunnels(open: (token: string) => Management = management): Promise<HostTunnel[]> {
  const held = await signedIn();
  if (held === undefined) throw new NeedsPerson('Sign in with ahpc tunnel login.');
  const client = open(held.token);
  const found = await client.listTunnels({ labels: [LAUNCHER_LABEL], includePorts: true });
  return found
    .filter((tunnel) => (tunnel.labels ?? []).includes(LAUNCHER_LABEL))
    .filter((tunnel) => (protocolOf(tunnel.labels ?? []) ?? 0) >= LOWEST_PROTOCOL)
    .filter((tunnel) => tunnel.tunnelId !== undefined && tunnel.clusterId !== undefined)
    .map((tunnel) => ({
      name: displayName(tunnel),
      address: `tunnel:${tunnel.tunnelId as string}.${tunnel.clusterId as string}`,
      online: onlineOf(tunnel),
    }));
}

/** What one signed-in open answers. */
export interface SignedInOpen {
  /** The port URL of `31546`, as `wss://`. */
  url: string;
  /** The connect token, in the tunnel's headers. */
  headers: Record<string, string>;
  /** The tunnel's `protocolv` label. Absent when it has none. */
  protocol?: number;
}

/**
 * The URL, the headers and the protocol of one signed-in open.
 *
 * The cluster comes from the address, or from the account's tunnels when the
 * address names none. A fresh connect token is asked for on each open, so a
 * reconnect after a day still gets in.
 */
export async function openSignedIn(
  tunnel: Tunnel,
  open: (token: string) => Management = management,
): Promise<SignedInOpen> {
  const held = await signedIn();
  if (held === undefined) throw new NeedsPerson(NO_SIGN_IN);
  const client = open(held.token);
  let cluster = tunnel.cluster;
  if (cluster === undefined) {
    const found = await client.listTunnels({ labels: [LAUNCHER_LABEL], includePorts: false });
    cluster = found.find((one) => one.tunnelId === tunnel.id)?.clusterId;
    if (cluster === undefined) throw new NeedsPerson(`No tunnel ${tunnel.id} on the account ${held.account}. List them with ahpc tunnel list.`);
  }
  const record = await client.getTunnel({ tunnelId: tunnel.id, clusterId: cluster }, { includePorts: true, tokenScopes: ['connect'] });
  if (record === null) throw new NeedsPerson(`No tunnel ${tunnel.id} on the account ${held.account}. List them with ahpc tunnel list.`);
  const uri = (record.endpoints ?? []).map((endpoint) => portUri(endpoint, TUNNEL_PORT)).find((one) => one !== undefined);
  if (uri === undefined) throw new Error(`The tunnel ${tunnel.id} has no host online.`);
  const connect = record.accessTokens?.connect;
  const protocol = protocolOf(record.labels ?? []);
  return {
    url: uri.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:').replace(/\/$/, ''),
    headers: connect !== undefined ? tunnelHeaders(connect) : {},
    ...(protocol !== undefined ? { protocol } : {}),
  };
}
