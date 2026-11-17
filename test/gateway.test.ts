/*
 * The selection gateway of a VS Code tunnel at protocol 6.
 *
 * The socket is a stand-in that plays the gateway's half: it sends the
 * inventory when asked to, keeps what the client sends, and answers the pick
 * with what the case says. The messages are the ones the VS Code CLI sends,
 * from `cli/src/tunnels/agent_host.rs` at `1564f100807a`.
 */

import { describe, expect, it } from 'vitest';
import { GatewayError, GatewayRefused, inventoryOf, pick, select, type Inventory } from '../src/ahp/gateway.js';

/** A socket whose far end is a gateway with one inventory and one answer. */
class FakeGateway extends EventTarget {
  sent: string[] = [];
  constructor(private readonly answer: unknown) { super(); }
  send(data: string): void {
    this.sent.push(data);
    queueMicrotask(() => this.say(JSON.stringify(this.answer)));
  }
  say(data: string): void { this.dispatchEvent(new MessageEvent('message', { data })); }
}

/** Run `select` against a fake, with the inventory sent once it listens. */
const handshake = async (fake: FakeGateway, inventory: unknown, skip = new Set<string>(), timeoutMs?: number): Promise<void> => {
  const running = select(fake as unknown as WebSocket, 'editor', skip, timeoutMs);
  if (inventory !== undefined) queueMicrotask(() => fake.say(typeof inventory === 'string' ? inventory : JSON.stringify(inventory)));
  return running;
};

const editor = { type: 'editor' as const, instanceId: 'ed-b' };
const editorToo = { type: 'editor' as const, instanceId: 'ed-a' };
const standalone = { type: 'standalone' as const, instanceId: 'sa-1' };

describe('the gateway pick', () => {
  it('takes the bound host of a bound tunnel, whatever is preferred', () => {
    const bound: Inventory = { endpoints: [editor, standalone], delegatedInstanceId: 'ed-b' };
    expect(pick(bound, 'editor')).toEqual({ instanceId: 'ed-b' });
    expect(pick(bound, 'dedicated')).toEqual({ instanceId: 'ed-b' });
    expect(pick(bound, 'dedicated', new Set(['ed-b']))).toEqual({ instanceId: 'ed-b' });
  });

  it('takes the first editor host for editor, and falls back as dedicated does', () => {
    expect(pick({ endpoints: [editor, editorToo, standalone] }, 'editor')).toEqual({ instanceId: 'ed-a' });
    expect(pick({ endpoints: [standalone] }, 'editor')).toEqual({ instanceId: 'sa-1' });
    expect(pick({ endpoints: [] }, 'editor')).toEqual({ newDedicated: true });
  });

  it('takes a standalone host for dedicated, or asks for a new one', () => {
    expect(pick({ endpoints: [editor, standalone] }, 'dedicated')).toEqual({ instanceId: 'sa-1' });
    expect(pick({ endpoints: [editor] }, 'dedicated')).toEqual({ newDedicated: true });
  });

  it('skips the hosts the gateway refused before', () => {
    expect(pick({ endpoints: [editorToo, standalone] }, 'editor', new Set(['ed-a']))).toEqual({ instanceId: 'sa-1' });
    expect(pick({ endpoints: [standalone] }, 'editor', new Set(['sa-1']))).toEqual({ newDedicated: true });
  });

  it('reads the CLI inventory, and keeps only the hosts it can name', () => {
    expect(inventoryOf(JSON.stringify({
      userDataPath: 'C:\\Users\\x\\AppData\\Roaming\\Code',
      endpoints: [{ type: 'editor', pid: 1, instanceId: 'ed-b', endpointKind: 'socket', endpointLabel: '\\\\.\\pipe\\x' }, { type: 'other', instanceId: 'z' }],
      delegatedInstanceId: 'ed-b',
    }))).toEqual({ endpoints: [editor], delegatedInstanceId: 'ed-b' });
    expect(() => inventoryOf('{}')).toThrow(GatewayError);
    expect(() => inventoryOf('not json')).toThrow(GatewayError);
  });
});

describe('the gateway handshake', () => {
  it('sends the pick and leaves the socket ready when the gateway answers ok', async () => {
    const fake = new FakeGateway({ ok: true, selected: { type: 'editor', instanceId: 'ed-b', role: 'primary', lifecycle: 'external' } });
    await handshake(fake, { userDataPath: '/u', endpoints: [editor], delegatedInstanceId: 'ed-b' });
    expect(fake.sent.map((one) => JSON.parse(one) as unknown)).toEqual([{ instanceId: 'ed-b' }]);
  });

  it('says the gateway reason when it refuses, and skips that host next time', async () => {
    const fake = new FakeGateway({ ok: false, error: 'Selected agent host instance ed-a is no longer live' });
    const skip = new Set<string>();
    const refused = handshake(fake, { userDataPath: '/u', endpoints: [editorToo] }, skip);
    await expect(refused).rejects.toThrow(new GatewayRefused('Selected agent host instance ed-a is no longer live'));
    expect(skip).toEqual(new Set(['ed-a']));
  });

  it('stops waiting for a gateway that sends nothing', async () => {
    await expect(handshake(new FakeGateway({ ok: true }), undefined, new Set(), 20))
      .rejects.toThrow('the tunnel gateway sent no list of agent hosts in 0.02 seconds');
  });

  it('stops when the gateway closes before it answers', async () => {
    const fake = new FakeGateway({ ok: true });
    const running = handshake(fake, undefined);
    fake.dispatchEvent(new Event('close'));
    await expect(running).rejects.toThrow('the tunnel gateway closed before its list of agent hosts');
  });
});
