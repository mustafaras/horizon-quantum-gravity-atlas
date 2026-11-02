# S35 — Scholarly Release Structure · **starter**

> Paste this file as the first message of a fresh agent session. It is a *pre-flight brief*, not a replacement for the
> contract: read [`S35-scholarly-release.md`](../plans/horizon-v2/S35-scholarly-release.md) first, then come back here.
>
> **State when written (2026-11-02):** measured at `c0f933a`, S34 `done`, working tree clean. Every number below was
> measured against that tree (`wc`, `grep`, a node script over the ledger), not read off the plan.

---

## 1. The gate is open

| check | value |
|---|---|
| S34 in ledger | `done`, `commits: [1c08f24, 1205f6a]` |
| S35 in ledger | `todo`, `dependsOn: ["S34"]`, `findings: ["F-19"]` |
| `node --test test/*.test.mjs` on `main` | 1359 pass, 0 fail, 1 skipped |
| `npm run validate` on `main` | repository valid · formula audit · provenance 89 entries · cover index 8 sidecars · generated theme sheets current |
| open findings | F-01 (S36 closes it), F-17, F-19 (this prompt), F-27 |

The plan's rule 3: if anything is red **before** your change, set the prompt `blocked` and stop. Nothing is red, so the
first action is step 1 of the contract — **claim S35** — and nothing else.

---

## 2. What the README actually is

`README.md` is **2,625 lines, 145 KB**, 30 `##` sections. The contract wants "at most ~400 lines". Three sections are 59 % of it:

| section | lines (from heading numbers) | where it goes |
|---|---|---|
| Extended Academic Appendix | 793 | `docs/guide/` or `docs/science/` |
| Mathematical Formulations | 575 | `docs/science/` (the equations already live in Formula Core; this is prose around them) |
| Visual Atlas | 193 | one cover per chapter in the README, the rest to `docs/guide/` |

Most of the rest are candidates for `docs/guide/`: Technical Architecture (131), Scientific Module Notes (144), Screenshot
Reproduction Guide (52), Quality Gates (35), Development Notes. **Keep in the README:** hero, what it is / is not, run
locally, cite, licence, one cover per chapter, a pointer to the ledger and the guide.

`docs/science/` holds **3** files today (`gr-null-geodesics`, `kerr-observatory`, `kerr-rendering`); `docs/guide/` does not exist.

### The Roadmap is already half done

The `## Roadmap` section (37 lines) opens by pointing at the v2 prompt pack, then lists 28 "Completed since the first
release" bullets. The contract says *replace the Roadmap with a pointer to the ledger*: the pointer should name
`docs/superpowers/ledger/ledger.json`, not the plans folder, and the completed-history list should go (the ledger `log`
holds it, with dates).

---

## 3. Three things that will fail `npm run validate` the moment you shorten the README

All three are in [`scripts/validate-repo.mjs`](../../../scripts/validate-repo.mjs). Step 2 of the contract says "update the
rules"; this is what they are:

1. **`README should reference at least 9 cinematic screenshots`** (line ~83) and **`at least 11 static diagrams`** (~88).
   They count local `<img src>` paths containing `docs/screenshots/` and `docs/diagrams/`. The README has **56 `<img>`
   tags: 27 unique screenshot paths, 12 unique diagram paths.** A 400-line README with one cover per chapter cannot
   hold 9 + 11. Move the thresholds to where the images now live (the guide pages), keep a smaller floor for the README
   itself, and say why in a ledger `decision`. Do not leave dead images in the README to satisfy a number.
2. **`README image path does not exist`** — every moved image path is checked. Moving files without updating `src` fails here.
3. **No `mermaid` fences, no "Unable to render rich display".** Both stay.

**There are no README anchor links from elsewhere** (`grep -rn 'README.md#'` over `md/mjs/jsx/json/html` finds none), and the
README links to **itself by anchor 0 times** and to repo paths **15 times**. So "anchor stubs for external links" is
about the outside world (people who linked `…#module-matrix`), not about anything in this repo. Keep a stub heading per
moved section that links to its new home; it costs two lines each.

