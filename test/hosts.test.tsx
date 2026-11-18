import { describe, expect, it } from 'vitest';
import { renderApp } from '@textui/testing';
import type { Harness } from '@textui/testing';
import { registerChat } from '../src/app.js';
import { fakeHost } from '../src/ahp/fake.js';
import type { HostAbout } from '../src/ahp/types.js';
import { MODEL, PROVIDER } from '../src/state.js';

/*
 * The hosts screen: a page of what the host said about itself.
 *
 * The scripted host answers every field, so each section has something to
 * draw. A host that left something out is the scripted one with that field
 * taken away, which is what checks that the page invents nothing.
 */

async function mounted(options: { width?: number; height?: number; about?: (about: HostAbout) => HostAbout } = {}): Promise<Harness> {
  const host = fakeHost();
  if (options.about !== undefined) {
    const scripted = host.about.bind(host);
    const change = options.about;
    host.about = async () => change(await scripted());
  }
  const t = await renderApp({
    width: options.width ?? 110,
    height: options.height ?? 40,
    shell: 'workbench',
    theme: 'workbench',
    onBoot: (app) => { registerChat(app, { host }); },
  });
  for (let i = 0; i < 8; i++) await t.settle();
  await t.app.execute('hosts.show');
  for (let i = 0; i < 12; i++) await t.settle();
  return t;
}

describe('the hosts screen', () => {
  it('draws each section the host sent, with one of its rows', async () => {
    const t = await mounted({ height: 80 });
    const shown = t.text();
    for (const [title, row] of [
      ['Connection', 'Protocol'], ['Server', 'Software'], ['Machine', 'Platform'], ['Automations', 'automations'],
      ['Agents', 'model'], ['Agent settings', 'scripted.speed'], ['Trusted folders', '/work'],
    ] as const) {
      expect(shown).toContain(title);
      expect(shown).toContain(row);
    }
    expect(shown).toContain('linux, x64');
    expect(shown).toContain('8.0 GiB');
    await t.unmount();
  });

  it('draws no machine for a host that sent none', async () => {
    const t = await mounted({ about: ({ machine: _machine, ...rest }) => rest });
    expect(t.text()).not.toContain('Machine');
    expect(t.text()).toContain('Server');
    await t.unmount();
  });

  it('scrolls to the sections below the screen', async () => {
    const t = await mounted({ width: 80, height: 24 });
    expect(t.text()).not.toContain('Trusted folders');
    t.focus('hosts.page');
    await t.settle();
    for (let i = 0; i < 4; i++) { await t.press('pagedown'); await t.settle(); }
    expect(t.text()).toContain('Trusted folders');
    await t.unmount();
  });
});

describe('the agents on the hosts screen', () => {
  /** The scripted host's first agent, and one of its models. */
  const AGENT = 'Claude Code';

  it('opens the selected agent on enter, and closes it on a second', async () => {
    const t = await mounted({ height: 80 });
    const model = (await fakeHost().agents())[0]!.models[0]!.displayName;
    expect(t.text()).not.toContain(model);
    await t.press('enter');
    for (let i = 0; i < 4; i++) await t.settle();
    expect(t.text()).toContain(model);
    await t.press('enter');
    for (let i = 0; i < 4; i++) await t.settle();
    expect(t.text()).not.toContain(model);
    await t.unmount();
  });

  it('opens an agent on a click', async () => {
    const t = await mounted({ height: 80 });
    const model = (await fakeHost().agents())[0]!.models[0]!.displayName;
    const row = t.getAllByRole('treeitem').find((item) => item.label === AGENT)!.rect!;
    t.click(row.x + 2, row.y);
    for (let i = 0; i < 4; i++) await t.settle();
    expect(t.text()).toContain(model);
    await t.unmount();
  });

  it('starts a new session with the selected agent on n', async () => {
    const t = await mounted({ height: 80 });
    await t.press('down');
    await t.settle();
    await t.press('n');
    for (let i = 0; i < 8; i++) await t.settle();
    expect(t.app.screens.current()?.id).toBe('new');
    expect(t.app.store.get(PROVIDER)).toBe('copilotcli');
    await t.unmount();
  });

  it('opens at the top, and scrolls to keep the selected agent on screen', async () => {
    const t = await mounted({ width: 80, height: 24 });
    expect(t.text()).toContain('Connection');
    expect(t.text()).not.toContain('Copilot CLI');
    await t.press('down');
    for (let i = 0; i < 6; i++) await t.settle();
    expect(t.text()).toContain('Copilot CLI');
    await t.unmount();
  });

  it('starts the session with the selected model, when the row is a model', async () => {
    const t = await mounted({ height: 80 });
    const model = (await fakeHost().agents())[0]!.models[0]!;
    await t.press('enter');
    await t.settle();
    await t.press('down');
    await t.settle();
    await t.press('n');
    for (let i = 0; i < 8; i++) await t.settle();
    expect(t.app.screens.current()?.id).toBe('new');
    expect(t.app.store.get(PROVIDER)).toBe('claude');
    expect(t.app.store.get(MODEL)).toBe(model.id);
    await t.unmount();
  });

  it('leaves the model to the host on an agent row', async () => {
    const t = await mounted({ height: 80 });
    await t.press('n');
    for (let i = 0; i < 8; i++) await t.settle();
    expect(t.app.store.get(PROVIDER)).toBe('claude');
    expect(t.app.store.get(MODEL) ?? '').toBe('');
    await t.unmount();
  });
});

describe('the facts on the hosts screen', () => {
  /** The column a text starts at, on the line that holds it. */
  const columnOf = (t: Harness, text: string): number => {
    const line = t.lines().find((one) => one.includes(text));
    return line === undefined ? -1 : line.indexOf(text);
  };

  it('lines the values up down the page, two pairs to a line when wide', async () => {
    const t = await mounted({ width: 160, height: 80 });
    // The left values, and the right labels, each start in one column.
    expect(columnOf(t, '1.1.0')).toBe(columnOf(t, 'scripted host'));
    expect(columnOf(t, '1.1.0')).toBe(columnOf(t, 'linux, x64'));
    expect(columnOf(t, 'Connected')).toBe(columnOf(t, 'Version'));
    expect(columnOf(t, 'Connected')).toBe(columnOf(t, 'CPUs'));
    expect(t.lines().some((line) => line.includes('Protocol') && line.includes('Connected'))).toBe(true);
    await t.unmount();
  });

  it('draws one pair to a line when narrow', async () => {
    const t = await mounted({ width: 70, height: 80 });
    expect(t.lines().some((line) => line.includes('Protocol') && line.includes('Connected'))).toBe(false);
    expect(columnOf(t, '1.1.0')).toBe(columnOf(t, 'scripted host'));
    await t.unmount();
  });
});
