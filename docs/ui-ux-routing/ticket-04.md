# Ticket 04 evaluation: booking, payment and unfinished work

Implementation and automated checks are complete. Real-browser evaluation and human acceptance remain pending user observations.

## Your first action

Run `npm run dev`, open `/patient/booking`, and enter with «حساب بیمار», prepared demo details, consent and OTP `123456`. At the doctor/time stage select the **second** time slot, follow «نوبت‌ها و پرونده من», then choose «ماندن و ادامه». The booking URL, account and selected time should remain.

## Reproducible feature guide

Use synthetic data only. Start each independent flow with Demo Tools → confirmed factory reset. Reset preserves the current account and URL. Evaluate every flow at 375, 768, 1024 and 1440 pixels.

| Feature | Actions | Expected result |
| --- | --- | --- |
| Four stages | Branch/service → doctor/time → insurance/documents → invoice; revisit completed stages | Same `/patient/booking`; readable current-step count, selected cards, actions and edit path; local stages never prompt |
| Date context | Choose another doctor and a non-default time | Pressed selection states, check marks, selected appointment recap; each time's accessible name includes day/date/time |
| Clean defaults | Open stage two without changing choices; follow appointments link | Existing preselected branch/service/doctor/insurance/first time do not produce a false dirty prompt |
| Insurance | Online service 280,000, Tamin and Dana defaults | Base 84,000, supplementary 137,200 and patient share 58,800 toman; invoice and gateway agree |
| Wallet | Use a fixture with 40,000 positive credit and the same insurance | Credit deduction 40,000 and net 18,800; only successful payment consumes credit. Existing representative test provides this fixture |
| Optional files | Choose a synthetic PNG/JPG/PDF below 5MB; delete/reselect; then choose a file above 5MB | Keyboard-accessible labeled input, filename and named delete action, explicit size error; continue with no document allowed. Upload rules remain unchanged |
| Failed payment | Invoice → gateway → unsuccessful transaction | Error 51 is announced; no appointment or credit debit; retry success or return still available |
| Canceled payment | Gateway → cancel/return | Same invoice, no exit prompt and no appointment created |
| Successful payment | Retain prepared fake card fields; choose success | Exactly one confirmed appointment, AGY tracking code, doctor/time/paid amount and simulated SMS; view appointments or book another; successful work no longer prompts |
| Link/cancel exit | Select second slot; follow appointments link or cancel booking; first stay, then leave | Stay preserves URL/session/values; leave goes to appointments without recording or paying; reopening starts clean |
| History | Appointments → booking → second slot → browser Back; stay, then Back/leave | Stay remains in booking with same slot; confirmed Back returns to previous destination; Forward opens a clean booking |
| Logout | Dirty booking → logout → stay; repeat and leave | Account and route unchanged before consent; confirmed logout opens home; next account sees no old choices/documents/confirmation |
| Scenario identity | Dirty booking → demo tools → indebted patient; stay, then repeat/leave | Identity unchanged on stay; confirmed action switches to Mehdi Saeidi and fresh booking; no automatic appointment |
| Factory reset | Dirty booking → reset; cancel native confirmation; then accept and stay; finally accept and leave | Native cancellation preserves draft; guard stay also preserves draft; confirmed leave resets data/booking while preserving account and route. Existing resetRevision contract retained |
| Old confirmation reset | Complete booking, then confirm factory reset | Removed appointment's success confirmation disappears; first stage appears with no false dirty warning |
| Browser refresh/close | Change second slot; refresh/close tab; cancel native prompt, then accept | Native warning within browser capabilities; custom text not guaranteed; no durable draft recovery |

Use Tab/Shift+Tab/Escape to check exit-dialog focus containment, initial focus on stay, return focus and inert background. Check connected insurance/payment labels, file keyboard selection, visible focus, 44px targets, no horizontal overflow, 4.5:1 text contrast, demo-tool clearance and reduced motion in the real browser. jsdom does not establish geometry, contrast, or browser-native prompt behavior.

## Actual preflight evidence — 2026-11-01

