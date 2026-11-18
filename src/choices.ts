/**
 * The agent, model and model options a new session last started with, per host.
 *
 * `choices.json` beside the config file, keyed by the host's address as the
 * person gave it. It holds no secret, so it is written as `update.json` is.
 * The screen writes it when a session starts, and reads it at boot to start the
 * next session the same way.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { statePath } from './config.js';

/** What a new session started with on one host. */
export interface Choice {
  /** The agent, by provider. */
  provider: string;
  /** The model, by id. Absent is the host's default. */
  model?: string;
  /** The model's own options, such as effort, by key. */
  modelConfig?: Record<string, string>;
}

/** Where the choices are kept. */
export const choicesPath = (): string => statePath('ahpc', 'choices.json');

/** A choice as the file holds it, or nothing for anything that is not one. */
function choiceOf(value: unknown): Choice | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const held = value as Record<string, unknown>;
  if (typeof held.provider !== 'string' || held.provider === '') return undefined;
  const model = typeof held.model === 'string' && held.model !== '' ? held.model : undefined;
  const options = typeof held.modelConfig === 'object' && held.modelConfig !== null
    ? Object.fromEntries(Object.entries(held.modelConfig).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    : {};
  return {
    provider: held.provider,
    ...(model !== undefined ? { model } : {}),
    ...(Object.keys(options).length > 0 ? { modelConfig: options } : {}),
  };
}

/** Every host's choice. A missing, broken or misshapen file is no choice at all. */
function readAll(): Record<string, Choice> {
  try {
    const found = JSON.parse(readFileSync(choicesPath(), 'utf8')) as unknown;
    if (typeof found !== 'object' || found === null) return {};
    return Object.fromEntries(Object.entries(found).flatMap(([address, value]) => {
      const choice = choiceOf(value);
      return choice === undefined ? [] : [[address, choice] as const];
    }));
  }
  catch { return {}; }
}

/** The choice kept for one host, or nothing. */
export function readChoice(address: string): Choice | undefined {
  return readAll()[address];
}

/**
 * Keep one host's choice, and every other host's as it was.
 *
 * A write that fails is dropped: a choice not remembered is the screen as it
 * was before this existed, which is no reason to stop a session starting.
 */
export function keepChoice(address: string, choice: Choice): void {
  const kept = choiceOf(choice);
  if (kept === undefined) return;
  try {
    const file = choicesPath();
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify({ ...readAll(), [address]: kept }, null, 2)}\n`);
  }
  catch { /* nothing to report, by design */ }
}
