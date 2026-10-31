# Issue tracker: Local Markdown

Issues and specs live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`.
- Spec: `.scratch/<feature-slug>/spec.md`.
- Implementation tickets: `.scratch/<feature-slug>/issues/<NN>-<slug>.md`,
  numbered from `01`, with one file per ticket.
- Record triage state in a `Status:` line near the top of each issue.
  Use the role strings in `docs/agents/triage-labels.md`.
- Append comments and conversation history under `## Comments`.

## Publishing to the issue tracker

Create the spec or individual ticket files at the paths above,
creating directories as needed.

## Fetching the relevant ticket

Read the referenced file. Resolve a bare issue number within the
feature directory; ask for the feature if the number is ambiguous.

## Wayfinding operations

Used by `/wayfinder`.

- Map: `.scratch/<effort>/map.md`, containing Notes,
  Decisions-so-far, and Fog.
- Child ticket: `.scratch/<effort>/issues/NN-<slug>.md`,
  numbered from `01`, with the question in the body.
- Type: record `research`, `prototype`, `grilling`, or `task`
  in a `Type:` line.
- Status: use `claimed` or `resolved` for wayfinding lifecycle.
- Blocking: record `Blocked by: NN, NN` near the top.
  A ticket is unblocked when every listed ticket is resolved.
- Frontier: select the first ticket by number that is open,
  unblocked, and unclaimed.
- Claim: save `Status: claimed` before starting work.
- Resolve: append the answer under `## Answer`, set
  `Status: resolved`, and append a summary and link to the map's
  Decisions-so-far.
