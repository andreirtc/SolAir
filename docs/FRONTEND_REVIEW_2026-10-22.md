# Frontend review — 22 October 2026

Scope: current uncommitted local application, production build, isolated seeded databases and Chromium desktop/mobile emulation. Working accounts, hardware and paid providers were not modified. These checks do not establish ISO acceptability or real-phone usability.

| Area | Result and evidence | Limits / remaining work |
|---|---|---|
| Mobile usability | Design suite passed driver layouts at 320/360/390px, 44px bottom-navigation targets, desktop/mobile role home screens and visited role pages without horizontal overflow. Form suite passed message composer at 320/390px. Screenshots reviewed for light driver home and dark TODA menu. | Actual phone, keyboard-open layout and TODA task observation still needed. Driver overview is long; shortening secondary content is a usability opportunity rather than a failing test. |
| Role-specific screens | Design and operational suites passed driver/operator/admin/engineer destinations; separate admin home and directory; operator admin navigation hidden and tested admin APIs return 403. Driver cannot acknowledge operator incidents. | This is sampled UI/API coverage, not a complete authorization audit. |
| Status clarity | Map checks passed BEMAC/Manila and NWOW/Malabon references, actual GPS priority, invalid/no GPS and assigned-driver switching at 1440/390px. Operational suite passed unknown/stale sensor-age and simulated-reading labels. PWA suite passed offline shell and no private API caching. | Actual GPS, basemap-provider availability and device/network failures need integration testing. |
| Form feedback | Network/503 errors recover, password visibility works, and delayed sign-in/help/message submissions do not duplicate. Operational suite passed contact save feedback, disabled verification explanation, incident acknowledgment/notes/resolution and retained note drafts during incident refresh. | Hosted email/SMS/provider delivery remains outside this frontend review. |
| Navigation | Admin/operator/mobile-driver refresh and logout checks passed. Driver history link and refresh now pass after the correction below. | Page is saved per account/TODA/tab. Selected vehicle, history offset and other component-local state are not persisted across full reload. |
| Accessibility | Tested theme text tokens and TODA popup text meet 4.5:1 contrast; driver bottom targets meet 44px; skip link/focus, keyboard quick action and TODA Escape/focus behavior pass. | These are targeted checks, not full WCAG coverage. Screen reader, full keyboard traversal and all control target sizes need further audit. |
| Performance | Single cold-cache phone-emulation runs recorded below; navigation and sign-in remained usable without runtime errors. Fonts total below 90kB. | No acceptance threshold agreed. Local backend, desktop CPU emulation and simulated bandwidth do not establish real-device/cloud performance or Core Web Vitals. |

## Regression found and corrected

The new refresh-navigation allowlist excluded the driver's existing **View my history** destination. Clicking it returned to Overview. `History & Reports` is now an allowed driver destination; backend assignment restrictions remain in place. The operational browser test also refreshes this destination and verifies the correct ET-02 research evidence remains available. Its full workflow suite passed after rebuilding.

The older checklist test assumed refresh returned to Overview. It was updated to navigate back explicitly before testing the next shortcut, matching the newly requested refresh behavior.

## Performance measurements

One sample per condition, 390×844 Chromium phone emulation, cold cache, service workers blocked for cold measurements, loopback backend. Slower profile: 1.6Mbps download, 0.75Mbps upload, 150ms configured latency, 4× CPU slowdown. No representative percentile or pass threshold is claimed.

| Measurement | Unthrottled localhost | Simulated slower profile |
|---|---:|---:|
| Navigation start to sign-in fields available | 1,109ms | 2,972ms |
| Sign-in click to driver dashboard shortcut available | 194ms | 1,179ms |
| Settings click to heading visible | 98ms | 171ms |

Raw results and screenshots are ignored local artifacts under `test-results/frontend-design/`, `frontend-performance/`, `operational-ui/` and `regression-preview/`. Reproduce with `tests/frontend-design-browser.ts`, `tests/frontend-polish-browser.ts`, `tests/frontend-performance-browser.ts`, `tests/operational-browser.ts`, `tests/navigation-browser.ts`, `tests/setup-checklist-browser.ts` and `tests/regression-preview.ts map-browser pwa`. Build before browser suites. Lint and the production build passed after the history correction.

Recommended next checks: preserve selected vehicle context on reload; test real driver phones with the onscreen keyboard; complete screen-reader/keyboard coverage; agree load-time targets and measure on the deployed backend with TODA participants.

## Approved driver Overview simplification

The driver Overview now presents quick actions for location/alerts/help, compact assigned-vehicle identity, vehicle status and priority activity. Full setup and registration details are in Settings; required unfinished setup remains visible as a compact reminder linking directly to the Settings checklist. Energy remains available through Energy navigation and the status card. Duplicate help and energy summary sections were removed from Overview. Operator/admin Overview composition and sign-in artwork were preserved.

In the same 390px fixture, the Overview screenshot height fell from 4,721px to 2,446px. Desktop/mobile setup shortcuts and all four role/theme design checks passed. The operational suite passed in isolation; its first concurrent run timed out waiting for contact-save feedback, so that first run was not counted as a pass. Production build and lint passed. Screenshots remain in ignored test-results directories; this does not replace actual TODA usability testing.

## Driver bottom navigation follow-up

At the user's request, Notifications replaced Help in the driver bottom bar. It opens the same feed as the header bell; closing/Escape returns focus to the invoking button. Help remains available through the account menu, sidebar and Overview assistance shortcuts. Targeted fixture checks passed at 320/360/390px for target size/overflow, mobile feed filtering, mark-all-read, destination navigation, toggle/close/Escape behavior, and continued desktop/mobile Help links. Build and lint passed. An older notification suite did not complete because its seeded `Device offline` alert was absent; that broader legacy suite was not counted as passing. The targeted test uses a deterministic notification fixture and does not create real fleet alerts.

The user subsequently requested a full Notifications page instead of that popup. The bottom tab now navigates to Notifications, highlights as current, and preserves the page after refresh. The shared feed renders inline with full-width rows, filters, read controls, empty/error states and destination links. No close button or dialog is rendered for this page; the desktop header bell retains its popup on other pages. Targeted checks passed for page restoration, persistent read state, notification detail navigation, absence of an overlay/unassigned-vehicle panel, and 320–390px layout.
