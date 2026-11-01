# 07: بازطراحی گزارش‌ها و سهم پزشکان در پنل مالی

**What to build:** مدیر مالی محدودهٔ گزارش را انتخاب کند، شاخص‌ها و نمودارها را درست تفسیر کند و سهم پزشکان را با همان محاسبات موجود در یک نمای خوانا و متراکم ببیند.

**Blocked by:** 02 — ناوبری یکپارچه و ابزارهای شناور دمو.

**Status:** resolved

- [x] مقصد نمای کلی مالی با راهنمای UI/UX Pro Max و جهت بصری مصوب بازطراحی شود؛ گزارش‌ها و جدول سهم پزشکان روی دسکتاپ خوانا و روی موبایل قابل استفاده باشند.
- [x] شاخص‌های درآمد، سهم پزشکان، پوشش بیمه، بدهی/بستانکاری و شمارنده‌های موجود با عنوان، واحد، بازه و محدودهٔ واقعی خود نمایش داده شوند؛ شاخص یا درصد رشد ساختگی اضافه نشود.
- [x] انتخاب محدودهٔ شعبه، بخش‌های وابستهٔ گزارش را هماهنگ به‌روز کند و مقادیر سراسریِ مستقل از فیلتر آشکارا مشخص باشند؛ دامنهٔ محاسبهٔ موجود تغییر نکند.
- [x] نمودار درآمد، مقایسهٔ شعب، پرداخت‌های اخیر و وضعیت‌های عملیاتی موجود با برچسب و راهنمای خوانا نمایش داده شوند؛ معنا فقط به رنگ وابسته نباشد.
- [x] درآمد و سهم پزشکان با همان نوبت‌های واجد شرایط، فرمول، مصرفی و مالیات فعلی محاسبه شوند؛ پوشش محاسبه‌شدهٔ بیمه به‌اشتباه وصول واقعی معرفی نشود.
- [x] جدول عملکرد و سهم پزشکان با اعداد هم‌تراز و واحد روشن قابل بررسی باشد؛ دادهٔ کم یا خالی به مقادیر نامعتبر و نمودار شکسته منجر نشود.
- [x] تغییرات این برش تعرفه، اکسل، شیفت و تنظیمات موجود را نشکند؛ بازطراحی آن مقصدها در تیکت 08 است و تیکت حاضر به آن وابسته نیست.
- [x] جدول عریض در ناحیهٔ خودش قابل اسکرول باشد؛ کل صفحه سرریز نداشته باشد. کنترل‌ها برچسب، فوکوس و هدف لمس مناسب داشته باشند و کنتراست و کاهش حرکت رعایت شوند.
- [x] آزمون برنامه و Router، محدودهٔ شعبه، حذف درآمد نوبت‌های نامعتبر طبق قواعد فعلی، حالت خالی و سهم پزشکان را بررسی کند؛ تست‌های موجود محاسبات و گزارش ضعیف نشوند.
- [ ] build، تست مرتبط، بررسی کد و بررسی مرورگری چهار عرض مصوب با صفحه‌کلید انجام شوند؛ راهنمای تطبیق گزارش با دادهٔ ساختگی، شواهد واقعی و اولین اقدام کاربر تهیه شوند و پذیرش انسانی باز بماند.

## Answer

Implemented the dense finance report redesign with explicit clinic-wide summary/share scope and coherent branch-dependent reports; existing eligibility, consumable/tax/share calculations and memoryDb subscription/reset behavior are preserved. Amounts and full recorded dates are visible, insurance remains calculated coverage, recent payments show appointment status without bank settlement claims, and doctor shares use a named keyboard-focusable horizontal scroll region with aligned amounts and saved tax labels.

Evidence: full App+Router report/share/reset fixtures10/10; full suite186/186 in21files; production TypeScript/Vite build and diff check passed. Original direct formula assertions retained. Parent source review cleared calculations/scope/reset; a test-boundary observation was fixed with a visible account assertion. Session-wide final two-axis review is performed by root.

Evaluation guide and first concrete action: [ticket-07](../../../docs/ui-ux-routing/ticket-07.md). Includes independent numerical literals, branch/empty/reset reproduction and four-width keyboard checks. Real browser evaluation remains pending because the browser origin was explicitly denied earlier; no browser attempt was made. Human acceptance remains pending until user observations.
