# HORIZON Agent Ledger

`ledger.json` is the single shared record of the [v2 sequential prompt pack](../plans/horizon-v2/README.md): which prompt is being worked, by whom, on which branch, with what evidence, and which audit findings it closed. Every agent reads it before starting and writes to it at each transition. `npm test` runs `test/plan-ledger.test.mjs`, which rejects an inconsistent ledger, so a bad update fails CI.

## Lifecycle

```text
todo ──claim──▶ claimed ──start──▶ in_progress ──PR opened──▶ review ──merged──▶ done
                   │                    │
                   └──────▶ blocked ◀───┘   (blockers[] says why; back to in_progress when cleared)
```

| Status | Required fields | Rule |
|---|---|---|
| `todo` | none | default |
| `claimed` | `owner`, `branch`, `startedAt` | the previous prompt is `done` |
| `in_progress` | `owner`, `branch`, `startedAt` | same |
| `blocked` | `owner`, `branch`, `startedAt`, `blockers` (non-empty) | say exactly what is needed and from whom |
| `review` | `owner`, `branch`, `startedAt`, `pr`, `evidence.tests` (non-empty) | the PR is open and its checks have run |
| `done` | `commits` (non-empty), `completedAt`, `evidence.tests` (non-empty) | the merge commit is on `main` |

## Protocol

1. **One prompt at a time, in order.** Work only on the first prompt that is not `done`. Its predecessor must be `done`; the test enforces it.
2. **Claim before coding.** Set `claimed`, your `owner` id (session URL or name), `branch`, and `startedAt` (ISO date), and commit that change alone as the first commit of your branch.
3. **Record evidence, not adjectives.**
   - `evidence.tests` lists the commands run with pass counts (`"npm test: 612/612"`).
   - `evidence.screenshots` lists committed capture paths.
   - `evidence.measurements` lists numbers with units and the comparison they support (`"NGFP g* = 0.7071 vs Litim 2004 0.707"`, `"QFT view renderers 4 → 1"`).
4. **Close findings.** Set each finding the prompt closes to `closed` and, after merge, `closedIn` to the merge commit. A finding accepted as a limitation instead gets `status: "accepted"` and a `decisions` entry naming it.
5. **Write decisions down.** Any deviation from the prompt gets a `decisions` entry `D-nnn` with date, prompt, decision, and rationale. Deviations include a literature value that differs from the one quoted, a scope cut, a different algorithm, or a missed performance target.
6. **Append to `log`.** One entry per transition: `{ date, prompt, agent, event, detail }`. Never rewrite past entries.
7. **Update `updated`** to the date of your change.

## Checking the ledger locally

```bash
node --test test/plan-ledger.test.mjs
```

The test verifies:
- schema and status rules;
- strict sequencing (each prompt depends only on its predecessor, and nothing starts before it is done);
- that every prompt file exists and starts with its title;
- that the pack index links every prompt;
- finding cross-references in both directions.
