# HORIZON Agent Ledger

`ledger.json` is the single shared record of who is doing what in the [v2 prompt pack](../plans/2026-10-21-horizon-v2-prompt-pack.md). Every agent, human or AI, reads it before starting and writes to it at each transition. `npm test` runs `test/plan-ledger.test.mjs`, which rejects an inconsistent ledger, so a bad update fails CI.

## Lifecycle

```text
todo ──claim──▶ claimed ──start──▶ in_progress ──PR opened──▶ review ──merged──▶ done
                   │                    │
                   └──────▶ blocked ◀───┘   (blockers[] says why; back to in_progress when cleared)
```

| Status | Required fields | Rule |
|---|---|---|
| `todo` | none | default |
| `claimed` | `owner`, `branch`, `startedAt` | every `dependsOn` prompt is `done` |
| `in_progress` | `owner`, `branch`, `startedAt` | same |
| `blocked` | `owner`, `branch`, `blockers` (non-empty) | say what is needed and from whom |
| `review` | `owner`, `branch`, `pr`, `evidence.tests` (non-empty) | the PR is open and CI has run |
| `done` | `commits` (non-empty), `completedAt`, `evidence.tests` (non-empty) | the merge commit is on `main` |

## Protocol

1. **Claim before coding.** Pick the first `todo` prompt whose dependencies are all `done`. Commit a ledger change setting `claimed`, your `owner` id (session URL or name), your `branch`, and `startedAt` (ISO date). Push it to `main` through a tiny PR or the claim commit on your branch, whichever the maintainer has set up; if someone else's claim lands first, pick another prompt.
2. **Lock shared files.** Before editing `index.html`, `js/state.jsx`, `js/state-runtime.jsx`, `js/data.jsx`, `qa/manifest.json`, or `README.md`, add `{ "path", "prompt", "owner", "since" }` to `locks`. Remove it in the same commit that sets `review`. Do not edit a path another prompt has locked; coordinate in `log` instead.
3. **Record evidence, not adjectives.** `evidence.tests` lists commands run with pass counts (`"npm test: 612/612"`); `evidence.screenshots` lists committed capture paths; `evidence.measurements` lists numbers with units and the comparison they support (`"NGFP g* = 0.7071 vs Litim 2004 0.707"`).
4. **Close findings.** When a prompt closes a finding, set that finding's `status` to `closed` and `closedIn` to the merge commit. A finding accepted as a limitation instead gets `status: "accepted"` and a matching entry in `decisions`.
5. **Write decisions down.** Any deviation from the pack (a value that disagreed with the primary source, a scope cut, a different algorithm) gets a `decisions` entry `D-nnn` with date, prompt, decision, and rationale.
6. **Append to `log`.** One entry per transition: `{ date, prompt, agent, event, detail }`. Never rewrite past entries.
7. **Update `updated`** to the date of your change.

## Lanes

After `V2-A3` is `done`, Phase B runs in three lanes that may proceed concurrently (the `lane` field). Inside a lane prompts run in order; across lanes, only the ledger locks and a rebase before merge coordinate the work.

| Lane | Prompts | Theme |
|---|---|---|
| 1 | B1 → B2 → B3 → B6 | matter, fields, scale |
| 2 | B4 → B5 | geometry and the Planck frontier |
| 3 | B7 → B8 (B8 also needs B5) | horizons and data |

## Checking the ledger locally

```bash
node --test test/plan-ledger.test.mjs
```

It verifies the schema, status rules, dependency order (no cycles, no work started before its dependencies are done), lock ownership, finding cross-references, and that every prompt id in the ledger has a matching `## V2-xx` section in the pack.
