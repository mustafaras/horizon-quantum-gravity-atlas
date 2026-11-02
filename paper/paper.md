---
title: 'HORIZON: an epistemically labelled interactive atlas of the quantum-gravity problem'
tags:
  - JavaScript
  - physics education
  - quantum gravity
  - general relativity
  - quantum field theory
  - scientific visualization
authors:
  - name: Mustafa Raşit
    # ORCID and affiliation: to be supplied by the author. They were not given to the S35 work and are not invented.
date: 2 November 2026
bibliography: paper.bib
---

<!-- JOSS-style DRAFT (S35). Not submitted. Before submission the author must add an affiliation (JOSS requires one),
     an ORCID if wanted, complete the state-of-the-field comparison with references they have checked, and re-measure
     the counts quoted below. -->

# Summary

HORIZON is a static web application that walks a reader from the experimentally established Standard Model,
through quantum field theory and general relativity, to the point where the two collide and the research programs
that try to reconcile them diverge. It has eight chapters (Standard Model, quantum field theory, gauge symmetry and
renormalization-group flow, general relativity, the Planck frontier, a comparator of quantum-gravity programs, black
holes, and experimental constraints) built from live, seeded simulations and computed figures.

Its central rule is that a visualization may be cinematic but the epistemic status of the physics shown must stay
explicit. Every figure carries one of five labels (established physics, effective theory, schematic model,
conjectural framework, open problem) and a registered provenance entry naming its model, assumptions and sources. The
atlas does not claim that quantum gravity is solved, and it ranks no program above another.

# Statement of need

Quantum gravity is hard to teach honestly. The quantitative core of the problem is short: Newton's constant has
negative mass dimension in four dimensions, so the gravitational coupling grows with energy as a power law and the
perturbative expansion of general relativity is non-renormalizable at two loops [@goroff1986], while at low energies
the same theory is a controlled effective field theory [@donoghue1994]. Black holes sharpen the question through the
area law for their entropy [@bekenstein1973] and their semiclassical evaporation [@hawking1975]. Holography relates
boundary entanglement to bulk geometry in special settings [@ryu2006], and asymptotic safety looks for an interacting
ultraviolet fixed point of the gravitational couplings [@reuter1998; @litim2004]. Observation constrains all of this
only indirectly: gravitational waves from a binary black-hole merger [@ligo2016] and the horizon-scale image of M87*
[@eht2019] confirm general relativity in the strong field and say nothing direct about its quantum completion.

Material that spans this chain tends either to avoid the equations or to blend conjecture with established result.
HORIZON is meant for advanced undergraduates, graduate students and teachers who want an instrument in which the
equations are on the screen, the numbers move with the controls, and the boundary between what is measured, what is
effective and what is conjectured is part of the interface rather than a footnote.

# State of the field

General-purpose plotting libraries, computer-algebra systems and notebooks can reproduce any single figure in the
atlas, and many standalone teaching simulations cover one topic each (an orbit, a light cone, a running coupling).
What they do not provide is one continuous argument across the whole chain, held together by a single status
vocabulary and a provenance record for every figure. That combination, rather than any individual simulation, is the
reason HORIZON was built as its own application instead of as a contribution to an existing package.

<!-- TODO(author): name and cite the specific tools and courses this is compared with, each checked against its
     primary source as the rest of paper.bib is. -->

# Software design

**Zero build, static deployment.** The atlas is a folder of static files served by GitHub Pages or any local HTTP
server. Its runtime dependencies (React, three.js [@threejs] 0.186.1, KaTeX [@katex] and the web fonts) are vendored
and pinned with recorded integrity hashes, so the request path contains no third-party host and the deployed bytes
can be audited. The JSX is compiled in Node to committed JavaScript, and `npm run validate` fails if the committed
output differs from a fresh compile.

**One definition per equation.** Formula Core (`js/formula/`) stores each equation once as an expression tree and
compiles it to JavaScript for the science modules, KaTeX for the page and TSL for GPU shaders. At the time of writing
the library holds 77 definitions, each with units and dimensions that the validation step checks; the evaluated
number, the typeset equation and the shader therefore come from the same source.

**One renderer per page.** Scenes draw through a shared stage: one WebGPU renderer per page with a canvas target per
scene, or, on WebGL2 where contexts cannot be shared, a pool of at most four live contexts. Scenes render on demand,
so a paused scene draws no frames.

**One plotting system.** Two-dimensional figures are plain descriptions built by pure functions and painted either on
a canvas or as SVG from the same scene, so an exported figure is the figure on screen. Exports carry the state, seed,
commit and provenance that produced them.

**Science as pure modules.** Physics lives in DOM-free ES modules under `js/science/` and `js/formula/`, tested with
`node:test`; at the time of writing the suite runs 1,378 tests. Randomness is seeded, and the URL encodes each
laboratory's full state, so a configuration is a shareable, reproducible object.

**Provenance and status as checked data.** The provenance registry holds 89 entries (11 established, 35 effective,
31 schematic, 12 conjectural). The validation step fails when a captioned figure has no entry, when a caption's
status disagrees with its entry, when a citation has no identifier, or when a figure path calls an unseeded random
number generator. A browser QA suite on pinned Chromium checks mounting, accessibility (keyboard reach, contrast,
reduced motion) and 74 manifest-backed captures against committed baselines.

**A ledger instead of a changelog.** The 36 development prompts were executed one at a time against a machine-checked
ledger that records, for each, the tests run, the measurements accepted (with units and what they were compared with)
and every deviation as a numbered decision. The companion whitepaper lists the 155 measurements of prompts S03 to S28
verbatim, generated from the ledger rather than retyped.

# Research impact statement

HORIZON is an educational and communication instrument, not a research code: its simulations are pedagogical models
with stated limits, and it produces no new physical result. No publication or course is known to have used it at the
time of writing. Its near-term significance is as a reusable, citable teaching resource whose figures carry their
sources and status, and as a worked example of keeping epistemic labels, provenance and verification numbers under
automated test in a scientific web application.

# AI usage disclosure

Generative AI was used extensively. The code, tests and documentation of the second version were written by AI coding
agents working under the author's direction; the ledger names the agent that owned each prompt: Claude Code
(Anthropic) for 20 of the 35 claimed prompts, GitHub Copilot for 13 and Codex (OpenAI) for 2. The draft of this paper
was written with Claude Code. Every change was
gated by the automated checks described above (unit tests, repository validation, provenance and formula audits,
browser QA in continuous integration), and every numerical value shown in the application was required to come from
a tested function or a cited data module, checked against its primary source; the ledger records the evidence and
the decisions for each step. The references in this paper were checked against their Crossref records. The author
reviews and is responsible for all of it.

# Acknowledgements

<!-- TODO(author): funding and acknowledgements, if any. None were given to the S35 work. -->

# References
