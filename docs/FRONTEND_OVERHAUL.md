# SolAir frontend overhaul and SOP3 evaluation guide

19 October 2026 · local branch `feature/solair-frontend-overhaul`

## Scope and backend handoff

This change redesigns the existing React/TypeScript/Next.js frontend. It does not migrate the app to Vite or create a second site. The teammate's backend can continue using the existing requests and responses. No server route, authentication rule, database schema/migration, device contract, firmware, private configuration or working account is changed by this frontend work. Existing demonstration/hardware separation, disabled SMS, authorization and protected engineering tools remain authoritative.

The current checkout is the flat `solair-platform` application. The group's canonical layout is `next-platform/solair-platform`; transfer reviewed frontend files into that application when integrating with the group's main history. Do not replace backend files or merge unrelated Git histories. Commit and push remain for the user to run.

### Changed frontend surfaces

- Original vector logo recreates the supplied sun flare, solar arc, Sol/Air wordmark and wind strokes. It is SVG geometry/text, not a screenshot. `src/Brand.tsx` adapts the inline logo to the theme; `public/solair-logo.svg` is the editable standalone light-color artwork. `public/icon.svg` is the simplified app symbol, with reproducible PNG install icons via `node scripts/render-brand-icons.mjs`.
- Outfit headings and Work Sans body text are self-hosted under `public/fonts/`; their OFL licenses are included. The two font payloads total 82,608 bytes. Font loading does not contact Google Fonts.
- `src/design-system.css` owns the new palette, semantic colors, typography, navigation, forms, cards, tables, overlays, role entry surfaces, phone layouts and reduced-motion rules. Existing structural CSS remains in `src/style.css`; the new layer loads afterward. Keep new visual rules in the design layer instead of adding competing ad hoc colors to screens.
- Drivers get compact Location/Alerts/Get help shortcuts, then the BEMAC and vehicle status. Setup and registration stay available below the vehicle overview. Unassigned drivers still see setup guidance. Technical measurement details are expandable; unknown readings do not become safe/healthy claims.
- Setup checklist tiles are keyboard-accessible actions. Profile, registration, alert contact and verification steps navigate to and focus their specific Settings section. Missing TODA/vehicle/operator assignments and pending operator access open administrator guidance; they do not grant self-assignment. Desktop/mobile navigation is covered by `tests/setup-checklist-browser.ts` with a disposable database.
- Operators retain fleet monitoring and response shortcuts. The administrative restrictions are unchanged.
- Administrators get a management introduction, clear task/count cards, workspace actions and activity history. Counts still come from the existing authenticated summary API. The activity form no longer remounts on every summary refresh, preserving a user's filters.
- Engineers retain the CPE Lab and diagnostic workflows with the shared design. Neither a new color nor a compiled screen marks a physical check passed.
- Authentication, signup, contact/registration settings, support, incidents, messages, maps and research screens share the visual system. The existing half-second mobile intro and saved-session behavior remain.
- Keyboard users get a skip link, visible focus rings, and current-page navigation semantics. Statuses retain words/icons as well as color. Mobile form text is 16px; primary controls aim for at least 44px touch targets. Test results below state the verified scope rather than asserting complete accessibility certification.
- PWA metadata/icons match the palette. The service worker precaches the two local fonts alongside the existing offline shell; private API caching rules remain unchanged.

## Design sources and tools

