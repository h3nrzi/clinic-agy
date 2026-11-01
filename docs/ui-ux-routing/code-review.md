# Final independent code review — 2026-11-01

Reviewed fixed-point range: `git diff 0eaa111a36af2ca66eb91bf632386ff0bd3c9645...0edf3e0447b5b6ff3e6f437ec37ed74a15020f55`. The two original reports below are preserved separately; their test evidence describes the reviewed integration, before the resolution checkpoint.

## Standards

No supported documented-standard blockers found in the reviewed range. Current routing/spec decisions supersede older toolbar guidance; test setup may seed stores, and existing domain assertions remain legitimate. The handoff documents accurately leave real-browser and human evaluation pending, consistent with the denied browser authorization.

One nonblocking baseline judgement:

- **Possible Duplicated Code / Shotgun Surgery** — `src/features/booking/components/BookingPage.tsx:14–24` repeats the booking store's initial identity/insurance choices: `booking.branchId !== "ONLINE"`, `booking.serviceId !== "srv-1"`, `booking.doctorId !== "doc-1"`, `booking.baseInsuranceId !== "ins-base-tamin"`, and `booking.suppInsuranceId !== "ins-supp-dana"`. These values already belong to `DEFAULT_STATE` in `src/shared/stores/useBookingStore.ts:57–65`. Changing a default now requires synchronized edits in the store and route guard; otherwise an untouched booking can incorrectly warn about unfinished work. Keep the comparison beside the owned defaults and expose one booking-draft predicate for the page. Preserve the existing exceptions for a preselected slot, pending document reads, and successful confirmation. This is a maintainability judgement, not a demonstrated current behavior defect or documented-standard violation.

Total: 0 documented-standard breaches; 1 nonblocking smell judgement. No files in the repository were edited.

### Standards resolution

Resolved the one nonblocking maintainability judgement: `hasUnfinishedBooking` now lives beside `DEFAULT_STATE` in the booking store and compares the store-owned identity/insurance defaults. BookingPage consumes that single predicate. Actual automatic slot baseline, pending reads, clean confirmation, reset revision and async read protection are preserved. Existing full App + Router guard and lifecycle cases run before and after this review-stage refactor; no private predicate test or fabricated red phase is added.

## Spec

- **[P2] Partial 44×44 touch-target coverage in booking.** Spec `.scratch/ui-ux-routing/spec.md:101` requires: «هدف لمسی حداقل ۴۴ در ۴۴ پیکسل باشد». `src/features/booking/components/booking.css:59–62` gives booking controls only `min-height:44px`; document removal at `src/features/booking/components/Step3InsuranceDocuments.tsx:278–285` uses a 16px icon and 6px padding per side, leaving approximately 28px width with no applicable minimum width. Reproduce: enter patient booking → step 3 → upload a synthetic document → inspect/use its trash icon. This small destructive target misses the explicit width requirement, even though its label and height were improved. Add a 44px minimum width (and prevent flex shrinking) for booking icon controls, then include the control in pending mobile evaluation. This is a source-derived partial implementation finding; no browser measurement is claimed.

No supported unasked business scope expansion or additional incorrect business behavior found. Reviewed routing/session/resource guards, booking and clinical draft protection, role presentation, report calculations/scope, operations, original-behavior preservation, and ticket handoffs against the fixed-point diff. No additional policy (such as a new insurance freeze time or restricting the previously allowed secretary “all branches” filter) is inferred.

**Known QA limitation, separate from findings:** Real-browser viewport 375/768/1024/1440, keyboard/focus, contrast/scroll/touch geometry, reduced motion and native beforeunload checks remain pending because localhost browser access was explicitly denied. No browser retry/workaround performed. Human acceptance remains pending; the guides accurately retain those limitations. Parent independently confirms 240/240 tests in 25 files, build and diff checks green. This review did not rerun them.

### Spec resolution

Resolved P2 in source: the document removal button uses the scoped `booking-icon-button` class with `min-width: 44px`, `flex-shrink: 0` and centered contents, together with the existing booking `min-height: 44px`. Accessible naming, hover/focus behavior and file removal remain intact. Browser geometry and four-width layout observations remain pending; CSS declarations are not measured browser evidence. No style-mirroring test was added for this reversible CSS change. UI/UX Pro Max’s focused touch-target search distinguishes web/native minimums; the project’s explicit 44×44 requirement governs this fix.

The guide now clarifies that one active link applies to main navigation destinations. Consultation rooms have independent URLs and do not force a parent navigation highlight. The low-confidence suggestion to force a parent link was dismissed; it is not an additional supported source finding.

### Counts and limits

Standards: **0 documented-standard breaches; 1 nonblocking smell judgement, resolved**. Worst within this axis: duplicated booking defaults (resolved). Spec: **1 P2 partial requirement, resolved in source**. Worst within this axis: document removal target width (browser measurement pending). These axes are not combined or reranked. Current execution evidence is appended in [ticket09](ticket-09.md) and the [final guide](README.md). Human acceptance remains pending. No browser retry/workaround or deployment was performed.