The internal link checker the contract asks for does not exist yet. It belongs in `validate-repo.mjs`'s style or in a
`scripts/lib/` module with its own `node:test`. Make it check **relative Markdown links and `<img src>` across README,
`docs/**/*.md` and `paper/`**, and fail on a missing file. Write it before moving anything, run it on the current tree
(it should pass), then move files and keep it green.

---

## 4. Step 1's video is the only step that may be impossible

The contract: *a 20–30 s WebM loop (≤ 6 MB, self-hosted, poster frame) captured via the publishing studio.*

- The recorder exists: [`js/export/video-export.mjs`](../../../js/export/video-export.mjs) (S32), `MediaRecorder` with VP9/VP8,
  presets and a frame budget. **No `.webm` or `.mp4` is in the repo today** (`git ls-files` finds 0).
- It needs a real browser with `MediaRecorder` and a codec. The development sandbox cannot bind a port, so it cannot run one;
  **CI's pinned Chromium on software GL is the only browser you will have** (S34 lived there for a day).
- The plan's own rule: *if a required value, algorithm or API cannot be verified or reproduced, set the prompt `blocked`
  and stop; never substitute a fake visual.* A still image dressed as a video, or a video recorded by hand and not
  reproducible, is the thing to avoid.

Suggested path: write a Playwright script (like `qa/specs/*.spec.mjs`) that drives the studio's recorder, run it as a
manual `workflow_dispatch` job that uploads the file as an artifact, **look at it**, then commit it. If Chromium on
SwiftShader yields no usable WebM, record that as a `decision` with the CI evidence and let the README carry the poster
frame plus a link, rather than blocking all of S35 on one asset. Say so plainly in the review commit; do not hide it.

---

## 5. Whitepaper v2 — two sources that nothing ties together

- `docs/whitepaper.md`: **220 lines**.
- The in-app paper view: `function ViewWhitepaper` in [`js/extras.jsx`](../../../js/extras.jsx): **559 lines** of JSX.
- No test compares them (`grep -rn 'whitepaper.md'` over `test/`, `scripts/`, `js/` finds nothing).

The contract asks for both updated. Two hand-edited copies will drift again. The pattern that worked in S34
([`scripts/build-theme-surfaces.mjs`](../../../scripts/build-theme-surfaces.mjs), `--check` wired into `npm run validate`, a
`node:test` that asserts the committed file equals the generated one) fits: **one source, generated outputs, a staleness
check.** Whether the single source is Markdown rendered in-app or a data module is your call; record it as a decision.

"Every verification number recorded in the ledger by S03–S28" is a lot: the ledger holds, over the 34 `done` prompts,
**207 `evidence.measurements`, 217 `evidence.tests` and 125 `evidence.screenshots`; the S03–S28 prompts alone carry 155
measurements.** Do not retype them. A script that reads `ledger.json` and writes the table (prompt, number, what it was
compared with) removes transcription error, and a test that its count equals the ledger's keeps it honest.

---

## 6. Citation: what you may and may not write

- [`CITATION.cff`](../../../CITATION.cff) exists: cff 1.2.0, one author, MIT, version `1.1.0`, date-released `2026-10-07`, **no ORCID, no DOI.**
- [`test/citation.test.mjs`](../../../test/citation.test.mjs) has a test named **"CITATION.cff contains no unverified identifiers (no DOI)"**.
  The contract repeats it: *the maintainer mints the DOI; never invent one.* `.zenodo.json` (does not exist yet) gets
  title, creators, licence, keywords, upload type, description, related identifiers for the repo and the live site, **and
  no `doi` field.** Add the test that says so.
- The test also pins `version` equal to `package.json`'s and the licence equal to `LICENSE`. If you add fields, extend that file.
- `paper/paper.md` and `paper/paper.bib` (do not exist) are a JOSS-**style draft**. JOSS wants a summary, statement of need,
  state of the field, software design, research impact, AI-usage disclosure and references. Cite only sources you opened;
  the bibliography must be checked against its primary source like every other value in this pack.
