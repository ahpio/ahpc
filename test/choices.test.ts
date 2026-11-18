/*
 * What a new session last started with, per host, in `choices.json`.
 *
 * The config folder is a temporary one, so the file is read back from disk.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { choicesPath, keepChoice, readChoice } from '../src/choices.js';

let home: string;
let had: string | undefined;

beforeEach(() => {
  had = process.env.XDG_CONFIG_HOME;
  home = mkdtempSync(join(tmpdir(), 'ahpc-choices-'));
  process.env.XDG_CONFIG_HOME = home;
});

afterEach(() => {
  if (had === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = had;
  rmSync(home, { recursive: true, force: true });
});

describe('the last choice per host', () => {
  it('reads back what was kept for an address, and another address keeps its own', () => {
    keepChoice('ws://one.example.com', { provider: 'claude', model: 'opus', modelConfig: { effort: 'medium' } });
    keepChoice('tunnel:abc.usw2', { provider: 'copilotcli' });
    keepChoice('ws://one.example.com', { provider: 'claude', model: 'sonnet' });

    expect(readChoice('ws://one.example.com')).toEqual({ provider: 'claude', model: 'sonnet' });
    expect(readChoice('tunnel:abc.usw2')).toEqual({ provider: 'copilotcli' });
    expect(readChoice('ws://other.example.com')).toBeUndefined();
  });

  it('reads a missing, broken or misshapen file as no choice', () => {
    expect(readChoice('ws://one.example.com')).toBeUndefined();
    mkdirSync(dirname(choicesPath()), { recursive: true });
    writeFileSync(choicesPath(), '{ not json');
    expect(readChoice('ws://one.example.com')).toBeUndefined();
    writeFileSync(choicesPath(), JSON.stringify({ 'ws://one.example.com': { model: 'opus' } }));
    expect(readChoice('ws://one.example.com')).toBeUndefined();
  });
});
