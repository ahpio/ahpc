/*
 * A host behind a Dev Tunnel, named `tunnel:<id>.<cluster>`.
 *
 * No case reaches a real tunnel. The address and the URL are pure, the headers
 * are read off a loopback server's upgrade and GET, and a tunnel's refusal is a
 * loopback answer passed through the same `whyNoConnection` a tunnel's would.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createServer, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { InMemoryTransport, type AhpTransport } from '@microsoft/agent-host-protocol/client';
import { StopRetrying, liveHost } from '../src/ahp/live.js';
import { whyNoConnection } from '../src/ahp/refused.js';
import { noCluster, noOwnToken, portUrl, tunnelHeaders, tunnelOf, tunnelRefused } from '../src/ahp/tunnel.js';
import { hostUrl } from '../src/connect.js';
import { Scripted, settle } from './scenario.js';

let running: Server | undefined;

afterEach(async () => {
  const held = running;
  running = undefined;
  if (held === undefined) return;
  held.closeAllConnections();
  await new Promise<void>((done) => held.close(() => done()));
});

/** A loopback server answering every GET with one status, and keeping what each request sent. */
const serve = async (status: number, location?: string): Promise<{ url: string; got: IncomingHttpHeaders[]; upgrades: IncomingHttpHeaders[] }> => {
  const got: IncomingHttpHeaders[] = [];
  const upgrades: IncomingHttpHeaders[] = [];
  running = createServer((request, response) => {
    got.push(request.headers);
    response.writeHead(status, location === undefined ? {} : { location });
    response.end();
  });
  running.on('upgrade', (request, socket) => {
    upgrades.push(request.headers);
    socket.destroy();
  });
  await new Promise<void>((done) => running?.listen(0, '127.0.0.1', done));
  const { port } = running.address() as AddressInfo;
  return { url: `ws://127.0.0.1:${String(port)}`, got, upgrades };
};

describe('a tunnel address names a port URL', () => {
  it('reads the id and the cluster', () => {
    expect(tunnelOf('tunnel:l3rs99qw.usw2')).toEqual({ id: 'l3rs99qw', cluster: 'usw2' });
    expect(tunnelOf('tunnel:l3rs99qw')).toEqual({ id: 'l3rs99qw' });
    expect(tunnelOf('ws://127.0.0.1:9187')).toBeUndefined();
  });

  it('builds the URL of port 31546', () => {
    expect(portUrl({ id: 'l3rs99qw', cluster: 'usw2' })).toBe('wss://l3rs99qw-31546.usw2.devtunnels.ms');
  });

  it('opens the port URL with the person\'s token', () => {
    expect(hostUrl('tunnel:l3rs99qw.usw2', 'mine', undefined)).toEqual({
      url: 'wss://l3rs99qw-31546.usw2.devtunnels.ms',
      tunnel: { host: 'tunnel:l3rs99qw.usw2', id: 'l3rs99qw' },
    });
    expect(hostUrl('ws://127.0.0.1:9187', undefined, 'connect')).toEqual({ url: 'ws://127.0.0.1:9187' });
  });

  it('refuses an address with no cluster, and one with no token of the person\'s own', () => {
    expect(hostUrl('tunnel:l3rs99qw', 'mine', undefined)).toBe(noCluster('tunnel:l3rs99qw'));
    expect(hostUrl('tunnel:l3rs99qw.usw2', undefined, 'connect')).toBe(noOwnToken('tunnel:l3rs99qw.usw2'));
  });

  it('carries a connect token in the two tunnel headers', () => {
    expect(hostUrl('tunnel:l3rs99qw.usw2', 'mine', 'connect')).toMatchObject({
      tunnel: { headers: { 'X-Tunnel-Authorization': 'tunnel connect', 'X-Tunnel-Skip-AntiPhishing-Page': 'true' } },
    });
  });
});

describe('a connect token rides on the socket', () => {
  it('sends both headers on the upgrade', async () => {
    const { url, upgrades } = await serve(404);
    await expect(liveHost({ url, token: 'mine', headers: tunnelHeaders('connect') })).rejects.toThrow();
    expect(upgrades).toHaveLength(1);
    expect(upgrades[0]?.['x-tunnel-authorization']).toBe('tunnel connect');
    expect(upgrades[0]?.['x-tunnel-skip-antiphishing-page']).toBe('true');
  });

  it('sends no tunnel header without a connect token', async () => {
    const { url, upgrades } = await serve(404);
    await expect(liveHost({ url, token: 'mine' })).rejects.toThrow();
    expect(upgrades).toHaveLength(1);
    expect(upgrades[0]?.['x-tunnel-authorization']).toBeUndefined();
  });

  it('sends both headers on the GET that reads a refusal', async () => {
    const { url, got } = await serve(404);
    await whyNoConnection(url, 'mine', { host: 'tunnel:abc.usw2', id: 'abc', headers: tunnelHeaders('connect') });
    expect(got[0]?.['x-tunnel-authorization']).toBe('tunnel connect');
    expect(got[0]?.['x-tunnel-skip-antiphishing-page']).toBe('true');
  });
});

describe('a refused tunnel stops and says how', () => {
  it('says a private tunnel needs a sign-in on a redirect, with no connect token', async () => {
    const { url } = await serve(302, 'https://github.com/login');
    expect(await whyNoConnection(url, 'mine', { host: 'tunnel:abc.usw2', id: 'abc' }))
      .toBe(tunnelRefused('tunnel:abc.usw2', 'abc', false));
    expect(tunnelRefused('tunnel:abc.usw2', 'abc', false)).toContain('devtunnel token abc --scopes connect');
  });

  it('says the connect token was refused on a redirect, with one', async () => {
    const { url } = await serve(302, 'https://github.com/login');
    const sentence = await whyNoConnection(url, 'mine', { host: 'tunnel:abc.usw2', id: 'abc', headers: tunnelHeaders('old') });
    expect(sentence).toBe(tunnelRefused('tunnel:abc.usw2', 'abc', true));
    expect(sentence).toContain('AHPC_TUNNEL_TOKEN');
  });

  it('names the tunnel address when the host behind it refuses the person\'s token', async () => {
    const { url } = await serve(401);
    expect(await whyNoConnection(url, 'wrong', { host: 'tunnel:abc.usw2', id: 'abc' }))
      .toBe('The host at tunnel:abc.usw2 refused the connection token.');
  });

  it('ends the reconnect loop when an opener throws StopRetrying', async () => {
    let calls = 0;
    let scripted!: Scripted;
    const refusals: string[] = [];
    const states: string[] = [];
    const open = async (): Promise<AhpTransport> => {
      calls += 1;
      if (calls >= 2) throw new StopRetrying('refused for good');
      const [mine, theirs] = InMemoryTransport.pair();
      scripted = new Scripted(theirs);
      return mine;
    };
    const host = await liveHost({
      url: 'ws://scripted', clientId: 'ahpc-test', connect: open, backoff: [0], keepaliveMs: 0,
      onRefusal: (_uri, message) => refusals.push(message),
      onState: (state) => states.push(state),
    });
    await settle();
    await scripted.drop();
    await settle(40);

    expect(calls).toBe(2);
    expect(refusals).toEqual(['refused for good']);
    expect(states.at(-1)).toBe('offline');
    await host.close();
  });
});
