# Energy page illustration and graph update

Updated 24 October 2026. Frontend only; no backend, authentication, permission, package or API-contract changes.

## Interface

- Solar uses the generated panel illustration; wind uses the transparent cutout edited from the user-supplied product image. The two active WebP assets preserve transparency and total 193,998 bytes. Neither image is evidence of commissioned equipment.
- Both illustrations are enlarged and clipped within their source sections. Cards initially sit below the image. As the page scrolls down, bounded CSS sticky artwork lets the first card row overlap the image progressively, capped at 80–100px across mobile and desktop layouts. Scrolling back restores the initial separation. This uses native scrolling without animation libraries or scroll event handlers. Reading cards use the shared 28% surface tint with 2px background blur, keeping the underlying artwork visible without fading text or chart values.
- Solar uses a tighter, upper-left crop at 160% width: the right side extends beyond the section and the lower panel extends behind the cards, following the supplied framing reference.
- Each source has four translucent reading cards. Solar: PV input V/A, PV power W, and separate controller-output V/A. Wind: output V/A, power W, and recorded energy yield Wh.
- Voltage uses small traces, current uses bars, and power uses area curves. Controller voltage/current use separate plots and units.
- Battery metrics, harvested-solar total, CPE channels/history/export, calibration notes and forecasting limitations remain available below the new sections.
- Page content switches immediately. Only the existing yellow navigation marker slides.

## Data and integration

Current values use existing fleet fields. PV input and controller output remain separate. CPE/bench meter power is never substituted for PV production. Uncalibrated hardware electrical values, absent values and nonfinite numbers are not plotted as valid measurements. Valid zeroes and signed currents remain valid.

The new graph component reads the existing authenticated `/api/history/:id?mode=...` endpoint on entry and every 15 seconds, with a single request in flight. It uses up to 24 eligible timestamped records from the latest 100 returned records, sorts by capture time, deduplicates frame identities, and excludes wrong modes, invalid/future timestamps, historical CPE frames and event frames. Mode/vehicle changes clear the visible graph window. Error and retry controls are inline; refresh failures can retain previously loaded history with an explicit error message.

Missing readings and gaps greater than 30 seconds break graph lines. No independence percentages, capacity gauges, performance scores or estimated savings were invented. The wind Wh graph integrates only valid intervals in its displayed sample window using the existing trapezoidal integration helper. This is clearly distinguished from the card's full recorded total supplied by the backend. No wind commissioning or operational yield is claimed.

## Software evidence

- Production build/TypeScript and lint passed.
- Eight targeted tests passed: new chart parsing/quality/gap/integration cases plus existing Home energy-value cases.
- `tests/energy-design-browser.ts` passed on a disposable database: empty hardware history, four cards per source, loaded artwork, synthetic recorded-value plots, 320/360/390/1440px layouts in both themes, source links, retained battery/CPE content, and history failure/retry recovery. Synthetic values were injected only into isolated browser responses, never operational records.
- Navigation regression passed: driver/operator/admin refresh retention and driver marker-only motion, including Energy to Notifications, rapid selections, mobile marker alignment and reduced-motion behavior.
- The existing assigned demo account rendered the new Energy page through the live phone proxy. Its readings remain explicitly simulated and old readings retain their age labels.

Screenshots are in ignored `test-results/energy-redesign`; live-preview captures are ignored under `.tools`.

Actual phone performance, physical solar/wind/controller measurements, installation acceptance and TODA participant evaluation remain unverified. The existing Next.js dependency advisory remains a separate deployment issue recorded in the main frontend report.
