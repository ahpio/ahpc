/*
 * A new session starts with what the last one on the same host started with.
 *
 * The scripted host is at `fake://scripted`, with Claude Code first and Copilot
 * CLI second. The config folder is a temporary one, so `choices.json` is real
 * and a restart is a second mount over the same folder.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderApp } from '@textui/testing';
import type { Harness } from '@textui/testing';
import { registerChat } from '../src/app.js';
import { fakeHost } from '../src/ahp/fake.js';
import { CONTROLLER } from '../src/control.js';
import { MODEL, MODEL_CONFIG, PROVIDER } from '../src/state.js';
import { keepChoice, readChoice } from '../src/choices.js';

const HOST = 'fake://scripted';

let home: string;
let had: string | undefined;

beforeEach(() => {
  had = process.env.XDG_CONFIG_HOME;
  home = mkdtempSync(join(tmpdir(), 'ahpc-remember-'));
  process.env.XDG_CONFIG_HOME = home;
});

afterEach(() => {
  if (had === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = had;
  rmSync(home, { recursive: true, force: true });
});

/** The screen over the scripted host, with remembering on or off. */
async function mounted(remember = true): Promise<Harness> {
  const t = await renderApp({
    width: 100,
    height: 30,
    onBoot: (app) => { registerChat(app, { host: fakeHost(), remember }); },
  });
  for (let i = 0; i < 8; i++) await t.settle();
  return t;
}

describe('the last choice on a host', () => {
  it('is kept when a session starts, and a restart starts with it', async () => {
    const first = await mounted();
    expect(first.app.store.get(PROVIDER)).toBe('claude');
    first.app.store.set(PROVIDER, 'copilotcli');
    await first.app.services.require(CONTROLLER).create({ provider: 'copilotcli' });
    await first.unmount();
    expect(readChoice(HOST)).toEqual({ provider: 'copilotcli' });

    const again = await mounted();
    expect(again.app.store.get(PROVIDER)).toBe('copilotcli');
    await again.unmount();
  });

  it('takes back the model and the options the model still offers', async () => {
    keepChoice(HOST, { provider: 'claude', model: 'claude-sonnet-5', modelConfig: { thinkingLevel: 'medium', gone: 'x' } });
    const t = await mounted();
    expect(t.app.store.get(PROVIDER)).toBe('claude');
    expect(t.app.store.get(MODEL)).toBe('claude-sonnet-5');
    expect(t.app.store.get(MODEL_CONFIG)).toEqual({ thinkingLevel: 'medium' });
    await t.unmount();
  });

  it('leaves out an agent, a model or a value the host no longer offers', async () => {
    keepChoice(HOST, { provider: 'claude', model: 'claude-sonnet-5', modelConfig: { thinkingLevel: 'max' } });
    const value = await mounted();
    expect(value.app.store.get(MODEL)).toBe('claude-sonnet-5');
    expect(value.app.store.get(MODEL_CONFIG)).toEqual({});
    await value.unmount();

    keepChoice(HOST, { provider: 'claude', model: 'claude-gone' });
    const model = await mounted();
    expect(model.app.store.get(PROVIDER)).toBe('claude');
    expect(model.app.store.get(MODEL) ?? '').toBe('');
    await model.unmount();

    keepChoice(HOST, { provider: 'gone' });
    const agent = await mounted();
    expect(agent.app.store.get(PROVIDER)).toBe('claude');
    await agent.unmount();
  });

  it('neither reads nor writes the file with remembering off', async () => {
    keepChoice(HOST, { provider: 'copilotcli' });
    const t = await mounted(false);
    // Not read: the host's first agent, though the file names the second.
    expect(t.app.store.get(PROVIDER)).toBe('claude');
    await t.app.services.require(CONTROLLER).create({ provider: 'claude' });
    await t.unmount();
    // Not written: the file still holds what it held.
    expect(readChoice(HOST)).toEqual({ provider: 'copilotcli' });
  });
});
