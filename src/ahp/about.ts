/**
 * What a host said about itself, read out of the words it used.
 *
 * Two places hold it: the `initialize` answer, and the root state. The root
 * `_meta` keys are VS Code's names, which ahpd writes too, and are read by
 * name as ahpw reads them. A key that is missing, or holds the wrong type, is
 * left out of the answer rather than guessed at.
 */

import type { HostAbout } from './types.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag | undefined =>
  (typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Bag : undefined);
const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);
const count = (value: unknown): number | undefined =>
  (typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined);

/** An object with only the fields that have a value, or nothing when none has. */
function some<T extends object>(value: T): T | undefined {
  const kept = Object.fromEntries(Object.entries(value).filter(([, one]) => one !== undefined)) as T;
  return Object.keys(kept).length > 0 ? kept : undefined;
}

/** What the connection knows about itself, beside what the host sent. */
export interface Connected {
  /** The `initialize` answer the connection last came up on. */
  answer: unknown;
  /** The root state, as the mirror holds it. */
  root: unknown;
  clientId: string;
  connectedAt?: number;
  channels: number;
  serverSeq: number;
}

/** The host's facts, from its `initialize` answer and its root state. */
export function hostAbout(from: Connected): HostAbout {
  const answer = bagOf(from.answer) ?? {};
  const root = bagOf(from.root) ?? {};
  const meta = bagOf(answer._meta) ?? {};
  const rootMeta = bagOf(root._meta) ?? {};

  const info = bagOf(answer.serverInfo);
  const serverName = text(info?.name);
  const build = bagOf(rootMeta.hostBuild);
  const box = bagOf(rootMeta['vscode.agentHost.resources']);
  const trust = bagOf(bagOf(bagOf(root.config)?.values)?.workspaceTrust);
  const trustedUris = Array.isArray(trust?.trustedUris)
    ? trust.trustedUris.filter((one): one is string => typeof one === 'string' && one !== '')
    : undefined;
  // ahpd names its own keys `ahpd.<name>`, and an older one left the prefix off.
  const principal = text(meta['ahpd.principal']) ?? text(meta.principal);

  const about: HostAbout = {
    clientId: from.clientId,
    channels: from.channels,
    serverSeq: from.serverSeq,
    settings: settingsOf(rootMeta['vscode.agentCustomizationSettings']),
  };
  const machine = some({
    platform: text(box?.platform),
    architecture: text(box?.architecture),
    cpus: count(box?.cpuCount),
    memoryBytes: count(box?.memoryBytes),
  });
  const built = some({ version: text(build?.version), commit: text(build?.commit), date: text(build?.date) });
  return {
    ...about,
    ...(from.connectedAt !== undefined ? { connectedAt: from.connectedAt } : {}),
    ...(text(answer.protocolVersion) !== undefined ? { protocolVersion: text(answer.protocolVersion) as string } : {}),
    ...(principal !== undefined ? { principal } : {}),
    ...(serverName !== undefined
      ? { server: { name: serverName, ...(text(info?.version) !== undefined ? { version: text(info?.version) as string } : {}) } }
      : {}),
    ...(built !== undefined ? { build: built } : {}),
    ...(text(answer.defaultDirectory) !== undefined ? { defaultDirectory: text(answer.defaultDirectory) as string } : {}),
    ...(count(root.activeSessions) !== undefined ? { activeSessions: count(root.activeSessions) as number } : {}),
    ...(machine !== undefined ? { machine } : {}),
    ...(trustedUris !== undefined ? { trusted: trustedUris } : {}),
  };
}

/** The settings pages, each with a provider and a title; any other entry is dropped. */
function settingsOf(value: unknown): HostAbout['settings'] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const page = bagOf(entry);
    const provider = text(page?.provider);
    const title = text(page?.title);
    if (provider === undefined || title === undefined) return [];
    const keys = (Array.isArray(page?.settings) ? page.settings : [])
      .map((setting) => text(bagOf(setting)?.key))
      .filter((key): key is string => key !== undefined);
    const description = text(page?.description);
    return [{ provider, title, ...(description !== undefined ? { description } : {}), keys }];
  });
}
