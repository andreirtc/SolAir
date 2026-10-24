# SOLAIR frontend redesign — 24 October 2026

## Scope and inventory before changes

This is a frontend-only refinement of the existing Next/React PWA. The supplied HELIORA images inform spacing, warm surfaces, card hierarchy and navigation; their artwork, logo and residential metrics are not copied. Approved vehicle artwork and factual status semantics remain.

| Workspace | Existing features to preserve | Existing contracts/components |
|---|---|---|
| Shared | Sign-in/signup/recovery, Light/Dark/System, logout, account menu, Help, draft Terms/Privacy, notifications, refresh retention, offline feedback | Existing authentication/registration APIs, Theme, Brand, HelpResources, PolicyDrafts, Notifications, workspace-navigation |
| Driver | Assigned vehicle, map/reference location, energy, security, assistance, messages, notifications, history/exports, Settings and incomplete setup | Existing fleet/history/alerts/help/messages/registration/contact APIs; DeviceStatus, FleetMap, Workflows, RegistrationDetails |
| Operator | Authorized fleet, maps, incidents, assistance, messages and business/contact settings | Existing role-restricted APIs and fleet/incident/operator forms; no account/assignment/device administration added |
| Administrator | Cross-TODA overview, accounts/lifecycle, organizations, assignments, device approval, activity | AdminHome, People, AccountAccess and existing admin endpoints |
| Engineer | CPE, diagnostics, calibration, health and evidence | Existing Lab, CpeReadings/CpeHistory and engineering contracts |

Backend, migrations, telemetry contracts and package manifests were hashed before edits in ignored `.tools/heliora-contract-baseline.json`. Existing uncommitted backend work belongs to the earlier work and is preserved. No framework migration or dependency installation is planned. No working-account mutations are needed for design tests.

## Design implementation and validation

Implementation and executed results are recorded below after verification. Automated browser evidence uses disposable seeded databases; map tiles may be mocked. Real phones, actual LTE/cloud performance, hardware behavior, external provider delivery and IT/TODA SOP3 acceptability require separate evidence. The specified ISO/IEC 25010:2011 evaluation areas are design/testing objectives, not a certification claim.

## Delivered design

- `src/experience.css` adds reusable radius, elevation and warm surface tokens on top of the existing semantic palette. Shared forms, navigation, tables, notification rows, Help/policy pages, administrative summaries and engineering surfaces use consistent controls and card treatments. It preserves the approved light/dark color values and System preference.
- `src/DriverVehicleCard.tsx` provides compact assigned identity, approved vehicle artwork, factual connection status and last-position/reference guidance. BEMAC art is retained; NWOW continues to use its existing honest image/placeholder behavior. No GPS, battery percentage, range or savings is invented.
- Driver status uses a readable two-column card layout with all existing age, safety, missing-data and inspection guidance. Location/alerts/help shortcuts remain prominent. Secondary account details remain in Settings; completed setup cards remain hidden.
- Driver mobile navigation retains Home, Location, Energy, Alerts, Notifications and Settings with a rounded floating surface and amber active treatment. Existing full-page Notifications, hidden duplicate bell/breadcrumb, scrolling, account menu, +63 entry and draft-policy behavior remain.
- `src/Brand.tsx` and `src/brand-paths.ts` render an accessible, editable outline wordmark. `public/solair-logo-light.svg`, `public/solair-logo-dark.svg` and the compatible default `public/solair-logo.svg` contain vector shapes/paths with titles/descriptions, no embedded image or font-dependent SVG text. Each standalone variant is approximately 3.1kB. Screen typography still uses the locally served Outfit and Work Sans fonts.
- The existing fleet spotlight now displays the selected vehicle's actual `model` instead of a fixed BEMAC heading. No API or source data was changed.
- Approved sign-in artwork composition, mobile 0.5-second introduction and equal auth action sizing were preserved. No new dependency or framework migration was introduced.

## Executed verification

