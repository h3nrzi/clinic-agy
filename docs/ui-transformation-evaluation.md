# UI transformation evaluation checkpoint

> **راهنمای جاری:** [ارزیابی نهایی UI/UX و مسیریابی](ui-ux-routing/README.md). این سند سابقهٔ مرحلهٔ پیشین را نگه می‌دارد؛ دستورهای نوار تغییر نقش و تب‌های مقصدی پایین، متعلق به رابط قدیمی‌اند. اکنون انتخاب حساب فقط در `/login` و تغییر نقش با خروج/ورود است؛ ابزار دمو دکمهٔ شناور دارد. اعداد تست این سند تاریخی‌اند و پذیرش انسانی را ثابت نمی‌کنند.

## Implemented checkpoints
1. Foundation: shared visual tokens, role-aware desktop sidebar, focus styles, reduced motion, table treatment and stacked mobile metrics.
2. Financial overview: branch filtering, dated revenue bars, branch comparison, insurance coverage, appointment debt, clinic-wide wallet credit, recent appointment payments and operational counts.
3. Shell: demo toolbar occupies normal document flow rather than covering the header.

## Reproducible evaluation
First action: run `npm run dev`, open the printed local URL and select «مدیر مالی» in the demo toolbar.

- Finance: select each branch in «محدوده گزارش». Revenue bars, branch comparison, appointment debt and recent appointments should update together. Wallet credits and leave counts explicitly remain clinic-wide. Compare revenue with confirmed/completed appointments only. No fabricated growth percentage or receipt status is shown.
- Empty result: select a branch without eligible appointments; expect the empty revenue message, zero totals and no invalid chart heights.
- Existing financial workflows: use the original tabs to load the sample tariff workbook, inspect its diff, and calculate doctor compensation. These retain existing handlers and formulas.
- Role switching: switch through patient, Tehran secretary, Isfahan secretary, doctor and finance. The sidebar label follows the role and links to its workspace. It does not grant additional permissions.
- Reception: search an appointment, inspect documents, adjust insurance and check the debt lock using the existing demo scenario.
- Doctor and patient: save the five clinical fields as doctor, then verify patient sees only prescriptions/follow-up and secretary only follow-up.
- Responsive: repeat at 375, 768, 1024 and 1440px. Verify the demo toolbar does not overlap the header, financial panels stack, and tables remain scrollable.
- Keyboard: Tab through toolbar, report selector and existing actions; confirm visible focus. Enable reduced motion.

## Actual preflight evidence
- Production build passed after the financial overview implementation.
- Build reports a bundle larger than 500 kB (existing single-bundle architecture).
- Current checkpoint: 54 tests passed across 15 files, including branch filtering, cancelled-revenue exclusion and empty report coverage.
- `git diff --check` passed.
- Browser visual evaluation and human acceptance remain pending. Automated component tests use jsdom and do not prove viewport quality.

## Remaining scope
Full redesign of individual doctor, patient, reception, authentication, booking and payment screens; richer sidebar destinations and responsive navigation; notification/account menus; consultation ergonomics; comprehensive browser visual and interaction evaluation.

## Shell and role-workspace checkpoint
- Replaced header with account details and role-scoped appointment-status notifications; Escape closes the panel, and role changes dismiss it.
- Patient summary shows the next future confirmed appointment instead of developer scenario metadata. Removed the development execution matrix.
- Doctor and reception metric labels now identify all loaded dates accurately; doctor pending count excludes cancelled/completed visits.
- Production build and all 54 tests passed after these edits; diff whitespace check passed.
- Actual Chrome check: opened local app, confirmed patient appointment summary renders, opened notification center and observed zero pending-payment and zero locked appointments for the active patient. Initial browser check exposed a missing icon import; repaired and reloaded successfully.
- Next evaluation: open the bell, press Escape, open account details, then switch roles while a panel is open. Expect dismissal and role-specific counts when reopened. Check next-appointment date against the earliest future confirmed patient booking.
- Complete viewport verification and human acceptance remain pending.