- Base `195390b`, branch `codex/ui-ux-04`; approved seam is full App + data router. Applied TDD, UI/UX Pro Max and React skills and the existing light application override. Local UX query `multi step form progress` returned step indicators, submission feedback and connected labels.
- Context7 resolved `/remix-run/react-router` then fetched current useBlocker documentation: SPA blocked/proceed/reset flow; hard reload/close requires a separate beforeunload listener.
- First red run: two new link/Back tests failed because the guard did not exist. Both passed after the blocker and whole-action coordination were added. Stay/leave cover cancel, Back and logout, including URL and visible account preservation.
- Factory-reset regression: a completed confirmation survived reset (red); resetting booking inside the approved reset callback made it green. Existing native reset confirmation occurs before any discard.
- Source review found delayed FileReader completion could populate an abandoned booking. A controlled FileReader boundary at the full UI seam reproduced private filename leakage into the next booking (red). A booking draft generation check made the test green, without invalidating valid reads across local stages.
- Seven added full App+Router tests cover link/cancel, Back/logout, scenario, reset, defaults, local stages, success clean state, beforeunload event wiring and delayed upload. Full suite: **178/178 in 21 files**, **6.76s**. All previous financial/privacy/domain assertions are retained. Existing act warnings from older direct fixture mutations remain.
- `npm run build`: TypeScript and Vite passed; JS **1,024.10kB**, gzip **303.21kB**; existing chunk >500kB warning remains. `git diff --check` passed.
- Source review checked mutation ordering, session/identity cleanup, local-stage behavior and demo actions; no financial formulas, tariffs or repository rules changed. Final independent-review evidence is appended below.
- **Real browser not attempted:** localhost browser access was explicitly denied earlier in this session. No retry, alternate host or workaround was attempted. Four actual viewports, measured contrast, real keyboard/reduced-motion behavior and native beforeunload presentation remain pending. Synthetic event dispatch verifies JavaScript wiring only.

## Reusable guard contract for ticket 06

`src/shared/navigation/UnsavedChanges.tsx` exports:

- `UnsavedChangesProvider`, already mounted in WorkspaceRoute: exactly one data-router blocker for the workspace.
- `useUnsavedChanges({ dirty, onDiscard })`: register a mounted private form. Compare with saved values; set dirty=false after successful save. Discard must only clear local draft, never save or finish a visit.
- `useGuardedAction()`: returns a function accepting the **entire** destructive/navigation callback. Do not clear session, identity or draft before that callback. Router links and Back are already protected.
- Multiple mounted drafts are supported; the modal uses shared focus/inert behavior. Demo Tools closes before the guard opens. No persistent draft was added. Confirmed factory reset still increments the existing resetRevision.

For human evaluation report account, URL, width, action, expected and observed result. Passing automated checks and guide readiness do not establish human acceptance.

## Integration checkpoint

Merged `codex/ui-ux-routing` at `1e3d640` (tickets03/05, including stack-safe shared focus and scroll locking) before handoff. Against those actual hooks and semantic patient articles, **192/192 tests in22 files passed** (8.68s); build passed with JS **1,023.49kB**, gzip **303.90kB**; diff-check passed. No browser observation is inferred from this checkpoint.

## Review corrections and final checkpoint

Independent parent review checked both the ticket requirements and implementation standards, then found two guard gaps. Each received a full App+Router red/green regression:

1. Opening booking before midnight and entering stage two after midnight falsely classified the automatic first slot as a change. `preselectedSlotDateTime` now records the actual automatic selection through `setDefaultSlotDateTime`; manual selection never changes the baseline. A mocked-clock UI regression is green. Vitest's current Date-only `vi.setSystemTime` behavior was verified through Context7; system time is restored afterward.
2. Choosing a valid document while FileReader was still pending did not count as unfinished work. Pending reads now register in the current draft generation and show a status. Load/error/abort release only that generation; reset invalidates the old read. The otherwise-default UI flow now prompts, stay preserves the pending work, and confirmed leave prevents late private-file leakage into a new booking.

Final integrated check after these corrections: **194/194 tests in22 files passed (7.76s)**, including **9 new guard regressions**. TypeScript/Vite build passed: JS **1,024.15kB**, gzip **304.12kB**; existing chunk warning unchanged. Diff-check passed. Real-browser evaluation and human acceptance remain pending.

Final parent sourcecheck cleared both corrections: actual auto-slot baseline, pending count and revision-gated load/error/abort were confirmed; no additional blocker in shared guard/action ordering was found. Latest integration tip `8fbd61e` (including ticket07) was merged before the final handoff. Final full suite **195/195 in22 files passed (7.29s)**; build passed with JS **1,021.60kB**, gzip **304.10kB**; diff-check passed. Browser/human acceptance remains pending as described above.