| Check | Result |
|---|---|
| Production build and TypeScript | Passed on final retry; advisory interruption described below |
| ESLint | Passed |
| Existing automated test suite | 97 passed, 0 failed |
| Design/role/theme browser suite | Passed all four roles, exact theme tokens, tested text/TODA-popup contrast of at least 4.5:1, keyboard/skip-link behavior and System appearance |
| Responsive role pages | Visited operator/admin/engineer destinations at 1440, 390, 360 and 320px; driver pages at 320/360/390px plus desktop/mobile home; no document horizontal overflow in tested views |
| Touch targets | Driver bottom navigation targets at least 44×44 CSS pixels at the tested narrow widths |
| Form/network feedback | Password visibility, network/503 recovery and duplicate-submit prevention for sign-in/help/messages passed; message composer checked at 320/390px |
| Operational UI workflow suite | Passed signup, memberships, role separation, assignment display, contact saving, incident follow-up, draft-note retention and protected CPE/evidence paths |
| Setup shortcuts | Passed desktop/mobile pending steps, Settings destination focus and hidden completed-card branches |
| Notifications/Help/policies | Passed filtering, read state after reload, full-page destination navigation, role-accessible Help links and draft-policy pages |
| Maps | Passed 1440/390px BEMAC/Manila, NWOW/Malabon, valid/invalid GPS, first-fix behavior, selected-vehicle switching and unassigned fallback; map tiles mocked |
| PWA/offline | 11 checks passed, including manifest/installability, offline shell, hashed assets/fonts, no private API caching and no service-worker runtime errors |
| Mobile startup | Passed approximately 0.5s intro, retained-session and slow-session behavior, equal auth actions at 320/390px and desktop artwork preservation |
| Refresh/logout navigation | Passed admin/operator desktop and driver mobile page restoration, role validation and logout reset |
| Backend preservation | All 42 recorded server/migration/contract/dependency files matched their pre-edit SHA-256 baseline; no working-account mutation for this redesign |

Targeted checks are not a full accessibility certification or penetration test. Screenshots were inspected for driver light home, mobile sign-in and operator/admin role homes. Local screenshots/results are ignored artifacts under `test-results/frontend-design/`, `frontend-performance/`, `operational-ui/`, `setup-checklist/`, `help-menu/` and `regression-preview/`.

## Cold-load measurements

One sample per condition on the final build, 390×844 Chromium phone emulation, isolated loopback backend, cold cache and service workers blocked for cold measurements. The slower profile uses 1.6Mbps download, 0.75Mbps upload, 150ms configured latency and 4× CPU slowdown. No agreed performance threshold or percentile is claimed.

| Measurement | Unthrottled localhost | Simulated slower profile |
|---|---:|---:|
| Sign-in fields available after navigation | 1,323ms | 2,968ms |
| Sign-in click to driver dashboard quick action available | 296ms | 979ms |
| Settings click to heading visible | 103ms | 132ms |
| Observed resource transfers through the tested flow | 436,947 bytes | 434,318 bytes |

These are lab measurements, not actual LTE, hosted infrastructure, a physical phone or Core Web Vitals acceptance results. Raw samples are in `test-results/frontend-performance/results.json`.

## Security dependency issue identified during the build

The installed Next.js 16.4.0 build reported existing security advisories and interrupted each fresh build once after compilation; the tool-permitted retry passed without dependency changes. The public npm advisory endpoint also returned advisories for that version. One confirmed [critical image-optimization advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw) lists 16.4.0 as affected and 16.4.1 as patched; its documented impact concerns glibc-based Linux. This frontend work does not upgrade or certify the framework. Coordinate a separate dependency/security patch and regression run before public deployment. No build-tool instruction to run an upgrade agent or change worktrees was executed.

## SOP3 handoff and remaining checks

Functional suitability is supported by existing workflow regression checks; usability by responsive layouts, plain-language status, keyboard/contrast/target checks; reliability by honest stale/offline/queued feedback and PWA checks; performance by measured cold-load samples; maintainability by shared tokens/components and zero protected-contract differences. Full-system security remains conditional on backend/hosting review and the dependency issue above.

