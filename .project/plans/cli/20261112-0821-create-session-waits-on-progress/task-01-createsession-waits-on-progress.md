---
title: createSession waits on progress
status: todo
depends: []
layer: "ahp, cli"
refs:
  - "[code://src/ahp/live.ts#L1655](../../../../src/ahp/live.ts#L1655) - the client config"
  - "[code://src/ahp/live.ts#L2546-L2553](../../../../src/ahp/live.ts#L2546-L2553) - the `createSession` request"
---

## Objective

ahpc runs its own request limits: 30 s for every request, and for `createSession` 60 s that start again at each `root/progress` on its token.

## Files

- `UPDATE: src/ahp/live.ts:1655` - make the client with `requestTimeoutMs: 0`.
- `UPDATE: src/ahp/live.ts:1958` - the same config at a reconnect.
- `UPDATE: src/ahp/live.ts:1603-1617` - a `root/progress` on a waiting token starts its timer again.
- `UPDATE: src/ahp/live.ts:2546-2553` - `createSession` goes through the wrapper with its token.
- `UPDATE: src/cli/main.ts:998-1008` - `session new` prints progress messages on stderr.
- `UPDATE: test/` - cases with a fake host for progress, no progress and another request.

## Steps

1. Pass `{ requestTimeoutMs: 0 }` at both places that make a client.
2. Write a function `timed` in `live.ts` that wraps `client.request` with a timer.
3. Make `timed` throw a sentence that names the method and the seconds.
4. Send every request through `timed` with 30 s.
5. For `createSession`, register its token so that each `root/progress` on it starts the 60 s again.
6. Clear the timer and the token when the request answers or throws.
7. Print each progress message for the token on stderr in `session new`.
8. Write the cases with fake timers.

## Validation

- The new case with progress sees a create answer after 90 s.
- The new case with no progress sees a create fail at 60 s.
- The new case for another request sees it fail at 30 s.
- `npm test` and the typecheck pass.

## Resume
