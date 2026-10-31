# Public home and demo login — ticket 01

The public surface uses the existing Persian Vazirmatn typography, neutral canvas, white panels, and teal emphasis. These approved spec decisions override the generated master's neumorphic style, cyan canvas, and testimonial carousel recommendation for this slice. No testimonials or new clinic capabilities are invented.

- Home: spacious introduction, one login/booking action, existing services and branches, and a short explanation of the demo flow. Cards are informational, so they do not gain button-like hover motion.
- Login: one bordered white panel, five explicit account buttons with pressed state, a visible sample-data action, visible labels and consent, then the demo OTP. Inputs remain local to the form.
- Responsive: home changes from two columns to one below 900px; services become one column and login fields stack below 640px. No fixed public navigation covers content.
- Accessibility: minimum 44px controls, visible focus inherited from the application, reduced-motion support inherited from the application, field-specific error descriptions plus a focused linked error summary, and announced OTP status.
- Verified UI/UX Pro Max searches: `healthcare clinic portal calm accessible --design-system` and `error summary validation --domain ux`. The latter returned Focusable Error Summary, Error Messages, and Error Placement, all directly applicable to this form. The generated healthcare palette was evaluated against the existing approved tokens; the existing teal/neutral direction was retained.

Real-browser checks at 375, 768, 1024, and 1440px and keyboard/contrast inspection remain pending because the session's browser permission gate denied localhost access. CSS inspection and jsdom tests are evidence of implementation, not a visual acceptance result.