IT experts and TODA members must still complete the approved SOP3 tasks/questionnaire. Test actual phones (including the onscreen keyboard and assistive technology), low-bandwidth/cloud operation, real GPS/sensors, actual provider email/SMS delivery and deployment security separately. Do not convert fixture passes into participant ratings, hardware PASS, guaranteed service availability or ISO certification.

Reproduce after building: `npm.cmd run lint`, `npm.cmd test`, `node --import tsx tests/frontend-design-browser.ts`, `tests/frontend-polish-browser.ts`, `tests/operational-browser.ts`, `tests/setup-checklist-browser.ts`, `tests/help-menu-browser.ts`, `tests/mobile-startup-browser.ts`, `tests/navigation-browser.ts`, `tests/frontend-performance-browser.ts`, and `tests/regression-preview.ts map-browser pwa` (each TypeScript runner uses `node --import tsx`). Use only the disposable fixture setup supplied by those runners.

### Mobile tab-indicator motion — 24 October 2026

The mobile driver workspace switches page content instantly. Only the yellow marker slides between the six bottom tabs, using the existing 240ms transition. Page content has no slide or fade animation. Reduced-motion preferences disable the marker transition. The translucent navigation background remains unchanged.

Validation: production build and lint passed. Disposable-account navigation checks passed for admin/operator refresh behavior and stationary page content, Energy-to-Notifications navigation, rapid tab changes, reduced-motion fallback, and marker alignment at 320/360/390px. The rebuilt live phone preview rendered in both themes. Actual phone performance and participant acceptability remain unverified.

### Driver Home composition — 24 October 2026

Adapted the supplied mobile reference into a SOLAIR vehicle-led Home: compact personal greeting and refresh, larger assigned BEMAC/uploaded vehicle illustration and model, a location/details strip, then the existing four reading cards. Driver quick actions follow the reading group; unassigned accounts retain early quick actions and setup guidance. Existing no-data, stale/unknown, simulated/hardware and city-reference semantics are preserved. The translucent six-tab navigation and its sliding yellow indicator remain intact. Changes use the existing frontend components and tokens; backend/package baseline comparison remains unchanged.

Production build and lint passed. Both themes were visually reviewed, responsive role/navigation checks covered 320/360/390px, and isolated setup checks covered pending/completed assignments. The existing assigned demo account also passed sign-in, ET-06/operator association, single authorized vehicle, and simulated-label checks through the live phone proxy. Real-phone and TODA participant evaluation remain outstanding.

### Translucent driver energy cards — 24 October 2026

Added a reusable DriverEnergySummary beneath the assigned vehicle artwork, with a translucent tray and four interactive cards: battery voltage/current (V/A), recorded solar energy (Wh), recorded wind energy (Wh), and derived PV input power (W). Each opens the existing Energy destination. Existing connection, location, security and sensor-health workflows remain below it. No extra API requests or backend changes were introduced.

Instantaneous electrical values respect hardware calibration; null/nonfinite inputs remain unavailable, signed current and valid zero totals are retained, and old/unknown capture times remain labeled. Harvested energy is explicitly a recorded total with gaps excluded, not a daily total or a live rate. Missing wind hardware is labeled not commissioned. Demonstration readings stay labeled simulated.

Validation: four targeted reading-quality tests, production build/TypeScript, lint, and responsive role/navigation checks passed. Light/dark screenshots were reviewed and the Energy details control was exercised. Mobile checks covered 320/360/390px; the existing assigned demo account also passed through the live preview. Actual phone performance and physical sensor measurements remain outside these software checks.

### Visible Home glass backdrop — 24 October 2026

Matched Home card opacity was visually indistinguishable over the nearly flat cream page. Added a static SOLAIR amber/blue background behind the driver Home workspace, removed the remaining opaque location/details strip, and retained the shared 28% card/20% panel tints. Secondary text is darker in light Home for readability. Other destinations retain their existing background. The previous duplicate-footer-spacing correction is preserved.

The production build passed. Light/dark screenshots of status, quick actions and Priority activity were reviewed from the live built preview, without injected CSS. Actual computed alpha values remain 0.28 for cards and 0.20 for panels. No backend or data behavior changed.
