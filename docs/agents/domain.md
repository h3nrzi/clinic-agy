# Domain docs

This repo uses a single-context domain layout.

## Before exploring

- Read `GLOSSARY.md` at the repo root when it exists.
- Read ADRs in `docs/adr/` relevant to the area being explored.

If these files are absent, proceed silently. Domain modeling creates
them lazily when terminology or decisions are resolved.

## Layout

- `GLOSSARY.md`: shared domain vocabulary.
- `docs/adr/`: architecture decision records.

## Use the glossary's vocabulary

Use defined domain terms in issue titles, proposals, hypotheses,
and test names. Follow any documented preferences over synonyms.

When a needed concept is absent, reconsider whether it belongs to
the domain or note the gap for domain modeling.

## Flag ADR conflicts

Explicitly identify any existing ADR that a proposal contradicts,
and explain why the decision should be reconsidered.
