/**
 * The end of a process that a socket would hold open.
 *
 * A run ends when the event loop drains. A socket whose host never answered
 * the close frame, such as a VS Code tunnel gateway, keeps the loop alive with
 * nothing left to do, and Node's `WebSocket` has no way to drop it. The close
 * marks such a socket here, and the entry point then ends the process itself.
 */

/** Whether a socket was left closing when its close stopped waiting. */
let held = false;

/** Mark a socket that did not finish closing. */
export function socketHeld(): void {
  held = true;
}

/**
 * End the process once what it wrote has left, when a socket would hold it.
 *
 * Both streams are flushed first, because a write to a pipe can still be
 * queued. The exit code is `process.exitCode`.
 */
export async function exitIfHeld(): Promise<void> {
  if (!held) return;
  await new Promise<void>((done) => process.stdout.write('', () => done()));
  await new Promise<void>((done) => process.stderr.write('', () => done()));
  process.exit();
}