- The author's e-mail is in `CITATION.cff` already. **Do not add personal details you were not given** (ORCID, affiliation).
  Leave the field out and name what is missing in the review notes for the maintainer.

---

## 7. Lessons from S34 that apply here

1. **The browser is CI.** Push to a branch, dispatch `quality.yml` (it has `workflow_dispatch` inputs), read the logs, then fix.
   Each round is about 10 minutes, so **batch fixes: one push per full reading of the logs.** S34 burned many rounds
   fixing one failure per push.
2. **Read the failure, do not guess it.** Several of S34's "flaky" failures were real defects (a `\b` in a TeX string, categorical
   colours used as text, a label on the wrong ground) and some were tests measuring the wrong thing (a Node-side clock for a
   timer that lives in the page, `networkidle` on a view that embeds two apps). Print the evidence into the message first.
3. **Do not say a test ran when it did not.** `qa:critical` is what pull requests run; the other specs run only when dispatched.
4. **The Fact-Forcing Gate** wants a one-line statement of importers, affected API, data shape and the user's words before the
   first edit of each file, and again for each new file. Edit and Write only; do not script around it (a generator that
   *outputs* a committed file is fine, a `sed` over existing files is not).
5. **Ledger shape that passed review:** claim commit alone → work → one `review` commit in the PR (evidence, decisions
   `D-nnn`, `pr`) → merge → a small `chore(ledger): close S35` PR with the merge commit in `commits`, `completedAt`, and
   `closedIn` on F-19. **Decisions end at D-206.** A finding stays `open` until that last PR.
6. **Merging:** the auto-mode classifier refuses a merge you were not explicitly asked to make. Open the PR, get CI green,
   report, and wait to be told.

---

## 8. Order of work (each step ends green)

1. **Claim** — ledger `claimed` + `owner` + `branch` + `startedAt`, `node --test test/plan-ledger.test.mjs`, commit alone.
2. **The link checker first**, with its test, green on the current tree. It guards every move after it.
3. **`docs/guide/` and `docs/science/`**: move the three big sections (§2), leave a two-line stub per moved heading,
   update `validate-repo.mjs` (§3), keep the checker green after each section.
4. **The short README** (hero, what it is / is not, one cover per chapter, run, cite, licence, ledger pointer). Count lines.
5. **Roadmap** to a ledger pointer.
6. **Citation files**: `.zenodo.json`, `CITATION.cff` fields, their tests (no DOI).
7. **Whitepaper v2** from one source plus the generated ledger table, with a staleness check in `validate`.
8. **`paper/paper.md` + `paper.bib`** draft, last, once the numbers it quotes exist.
9. **The video** (§4), in parallel as a dispatched CI job; do not let it block 2–8.

---

## 9. Pre-flight checklist

- [ ] `npm ci && npm test && npm run validate` — all green **before** touching anything
- [ ] read `docs/design/art-direction.md` and `docs/render/performance-contract.md`
- [ ] `git status` clean; `git log -1` is `c0f933a` or later `main`
- [ ] any uncommitted change you did not make is the user's — leave it alone
- [ ] decided where the whitepaper's single source lives and recorded it (§5)
- [ ] decided what happens if no WebM can be produced (§4) before spending CI rounds on it
- [ ] plan in hand: `docs/superpowers/plans/horizon-v2/S35-scholarly-release.md`

## 10. Definition of done

`npm test` (including the citation tests) · `npm run validate` (including the link checker) · `npm run perf:audit` ·
the README renders on GitHub with no rich-display error. Then ledger `review` → PR → CI green → merge when told →
`done` with the merge commit, `completedAt`, and `closedIn` on F-19.

**Do not** start S36 in the same session. S36 needs this prompt `done`, and the sequencing test enforces it.
