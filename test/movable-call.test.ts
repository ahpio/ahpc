import { describe, expect, it } from 'vitest';
import type { ToolCall, Turn } from '../src/ahp/types.js';
import { movableCall } from '../src/state.js';

const call = (id: string, fields: Partial<ToolCall>): { kind: 'toolCall'; id: string; call: ToolCall } => ({
  kind: 'toolCall',
  id,
  call: { id, name: 'Bash', toolName: 'Bash', status: 'running', ...fields } as ToolCall,
});

const turn = (parts: unknown[]): Turn => ({ id: 't1', role: 'agent', parts, state: 'running' }) as unknown as Turn;

describe('movableCall', () => {
  it('is null with no turn, and with no call that can move', () => {
    expect(movableCall(null)).toBeNull();
    expect(movableCall(turn([]))).toBeNull();
    expect(movableCall(turn([call('a', {})]))).toBeNull();
  });

  it('names the running call that can move', () => {
    expect(movableCall(turn([call('a', { movable: true })]))).toBe('a');
  });

  it('names the last of several, the one most recently started', () => {
    expect(movableCall(turn([call('a', { movable: true }), call('b', { movable: true })]))).toBe('b');
  });

  it('skips a call that has finished, even one that was movable', () => {
    expect(movableCall(turn([call('a', { movable: true }), call('b', { movable: true, status: 'completed' })]))).toBe('a');
  });
});
