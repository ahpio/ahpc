/**
 * The selection gateway of a VS Code tunnel at protocol 6 or higher.
 *
 * From protocol 6 the VS Code CLI serves `/agent-host/select` on the agent
 * host port. A tunnel bound to one agent host, such as the editor's own,
 * answers its root route with 503 and serves only this route. The handshake is
 * three messages on the socket, and AHP follows on the same socket:
 *
 * 1. the host sends its inventory, the agent hosts it can reach;
 * 2. the client sends a pick, one `instanceId` or `newDedicated`;
 * 3. the host sends `{ ok: true }`, or `{ ok: false, error }`.
 *
 * The gateway gives the picked host its own connection token, so the client
 * sends none. VS Code's `tunnelAgentHost.ts` and `tunnelGatewaySelection.ts`
 * are the reference, and the CLI's `cli/src/tunnels/agent_host.rs` the server.
 */

/** The route of the gateway, VS Code's `TUNNEL_GATEWAY_SELECT_PATH`. */
export const GATEWAY_PATH = '/agent-host/select';

/** The lowest protocol label with a gateway, VS Code's `TUNNEL_GATEWAY_MIN_PROTOCOL_VERSION`. */
export const GATEWAY_PROTOCOL = 6;

/** How long each message of the handshake is waited for, VS Code's `TUNNEL_STEP_TIMEOUT_MS`. */
export const STEP_TIMEOUT_MS = 30_000;

/**
 * Which agent host to pick on a tunnel that is not bound to one.
 *
 * `editor` is the editor's own host when one runs; `dedicated` is a standalone
 * host, started by the gateway when none runs.
 */
export type TunnelHost = 'editor' | 'dedicated';

/** The values `tunnelHost` and `--tunnel-host` take. */
export const TUNNEL_HOSTS: readonly TunnelHost[] = ['editor', 'dedicated'];

/** One agent host in the inventory. */
export interface GatewayEndpoint {
  type: 'editor' | 'standalone';
  instanceId: string;
}

/** What the gateway sends first. */
export interface Inventory {
  endpoints: GatewayEndpoint[];
  /** The one host a bound tunnel serves. */
  delegatedInstanceId?: string;
}

/** What the client sends back. */
export type Selection = { instanceId: string } | { newDedicated: true };

/** The handshake failed. Its message is the reason, in words that follow "Could not reach <host>:". */
export class GatewayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayError';
  }
}

/** The gateway would not open the picked host. Its message is the gateway's own reason. */
export class GatewayRefused extends GatewayError {
  constructor(message: string) {
    super(message);
    this.name = 'GatewayRefused';
  }
}

/** The JSON in a message of the gateway, or a `GatewayError`. */
function parsed(text: string): unknown {
  try {
    return JSON.parse(text);
  }
  catch {
    throw new GatewayError('the tunnel gateway sent a message that is not JSON');
  }
}

/** The inventory in a message, or a `GatewayError` that says what is wrong with it. */
export function inventoryOf(text: string): Inventory {
  const held = parsed(text) as { endpoints?: unknown; delegatedInstanceId?: unknown } | null;
  if (typeof held !== 'object' || held === null || !Array.isArray(held.endpoints)) {
    throw new GatewayError('the tunnel gateway sent no list of agent hosts');
  }
  const endpoints = held.endpoints.filter((one): one is GatewayEndpoint => (
    typeof one === 'object' && one !== null
    && ((one as GatewayEndpoint).type === 'editor' || (one as GatewayEndpoint).type === 'standalone')
    && typeof (one as GatewayEndpoint).instanceId === 'string'
  )).map((one) => ({ type: one.type, instanceId: one.instanceId }));
  return {
    endpoints,
    ...(typeof held.delegatedInstanceId === 'string' && held.delegatedInstanceId !== ''
      ? { delegatedInstanceId: held.delegatedInstanceId }
      : {}),
  };
}

/** The live hosts of one type, by `instanceId`, less the ones refused before. */
const ofType = (inventory: Inventory, type: GatewayEndpoint['type'], skip: ReadonlySet<string>): GatewayEndpoint[] =>
  inventory.endpoints
    .filter((one) => one.type === type && !skip.has(one.instanceId))
    .sort((a, b) => a.instanceId.localeCompare(b.instanceId));

/**
 * The pick for one inventory.
 *
 * A bound tunnel gets its bound host, because the gateway serves no other.
 * Otherwise `editor` takes the first editor host and falls back as `dedicated`
 * does, which takes the first standalone host or asks for a new one. `skip`
 * holds the hosts the gateway refused on earlier attempts.
 */
export function pick(inventory: Inventory, prefer: TunnelHost, skip: ReadonlySet<string> = new Set()): Selection {
  if (inventory.delegatedInstanceId !== undefined) return { instanceId: inventory.delegatedInstanceId };
  const editor = prefer === 'editor' ? ofType(inventory, 'editor', skip)[0] : undefined;
  if (editor !== undefined) return { instanceId: editor.instanceId };
  const standalone = ofType(inventory, 'standalone', skip)[0];
  return standalone !== undefined ? { instanceId: standalone.instanceId } : { newDedicated: true };
}

/** The next text message on a socket, or a `GatewayError` when it closes or the wait ends. */
function nextMessage(socket: WebSocket, step: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const done = (): void => {
      clearTimeout(timer);
      socket.removeEventListener('message', got);
      socket.removeEventListener('close', closed);
      socket.removeEventListener('error', closed);
    };
    const got = (event: MessageEvent): void => {
      done();
      if (typeof event.data === 'string') resolve(event.data);
      else new Response(event.data as Blob | ArrayBuffer).text().then(resolve, reject);
    };
    const closed = (): void => { done(); reject(new GatewayError(`the tunnel gateway closed before its ${step}`)); };
    const timer = setTimeout(() => { done(); reject(new GatewayError(`the tunnel gateway sent no ${step} in ${String(timeoutMs / 1000)} seconds`)); }, timeoutMs);
    socket.addEventListener('message', got);
    socket.addEventListener('close', closed);
    socket.addEventListener('error', closed);
  });
}

/**
 * Run the handshake on an open socket, and leave it ready for AHP.
 *
 * A host the gateway refuses goes in `skip`, so the next attempt picks
 * another, as VS Code's `selectGatewayFallbackAfterRejection` does.
 */
export async function select(
  socket: WebSocket,
  prefer: TunnelHost,
  skip: Set<string>,
  timeoutMs: number = STEP_TIMEOUT_MS,
): Promise<void> {
  const inventory = inventoryOf(await nextMessage(socket, 'list of agent hosts', timeoutMs));
  const chosen = pick(inventory, prefer, skip);
  socket.send(JSON.stringify(chosen));
  const answer = parsed(await nextMessage(socket, 'answer to the pick', timeoutMs)) as { ok?: unknown; error?: unknown } | null;
  if (answer?.ok === true) return;
  if ('instanceId' in chosen && inventory.delegatedInstanceId === undefined) skip.add(chosen.instanceId);
  const why = typeof answer?.error === 'string' && answer.error !== '' ? answer.error.replace(/\.$/, '') : 'no reason given';
  throw new GatewayRefused(why);
}
