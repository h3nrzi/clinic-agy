# Ticket 07 — financial reports and doctor shares

Human evaluation: **pending**. Automated checks do not establish acceptance.

First action: run `npm run dev`, open `/login`, select **حساب مدیر مالی**, choose **استفاده از مشخصات آزمایشی**, accept consent, request the demo code, and enter `123456`. Open **نمای کلی و امور مالی** (`/finance`). Use synthetic identities only.

## Feature-by-feature evaluation

1. **Clinic summary:** the four top cards and doctor table say **کل کلینیک / تمام تاریخ‌های ثبت‌شده / مستقل از فیلتر شعبه**. Record the gross revenue and net payable before changing the branch. Amounts are in تومان. Only `CONFIRMED` and `COMPLETED` appointments contribute to revenue/shares; displayed payable is calculated, not proof of disbursement.
2. **Branch scope:** choose Tehran, Isfahan, then all branches in **محدوده گزارش**. The explicit current scope, insurance coverage, appointment debt, dated revenue, branch comparison, recent appointment list and appointment follow-up counts must follow the selection. The clinic summary/doctor table, wallet credit and pending leave count keep their clinic-wide scope. Every exception is labeled. The URL remains `/finance`.
3. **Chart interpretation:** check full Persian dates and printed values beside each bar. These are the last **seven recorded dates with eligible appointments**, potentially nonconsecutive; they are not a calendar week. Branch meters have direct branch/value labels. No invented growth, settlement or collection claim is displayed. Insurance is calculated coverage, without a recorded collection status.
4. **Recent appointments and operational status:** check tracking code, appointment date, text status and initial payment. Ordering is the five latest creation times; the displayed date is appointment time. Cancelled/pending rows may appear here, although they never contribute to eligible revenue. Debt includes all appointment statuses in scope, following the existing calculation. Wallet credits and pending leave requests stay clinic-wide.
5. **Doctor share:** focus **جدول سهم پزشکان** and horizontally scroll inside it. Header/caption identify تومان and all-clinic scope. Numeric columns align, doctor names identify rows and net pay is emphasized. For a known example use the automated fixture below. Save tax15% in financial settings, return to `/finance`, and verify both heading/formula show15%. Use demo tools to reset after recording results; it returns to10% while retaining account and route.
6. **No eligible appointments:** run the empty fixture below. Expect zero amounts, explicit no-revenue/no-share messages, no `NaN`/`Infinity`, and meters with valid max1. Doctors remain visible with zero rows if doctors exist.
7. **Other finance destinations:** navigate to tariffs, shifts and settings and return. Their behavior is covered by existing tests and ticket08 owns their visual work; this ticket changes neither their leaf nor calculators/repositories.
8. **Real visual/keyboard evaluation — pending:** repeat at375,768,1024,1440px. The page must fit horizontally; each wide table scrolls in its own region, selector target is at least44px tall, labels/units remain readable, and Tab focus is visible and unobscured. Test native selector keyboard operation, table scrolling, contrast and reduced-motion preference. Record width, account, route, exact step and observed result. No browser measurements have been performed in this session.

## Reproducible synthetic fixture comparisons

Fixtures are isolated by `memoryDb.resetToFactoryDefaults()` before each test; run from the repository root:

```sh
npm test -- tests/browser/operationsOverview.test.tsx tests/browser/adminDoctorShares.test.tsx tests/browser/financialResetNavigation.test.tsx --reporter=dot
```

- `operationsOverview.test.tsx`, first test: three appointments REPORT-A (Tehran confirmed100,000; insurance15,000; debt30,000), REPORT-B (Isfahan completed200,000; insurance25,000; debt40,000), REPORT-C (Tehran cancelled900,000). All-clinic eligible gross is300,000. Selecting Isfahan leaves gross300,000, Tehran meter0, Isfahan meter200,000, insurance25,000, debt40,000, only REPORT-B in recent appointments and the text status completed. These literals are independent expectations, not rederived from the calculator.
- Same file, empty test: remove appointments; both report/doctor empty messages, valid meters and no invalid numerical output.
- `adminDoctorShares.test.tsx`, known example: one confirmed1,000,000 appointment, consumables100,000, doctor60%. Cancelled9,000,000 and in-consultation8,000,000 are excluded. Row shows one visit, gross1,000,000, consumables100,000, doctor gross540,000, tax54,000, net486,000 and clinic360,000. Live settings update to15% shows tax81,000 and net459,000 without changing account. Original direct formula assertions remain unchanged.
- `financialResetNavigation.test.tsx`: original four full-App reset regressions retained. Reset updates overview tax15→10 in the same route/account; financial operations resets retain their existing contracts.

These fixtures run in jsdom and do not populate a separate dev-browser session. For manual numerical comparison inspect the fixture literals/source or reproduce equivalent synthetic data in a disposable development copy; no browser fixture injection is claimed.

## Actual preflight evidence — 2026-11-01

- Began at integration83b9e59; merged integration1e3d640 (ticket05) before final verification. Feature CSS is scoped under finance report classes; no shell/App/index.css, calculator, repository or `FinancialDashboard.tsx` edits.
- Red: App+Router report test could not find the named all-clinic summary; empty report/share state failed. Green: public branch/empty tests2/2, then report+share tests6/6, then including reset tests10/10. The empty fixture copies the appointment collection before deleting, because database collections are live arrays.
- TypeScript caught the newly explicit status map missing `IN_CONSULTATION`; adding its Persian label fixed the build. No status eligibility rules changed.
- UI/UX Pro Max focused chart search first returned irrelevant trading examples; narrower discrete-date query returned direct category/value labeling and text alternatives. Kept recorded-date amounts as visible labeled bars, without interpolation or target/growth assumptions. Applied approved application design override, semantic palette tokens, named keyboard-focusable scroll regions and no animation.
- Initial complete suite:180/180 in21files,6.92s. Following integration merge, final test/build/diff evidence is recorded below.
- Browser origin access was explicitly denied earlier in the session. No browser attempt or workaround was made. Four-width geometry, actual contrast, native keyboard and reduced-motion observation remain pending. Human acceptance remains pending until observations are reported.

- Final after integration1e3d640: `npm test -- --reporter=dot` **186/186 in21files**,6.92s; `npm run build` successful (JS1,016.99kB, gzip302.38kB), existing >500kB chunk warning remains. `git diff --check` clean. Existing older tests still emit act warnings for direct fixture updates; no failures.
- Parent source review cleared UI, calculations, scopes and reset preservation. Review found one new assertion reading auth store state rather than public UI; replaced it with the visible account button assertion, retaining every literal monetary assertion. This change is test-only. Final focused10/10 and diff check passed after the correction. Root performs the session-wide final two-axis review.