## Booking and consultation checkpoint
- Four booking steps retain visible names on mobile, current-step semantics, and completed-step navigation; branch/service buttons expose selected state.
- Consultation video remains alongside the editor at desktop widths. At smaller widths they stack. Textareas resize vertically; save controls stay within the editor viewport.
- Unsaved note text now survives document/details tab switches within the same consultation. It is not persisted on page reload or leaving the consultation; the UI no longer claims a draft was saved automatically.
- Mobile workspace navigation opens from «فضای کار» and closes with its close button or workspace link.
- Reproduction: enter a doctor consultation, type a note, open documents, return to «شرح‌حال و نسخه» and verify text remains. Save using the existing final-save action and check patient/secretary visibility.
- Reproduction: begin patient booking at 375px; verify all four step names fit and only completed steps can be revisited. Check selection states and complete the existing simulated payment flow.
- Build passed. Initial test failures were obsolete UI-copy selectors; updated them to the new tab label and semantic booking navigation without removing workflow assertions.
- Final automated result for this checkpoint: 55 tests passed across 16 files, including the new unsaved-note tab-switch regression. Human acceptance and viewport visual checks remain pending.

## Final verification and handoff
First action: run `npm run dev`, open the printed URL, choose «مدیر مالی», and use the right sidebar to open «تعرفه‌ها و بیمه» and «تنظیمات مالی».

### Feature-by-feature review
1. Identity/consent: open account → «آزمایش ورود و رضایت‌نامه». Use synthetic mobile `09123456789`, checksum-valid test identifier `1234567891`, and OTP `123456`. Invalid identifier, missing consent and incorrect OTP must prevent progression. This is a separate demo, not an authentication gate; it stores no entered identity data.
2. Booking/calendar: choose patient → new online booking. All four steps have visible mobile labels. Select branch, service, doctor and available time; check insurance breakdown and optional documents.
3. Payment: verify existing failure, cancellation and success actions. Successful payment produces the existing confirmation/tracking code; cancellation returns to summary without booking.
4. Patient: verify next future confirmed appointment, wallet balance, cancellation and allowed prescription/follow-up content. Existing rescheduling capabilities were not expanded.
5. Reception: select branch, search, filter debt/documents, inspect the drawer and nested document/insurance dialogs. Mobile appointments become labeled cards. Escape closes the top dialog; Tab stays within it and closing restores focus.
6. Doctor: review compensation summary against existing formula, shifts and leave requests. Enter consultation, type notes, review documents and return. Notes survive tab changes, but require final save before leaving the room.
7. Finance: confirm primary KPIs, branch scope, revenue date bars, branch comparison, appointment payments, wallet credits and pending counts. Insurance is labeled calculated coverage rather than collected receivables. Exercise tariff sample/diff and settings.
8. Shell: verify each role's sidebar destinations, mobile navigation toggle, account details and scoped notifications. Role switching returns to overview.

### Actual evidence
- Production TypeScript/Vite build passed after implementation; bundle warning remains (~918 kB uncompressed main chunk).
- 57 tests across 17 files passed, including existing insurance, compensation, cancellation, wallet, booking, leave and clinical permission coverage plus new analytics, draft continuity, identity and navigation cases.
- `git diff --check` passed.
- Real Chrome review: finance screenshot at 1440px and 375px; reception DOM at 375px; doctor screenshot at 1024px and width measurements at 375/768px; booking DOM at 375px. No page-level horizontal overflow in these measured views. Internal tables/tabs may scroll intentionally.
- This is representative viewport coverage, not an exhaustive audit of every dialog and screen at every breakpoint. Human acceptance remains pending.

### Limits
No real backend, SMS, payment, or patient data was added. Authentication remains a simulation. There is no durable clinical draft autosave. Revenue charts describe recorded appointment values, not bank settlement. Existing missing business capabilities such as rescheduling were not invented as part of a visual redesign. Full manual accessibility and every-screen viewport testing remain advisable before production use.

Browser tooling limitation: final console-log retrieval and viewport-reset requests timed out. A clean console and successful viewport restoration could not be verified. The browser may retain the 375px preview override until its session is cleared.
