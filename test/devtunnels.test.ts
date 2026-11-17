/*
 * The Dev Tunnels sign-in, and the two questions it asks the tunnel service.
 *
 * Nothing here reaches GitHub or the service: `fetch` is stubbed with their
 * answers, and the config folder is a temporary one, so the sign-in file and
 * its mode are read back from disk.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  NeedsPerson, hostTunnels, login, logout, management, openSignedIn, signInPath, signedIn,
  type Management, type SignIn, type TunnelRecord,
} from '../src/ahp/devtunnels.js';

let home: string;
let had: string | undefined;

beforeEach(() => {
  had = process.env.XDG_CONFIG_HOME;
  home = mkdtempSync(join(tmpdir(), 'ahpc-devtunnels-'));
  process.env.XDG_CONFIG_HOME = home;
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (had === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = had;
  rmSync(home, { recursive: true, force: true });
});

/** A JSON answer, as `fetch` resolves it. */
const answer = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** Stub `fetch` with one handler, and keep every request it was asked. */
const stubFetch = (handler: (url: string, init: RequestInit | undefined) => Response): { url: string; init: RequestInit | undefined }[] => {
  const asked: { url: string; init: RequestInit | undefined }[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    asked.push({ url, init });
    return handler(url, init);
  });
  return asked;
};

/** Write a sign-in as `login` would. */
const keep = (held: SignIn): void => {
  mkdirSync(dirname(signInPath()), { recursive: true });
  writeFileSync(signInPath(), JSON.stringify(held));
};

describe('ahpc tunnel login keeps a sign-in', () => {
  it('polls until the code is entered, slows down when asked, and keeps the pair with mode 0600', async () => {
    let polls = 0;
    const asked = stubFetch((url) => {
      if (url.endsWith('/login/device/code')) {
        return answer({ device_code: 'dev', user_code: 'ABCD-1234', verification_uri: 'https://github.com/login/device', interval: 5, expires_in: 900 });
      }
      if (url.endsWith('/login/oauth/access_token')) {
        polls += 1;
        if (polls === 1) return answer({ error: 'authorization_pending' });
        if (polls === 2) return answer({ error: 'slow_down' });
        return answer({ access_token: 'tok', refresh_token: 'ref', expires_in: 28800 });
      }
      return answer({ login: 'octocat' });
    });
    const said: string[] = [];
    const waits: number[] = [];
    const kept = await login((code, url) => said.push(`${url} ${code}`), async (ms) => { waits.push(ms); });

    expect(said).toEqual(['https://github.com/login/device ABCD-1234']);
    expect(waits).toEqual([5000, 5000, 10000]);
    expect(kept).toMatchObject({ account: 'octocat', token: 'tok', refreshToken: 'ref' });
    expect(JSON.parse(readFileSync(signInPath(), 'utf8'))).toMatchObject({ account: 'octocat', token: 'tok', refreshToken: 'ref' });
    expect(statSync(signInPath()).mode & 0o777).toBe(0o600);
    const device = new URLSearchParams(asked[0]?.init?.body as URLSearchParams);
    expect(device.get('client_id')).toBe('Iv1.e7b89e013f801f03');
    expect(device.get('scope')).toBe('tunnels');
  });

  it('refreshes a token two thirds through its life, and writes the new pair', async () => {
    keep({ account: 'octocat', token: 'old', refreshToken: 'ref', issuedAt: 0, expiresAt: 3000 });
    const asked = stubFetch(() => answer({ access_token: 'new', refresh_token: 'ref2', expires_in: 10 }));

    expect(await signedIn(1000)).toEqual({ account: 'octocat', token: 'old' });
    expect(asked).toHaveLength(0);
    expect(await signedIn(2000)).toEqual({ account: 'octocat', token: 'new' });
    const sent = new URLSearchParams(asked[0]?.init?.body as URLSearchParams);
    expect(sent.get('grant_type')).toBe('refresh_token');
    expect(sent.get('refresh_token')).toBe('ref');
    expect(sent.get('client_secret')).toBeNull();
    expect(JSON.parse(readFileSync(signInPath(), 'utf8'))).toMatchObject({ token: 'new', refreshToken: 'ref2' });
  });

  it('keeps a token that still works when a refresh fails, and asks for a sign-in once it has expired', async () => {
    keep({ account: 'octocat', token: 'old', refreshToken: 'ref', issuedAt: 0, expiresAt: 3000 });
    stubFetch(() => answer({ error: 'bad_refresh_token' }));

    expect(await signedIn(2500)).toEqual({ account: 'octocat', token: 'old' });
    await expect(signedIn(3500)).rejects.toBeInstanceOf(NeedsPerson);
  });

  it('answers nothing with no sign-in, and logout removes the file', async () => {
    expect(await signedIn()).toBeUndefined();
    expect(logout()).toBe(false);
    keep({ account: 'octocat', token: 't', refreshToken: 'r', issuedAt: 0 });
    expect(logout()).toBe(true);
    expect(await signedIn()).toBeUndefined();
  });
});

/** A management stub answering one list and one tunnel. */
const stubManagement = (list: TunnelRecord[], one: TunnelRecord | null = null): { client: Management; got: unknown[] } => {
  const got: unknown[] = [];
  return {
    got,
    client: {
      listTunnels: async () => list,
      getTunnel: async (tunnel, options) => { got.push({ tunnel, options }); return one; },
    },
  };
};

