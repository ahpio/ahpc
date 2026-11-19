/*
 * What ahpc tells a host it is, off the wire.
 *
 * The package's own `initialize` drops `clientInfo`, so a host never learned
 * that a connection was ahpc. This drives the live host over an in-memory
 * transport, against a host that answers `initialize` and `subscribe`, and
 * reads the `initialize` it was sent.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { InMemoryTransport, type AhpTransport } from '@microsoft/agent-host-protocol/client';
import { liveHost } from '../src/ahp/live.js';
import { version } from '../src/version.js';

const ROOT = 'ahp-root://';

/** A host that answers `initialize` and `subscribe`, and keeps each `initialize` it was sent. */
function scripted(transport: AhpTransport): Record<string, unknown>[] {
  const greetings: Record<string, unknown>[] = [];
  void (async () => {
    for (;;) {
      const frame = await transport.recv().catch(() => null);
      if (frame === null) return;
      const text = frame.kind === 'text' ? frame.text : frame.kind === 'parsed' ? JSON.stringify(frame.message) : '';
      let message: Record<string, unknown>;
      try { message = JSON.parse(text) as Record<string, unknown>; }
      catch { continue; }
      const { id, method } = message as { id?: number; method?: string };
      if (id === undefined || method === undefined) continue;
      const params = (message.params ?? {}) as Record<string, unknown>;
      if (method === 'initialize') greetings.push(params);
      const channel = typeof params.channel === 'string' ? params.channel : '';
      const result = method === 'initialize'
        ? { protocolVersion: '1.1.0', serverSeq: 1, snapshots: [{ resource: ROOT, state: { agents: [], terminals: [] }, fromSeq: 1 }] }
        : method === 'subscribe' ? { snapshot: { resource: channel, state: {}, fromSeq: 1 } } : {};
      await transport.send(JSON.stringify({ jsonrpc: '2.0', id, result }));
    }
  })();
  return greetings;
}

/** A live host over a scripted one, with no `clientId` given, and the `initialize` requests it sent. */
async function connect(): Promise<{ host: Awaited<ReturnType<typeof liveHost>>; greetings: Record<string, unknown>[] }> {
  let greetings: Record<string, unknown>[] = [];
  const host = await liveHost({
    url: 'ws://scripted',
    backoff: [0],
    keepaliveMs: 0,
    lingerMs: 0,
    connect: async (): Promise<AhpTransport> => {
      const [mine, theirs] = InMemoryTransport.pair();
      greetings = scripted(theirs);
      return mine;
    },
  });
  return { host, greetings };
}

const kept = { LC_ALL: process.env.LC_ALL, LC_MESSAGES: process.env.LC_MESSAGES, LANG: process.env.LANG };

afterEach(() => {
  for (const [key, value] of Object.entries(kept)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('what ahpc tells a host it is', () => {
  it('names itself in initialize, with this build\'s version', async () => {
    const { host, greetings } = await connect();
    expect(greetings).toHaveLength(1);
    expect(greetings[0]!.clientInfo).toEqual({ name: 'ahpc', title: 'ahpc', version: version() });
    expect(greetings[0]!.protocolVersions).toContain('1.1.0');
    expect(greetings[0]!.initialSubscriptions).toEqual([ROOT]);
    await host.close();
  });

  it('sends its locale beside it, and none when the environment names none', async () => {
    process.env.LC_ALL = 'pt_BR.UTF-8';
    const named = await connect();
    expect(named.greetings[0]!.locale).toBe('pt-BR');
    await named.host.close();
    process.env.LC_ALL = 'C';
    const none = await connect();
    expect(none.greetings[0]).not.toHaveProperty('locale');
    await none.host.close();
  });

  it('makes a client id of ahpc- and a whole UUID', async () => {
    const { host, greetings } = await connect();
    expect(greetings[0]!.clientId).toMatch(/^ahpc-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    await host.close();
  });
});