Inspiration: [andreirtc/solair-manuscript-automation](https://github.com/andreirtc/solair-manuscript-automation), inspected at `451cfdeb677ec3c18dacbd04f15c3c124afa53bd`. Adapted principles: warm surfaces, restrained solar/blue accents, clear typography, task entry points, and readable states. Its fonts and licenses were reused. The manuscript/chat workflows, mascots, content and application architecture were not copied.

Implemented with React/TypeScript, custom CSS/SVG and the existing Lucide icon system. Playwright checks software fixtures in disposable databases. Impeccable and UI UX Pro Max were not installed in this session and are not claimed as used. ImageGen was unnecessary for the code-native logo; the approved BEMAC artwork is preserved. No decorative robot is required to explain vehicle state.

## Palette

| Purpose | Light | Dark |
|---|---|---|
| Page / cards | `#FFFDF8` / `#FFFFFF` | `#12161D` / `#171E28` |
| Text / secondary text | `#202B3A` / `#626D79` | `#EEF1F6` / `#B2BDCC` |
| Primary blue / light hover | `#1959B5` / `#12458F` | `#88B7FF` / `#A9CBFF` |
| Solar / gold actions | `#E69A18` / `#EFB142` | `#FFBD4F` / `#FFC466` |
| Borders | `#DCE0E4` | `#394657` |
| Pale solar / pale blue | `#FFF2D8` / `#EAF0FB` | `#352D1F` / `#202F48` |
| Success / error | `#267153` / `#A02F32` | `#87CBA8` / `#F1A5A8` |
| Engineering purple / support pink | `#7250A6` / `#A83D75` | `#BD9BEE` / `#E7A0C6` |

Amber is an accent rather than small body text on cream. Gold buttons use navy text. Blue supports navigation; green/red describe outcomes rather than roles. Theme preferences retain the existing Light/Dark/System behavior and storage key.

## SOP3: what the design supports and what evaluators must measure

ISO/IEC 25010:2011 defines quality models used to specify and evaluate quality; an attractive screen alone does not establish acceptability. [ISO's official description](https://www.iso.org/standard/35733.html) also records that the 2011 edition is withdrawn. This project keeps the **2011 framework specified in SOP3**; any methodology change belongs with the research adviser. Security and maintainability are treated separately below while retaining SOP3's combined evaluation grouping.

| SOP3 area | Frontend support / software check | IT expert or TODA acceptance task |
|---|---|---|
| Functional suitability | Existing destinations and API shapes preserved; role navigation and key workflows tested | Driver locates vehicle, reads a status, opens an alert and submits authorized help. Operator follows up within own TODA. Admin locates a registrant and manages the proper workspace. Record completion and incorrect results. |
| Usability | Plain-language shortcuts, labeled controls, readable typography, themes, visible keyboard focus, skip link and phone target checks | Ask TODA members to complete tasks without coaching. Record time, wrong turns, requests for help and questionnaire ratings. Include users with limited technical familiarity and actual phones. |
| Reliability | Unknown/stale/offline/queued messages retained; existing PWA and failure-path regression checks | Disconnect/reconnect the network. Confirm stale data remains labeled and unsent actions are distinguished from received actions. Physical buffering/cutoff requires separate hardware evidence. |
| Performance efficiency | Small SVG artwork, locally served fonts, no new dependency or animation engine; local navigation durations recorded | Measure initial load and task response on the target phone/network, including low bandwidth. Agree performance thresholds before scoring; local fixture timings do not represent LTE or cloud operation. |
| Security | No new privileges, password/role/device handling or direct database access; server permission checks retained | IT experts verify operator/admin separation, assigned-driver access, logout and unauthorized requests against the integrated backend. Frontend-only tests cannot certify the full system's security. |
| Maintainability | Central tokens, separate design layer, reusable brand/quick-action components, no dependency/lockfile change, documented API boundary | Teammate reviews transfer scope, theme consistency, readable components and regression procedures. Verify on the final group integration branch. |

Use the approved SOP3 questionnaire, scoring scale and sampling plan. Do not invent participant ratings, a pass percentage, an ISO certification or a physical PASS from browser checks. Record the tested commit, browser/device, role, scenario, result and supporting evidence. Keep participant contact information out of public evidence.

## Reproduce checks

From this application root:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd test
node --import tsx tests/frontend-design-browser.ts
node --import tsx tests/operational-browser.ts
node --import tsx tests/mobile-startup-browser.ts
node --import tsx tests/regression-preview.ts
```

The browser runners use disposable fixture databases/ports. Never point mutation tests at a working fleet database. Map tiles are mocked where specified: layout results do not establish real GPS or tile-provider availability. Software results and visual evidence live under ignored `test-results/`; backend/hardware acceptance remains in [OPERATIONAL_ACCEPTANCE.md](OPERATIONAL_ACCEPTANCE.md).

## Validation record

Initial build/type checking passed. Lint caught an undeclared `console` in the new icon renderer; an explicit Node console import corrected it and lint passed. The new design suite caught an undersized phone bottom-navigation button; equal-width grid targets replaced content-sized buttons. Browser-harness corrections used actual Tab/Shift+Tab for focus-visible, authenticated in-page fetch for secure-cookie permission checks, and the existing CPE Lab label including its LAB badge. Final visual captures wait for the BEMAC image to load.

| Check | Final result and limits |
|---|---|
| Build and TypeScript | Passed on the final application source. |
| Lint | Passed after the icon-renderer correction; final workflow-runner command also completed lint successfully. |
| Isolated software tests | 91/91 passed. No working database was used. |
| Role workflows | 18 browser groups passed on the final layout, including assignments, settings, protected CPE access and retained operator incident responses. |
| Existing account/theme/logout checks | All 4 reported groups passed on a disposable preview. |
| Malabon map layouts | Both 1440px and 390px cases passed, including recentering/selection. This does not prove physical GPS or production map availability. |
| Existing fleet browser | 14/14 checks passed, including demonstration isolation, help/messages, authorized evidence and offline help retry. |
| PWA/offline | 11/11 checks passed, including fonts/static shell caching, no private API caching, installability observations in Chromium and zero service-worker errors. No physical phone installation was performed. |
| Mobile startup | Passed: approximately 0.5-second intro, saved-session routing, slow-session handling, equal auth actions at 320/390px, logout and desktop behavior. |
| New frontend design checks | All 4 roles passed light/dark home layouts at 1440/390px, authorized mobile navigation, body/secondary/blue text contrast against page/cards, SVG branding and local fonts. Driver navigation targets passed 44px minimum at 320/360/390px; keyboard shortcut/skip-link and System theme checks passed. No browser runtime errors. This is targeted accessibility coverage, not a full WCAG certification. |
| Backend boundary | Git diff contains no changes under server, backend, firmware or packages, and no package/lockfile changes. |

Local screenshots and machine-readable results: `test-results/frontend-design/results.json` and the existing fixture-runner output folders. Navigation durations are local fixture observations, not cloud/network benchmarks or research participant scores.

No account, private database, physical hardware, paid service or cloud deployment has been commissioned by this work. Actual SOP3 acceptability remains pending expert/TODA evaluation.

## Sign-in artwork and viewport-fit follow-up

The desktop sign-in entry uses `src/SignInArtwork.tsx` and scoped `src/sign-in.css`. The final user-approved direction restores the original stacked composition: logo, “A smarter journey starts here” heading, introductory text and a large BEMAC below, on the pale blue background with its subtle solar rings. The interim floating composition, map/energy/security cards and vehicle frame are removed. Sign-in and signup forms remain wider on desktop, with 17px input text and larger labels/actions; short laptop windows use a compact variant. The mobile launch artwork and white glow remain unchanged.

The desktop sign-in shell fits one dynamic viewport; the form can scroll internally if extra fields, an error, zoom or a short window require it. Signup, mobile layouts and dashboards retain normal content scrolling so controls are not clipped. Read-only visual checks confirmed no document horizontal/vertical overflow at 1920×876, 1440×900, 1366×768, 1280×600, 1024×600 and 800×900; mobile sign-in was also checked at 390×844. Light and dark screenshots were inspected under ignored `test-results/signin-fit/`. These are browser viewport checks, not physical-device acceptance.