describe('ahpc tunnel list prints the host tunnels', () => {
  it('keeps the tunnels VS Code lists, and names each one by its label', async () => {
    keep({ account: 'octocat', token: 't', refreshToken: 'r', issuedAt: 0 });
    const { client } = stubManagement([
      { tunnelId: 'aaa', clusterId: 'usw2', labels: ['vscode-server-launcher', 'protocolv5', '_flag', 'laptop'], status: { hostConnectionCount: 1 } },
      { tunnelId: 'bbb', clusterId: 'euw', labels: ['protocolv5', 'other'] },
      { tunnelId: 'ccc', clusterId: 'usw2', labels: ['vscode-server-launcher', 'protocolv4', 'old'] },
      { tunnelId: 'ddd', clusterId: 'use', labels: ['vscode-server-launcher', 'protocolv6'], name: 'named', status: { hostConnectionCount: { current: 0 } } },
    ]);

    expect(await hostTunnels(() => client)).toEqual([
      { name: 'laptop', address: 'tunnel:aaa.usw2', online: true },
      { name: 'named', address: 'tunnel:ddd.use', online: false },
    ]);
  });

  it('asks for a sign-in when there is none', async () => {
    await expect(hostTunnels(() => stubManagement([]).client)).rejects.toThrow('ahpc tunnel login');
  });
});

describe('the tunnel service is asked over fetch', () => {
  it('lists every region with the github scheme, and reads one tunnel with a connect token', async () => {
    const asked = stubFetch((url) => (url.includes('global.')
      ? answer({ value: [{ value: [{ tunnelId: 'a' }] }, { value: [{ tunnelId: 'b' }] }] })
      : answer({ tunnelId: 'a', accessTokens: { connect: 'c' } })));
    const client = management('tok');

    expect((await client.listTunnels({ labels: ['vscode-server-launcher'], includePorts: true })).map((one) => one.tunnelId)).toEqual(['a', 'b']);
    expect(asked[0]?.url).toBe('https://global.rel.tunnels.api.visualstudio.com/tunnels?global=true&labels=vscode-server-launcher&includePorts=true&api-version=2023-09-27-preview');
    expect((asked[0]?.init?.headers as Record<string, string>).authorization).toBe('github tok');

    expect(await client.getTunnel({ tunnelId: 'a', clusterId: 'usw2' }, { includePorts: true, tokenScopes: ['connect'] })).toMatchObject({ accessTokens: { connect: 'c' } });
    expect(asked[1]?.url).toBe('https://usw2.rel.tunnels.api.visualstudio.com/tunnels/a?includePorts=true&tokenScopes=connect&api-version=2023-09-27-preview');
  });

  it('answers null for a tunnel that is not there, and a refused sign-in for a 401', async () => {
    stubFetch((url) => (url.includes('/tunnels/gone') ? new Response(null, { status: 404 }) : new Response(null, { status: 401 })));
    const client = management('tok');

    expect(await client.getTunnel({ tunnelId: 'gone', clusterId: 'usw2' }, { includePorts: true, tokenScopes: ['connect'] })).toBeNull();
    await expect(client.listTunnels({ labels: [], includePorts: false })).rejects.toBeInstanceOf(NeedsPerson);
  });
});

describe('a private tunnel is opened signed in', () => {
  it('finds the cluster, and answers the port URL with the connect token in the headers', async () => {
    keep({ account: 'octocat', token: 't', refreshToken: 'r', issuedAt: 0 });
    const { client, got } = stubManagement(
      [{ tunnelId: 'abc', clusterId: 'usw2' }],
      { tunnelId: 'abc', accessTokens: { connect: 'c' }, endpoints: [{ portUriFormat: 'https://abc-{port}.usw2.devtunnels.ms/' }] },
    );

    expect(await openSignedIn({ id: 'abc' }, () => client)).toEqual({
      url: 'wss://abc-31546.usw2.devtunnels.ms',
      headers: { 'X-Tunnel-Authorization': 'tunnel c', 'X-Tunnel-Skip-AntiPhishing-Page': 'true' },
    });
    expect(got).toEqual([{ tunnel: { tunnelId: 'abc', clusterId: 'usw2' }, options: { includePorts: true, tokenScopes: ['connect'] } }]);
  });

  it('answers the protocol of the tunnel, so a VS Code tunnel at 6 opens its gateway', async () => {
    keep({ account: 'octocat', token: 't', refreshToken: 'r', issuedAt: 0 });
    const { client } = stubManagement(
      [],
      { tunnelId: 'abc', labels: ['laptop', 'protocolv6', 'vscode-server-launcher', '_flag2'], accessTokens: { connect: 'c' }, endpoints: [{ portUriFormat: 'https://x7k2m9qp-{port}.usw2.devtunnels.ms/' }] },
    );

    expect(await openSignedIn({ id: 'abc', cluster: 'usw2' }, () => client)).toMatchObject({
      url: 'wss://x7k2m9qp-31546.usw2.devtunnels.ms',
      protocol: 6,
    });
  });

  it('stops for the person with no sign-in, and with a tunnel the account does not have', async () => {
    await expect(openSignedIn({ id: 'abc' }, () => stubManagement([]).client)).rejects.toBeInstanceOf(NeedsPerson);
    keep({ account: 'octocat', token: 't', refreshToken: 'r', issuedAt: 0 });
    await expect(openSignedIn({ id: 'abc' }, () => stubManagement([]).client)).rejects.toBeInstanceOf(NeedsPerson);
  });
});
