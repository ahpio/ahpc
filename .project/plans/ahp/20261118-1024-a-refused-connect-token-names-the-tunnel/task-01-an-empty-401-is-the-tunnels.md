---
title: An empty 401 through a tunnel is the tunnel's
status: done
depends: []
layer: "ahp"
refs:
  - "[code://src/ahp/refused.ts#L32-L86](../../../../src/ahp/refused.ts#L32-L86) - `whyNoConnection` and `shortText`"
  - "[code://test/refused.test.ts](../../../../test/refused.test.ts) - the loopback hosts"
---

## Objective

Through a tunnel with a connect token sent, a 401 with an empty body says the connect token was refused.

## Files

- `UPDATE: src/ahp/refused.ts:32-86` - `whyNoConnection` reads whether the body is empty.
- `UPDATE: test/refused.test.ts` - an empty 401 and a 401 with a body, through a tunnel with headers.
- `UPDATE: .project/pending/a-tunnel-host-is-reached-by-address.md` - step 8 passes on `refused the connect token`.

## Steps

1. In `shortText`, answer whether the body was empty beside the text it quotes.
2. In `whyNoConnection`, answer `tunnelRefused(host, id, true)` for a 401 with an empty body, when the tunnel sent headers.
3. Keep the host's sentence for a 401 with a body, and for every 401 with no tunnel headers.
4. Test both 401s against a loopback host, with tunnel headers and without.
5. Run step 8 of the tunnel check, and note the sentence it prints.

## Validation

- `test/refused.test.ts`: an empty 401 with tunnel headers says `refused the connect token`; with a body, the host's sentence.
- `npx vitest run test/refused.test.ts test/tunnel.test.ts` and `npm run typecheck` pass.

## Resume

Done. Against a private tunnel on 2026-11-18, a bad connect token printed `refused the connect token` and exited in 1 s.
A wrong host token behind a good connect token kept the host's sentence.
