---
title: A connect token the tunnel refuses is named as the tunnel's - implemented
date: 2026-11-18
refs:
  - git://e0cb347
  - "[code://src/ahp/refused.ts](../../../../src/ahp/refused.ts)"
  - "[code://test/refused.test.ts](../../../../test/refused.test.ts)"
---

Through a tunnel with a connect token sent, an empty 401 now says the tunnel refused the connect token.
The sentence says how to get a new one.

## What was built

- [`code://src/ahp/refused.ts`](../../../../src/ahp/refused.ts) - `shortText` answers whether the body was empty; `whyNoConnection` reads an empty 401 as the tunnel's.
- [`code://test/refused.test.ts`](../../../../test/refused.test.ts) - 3 tests: an empty 401 with a connect token, a 401 with a body, and an empty 401 with none.

## Verified

- `npm run typecheck` and `npm test` pass.
- Against a private tunnel in front of a test ahpd, a bad connect token printed `refused the connect token` and exited in 1 s.
- A wrong host token behind a good connect token printed the host's sentence, and good tokens printed the session list.

## Departures from the plan

- None.
