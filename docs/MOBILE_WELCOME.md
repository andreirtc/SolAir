# Mobile welcome screen

Updated 24 October 2026. The former 500ms mobile intro is now an action-driven welcome page inspired by the supplied reference, using SOLAIR's existing BEMAC illustration, vector logo, typography and theme tokens. No new imagery, dependencies, API contracts or backend behavior were introduced.

- New signed-out mobile launches (up to 650px) show the artwork, headline and Get started button after the existing session check.
- Get started opens the existing sign-in screen. Completion is remembered in sessionStorage for that tab; storage restrictions do not prevent continuing.
- The bottom action follows the supplied two-button reference: a centered pill label and a separate SOLAIR gold circular double-chevron button. Both open sign-in and retain keyboard focus indicators and at least 44px touch targets.
- Existing authenticated sessions bypass the welcome and retain their permitted saved destination. A pending session check does not expose sign-in.
- Logout returns to sign-in without repeating the welcome. Direct signup, password recovery and invitation links bypass it.
- Desktop authentication remains unchanged. The illustration is labeled as an illustration and does not represent an assigned vehicle or live reading.

Validation: production build/TypeScript and lint passed. Isolated Playwright checks cover both themes at 320/360/390px, loaded BEMAC artwork, caption placement, touch target, no horizontal overflow, a welcome lasting beyond the old timeout, keyboard activation, signup/sign-in, saved Settings after refresh, slow session resolution and logout. Role navigation refresh checks passed for driver, operator and administrator. The live phone-preview proxy also passed welcome-to-sign-in and direct signup/recovery checks. Evidence is in ignored test-results/mobile-startup.

These are browser-emulation checks, not actual phone or TODA participant evidence. The existing Next.js dependency security advisory remains a separate deployment issue documented in FRONTEND_INSPO_OVERHAUL.md; no dependency upgrade was made in this UI change.
