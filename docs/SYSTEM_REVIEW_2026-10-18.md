# SOLAIR: what to fix and add

Reviewed 18 October 2026. Project: `C:\Users\Anyang\Videos\SolAir\solair-platform`.

**Verdict:** the application has a working software foundation. It is not yet a verified vehicle system. Fix the data/evidence bugs first, prove one ESP32-to-dashboard bench demonstration, then add the remaining research features.

This review inspected the current Next.js application, backend, database schema, telemetry contract, PWA and `firmware/esp32-solair`. It did not review the separate older `C:\Users\Anyang\SolAir\figma-app` project or merge another AI's hardware changes. No application behavior, firmware configuration, credentials or live records were changed. Earlier map changes were preserved.

## Checks performed now

| Check | Result |
| --- | --- |
| Unit/API/provider tests | 39 passed, using isolated databases; provider connectivity is mocked. |
| Type checking and lint | Passed. |
| Next.js production build | Passed. |
| Existing browser workflows | 14 passed against a separate production preview and temporary SQLite database. |
| Existing PWA checks | 10 passed: installability checks, cached application files, offline shell and mobile width. |
| Additional backend probes | Reproduced older-event rejection, old samples receiving Online status, and the 200-message cutoff. |
| Additional browser probes | Admin Settings rendered; reproduced CPE session mix-up and default vehicle selection mismatch. |
| ESP32 `esp32dev` build | Passed: RAM 46,516 bytes, flash 790,137 bytes. Nothing uploaded. |
| Physical hardware, actual Android installation, cloud access | Not tested. |

Browser checks used mock map images to avoid repeatedly downloading public tiles. They verify layout and behavior, not current basemap availability or physical GPS reception. The preceding map fix and Malabon default remain in the code.

Evidence from this review is under ignored `test-results/review-20261018/`: `browser-results.json`, `pwa-results.json`, `probes.json`, `edge-browser.json` and screenshots. These are local review artifacts, not research measurements. The preview used port 4173 and a separate database; the working site on port 3000 was preserved.

## Fix first

### 1. Keep CPE test evidence attached to the correct vehicle

**Reproduced:** save a BLOCKED test for ET-01, switch CPE Lab to ET-02 and save again. The second record is stored under ET-01 because the old bench session remains selected.

Source: [Lab state and save](../src/Lab.tsx), especially `session`, the device-change effects and `save()`; [bench routes](../server/app.ts).

**Proposed fix:** reset session, live samples, token display and test state on device/mode changes; ignore late responses from the previous device. Have the backend validate the expected device and source partition when saving.

**Done when:** switching ET-01 → ET-02 and hardware → demo cannot attach evidence or credentials to the previous selection.

### 2. Preserve buffered events when data arrives out of order

**Reproduced:** after accepting sequence 10, the backend rejects a previously unseen sequence 9 lid event with HTTP 409. No lid event is stored. Firmware treats 409 as acknowledged and removes that queued frame.

This matters when USB forwards newer samples while older Wi-Fi frames are buffered. It can also matter when uploads arrive out of order. Duplicate handling alone does not solve this.

Source: [ingestion sequence checks](../server/app.ts) and [Wi-Fi queue acknowledgment](../firmware/esp32-solair/src/main.cpp).

**Proposed fix:** distinguish an already-stored duplicate from a previously unseen delayed record. Store valid delayed events without letting old data replace the latest live position/state. Test both transports together.

**Done when:** a delayed lid event is durably saved once, the newest dashboard state remains newest, and failed persistence never receives an acknowledgment that discards the event.

### 3. Finish local alarm behavior before enabling a powered siren

**Code finding:** there is no automatic alarm duration limit. An alarm stays active until USB clear/disarm or restart. Network uploads use a separate task, but queue mutex waits, flash writes, sensor reads and USB calibration/LED delays still need timing checks.

The detector also uses `else if`: simultaneous lid/mount/motion triggers produce only one event. Arming while a switch is already released does not itself create a tamper event. These behaviors need an explicit policy.

Source: [firmware loop, commands and queue](../firmware/esp32-solair/src/main.cpp), [sensor reads](../firmware/esp32-solair/src/sensors.h).

**Proposed fix:** implement and measure a bounded local alarm cutoff; define startup, already-tampered arming, simultaneous triggers and clear/retrigger behavior. Ensure blocking work cannot defeat the cutoff. Keep powered-siren flags disabled pending electrical review.

**Done when:** measured local alarm and cutoff behavior is correct during Wi-Fi failure, sensor failure, queue pressure and calibration. Compilation is not this evidence.

### 4. Use the actual assigned vehicle everywhere

**Reproduced with a browser-only fleet fixture:** when the displayed vehicle is ET-02, Messages initially requests ET-01. The selection starts as ET-01 while the display independently falls back to the first available vehicle. History uses the same stored selection.

Source: [selected state, fallback vehicle and page fetching](../src/main.tsx).

**Proposed fix:** synchronize selection to an authorized vehicle after login, assignment changes and fleet refresh; use the resolved vehicle consistently. Reset history pagination when changing vehicles or partitions.

**Done when:** a driver assigned only ET-02 sees ET-02 messages/history immediately, without needing to send a message first. Server authorization must remain enforced.

### 5. Separate connection status from reading age

**Reproduced:** uploading an hour-old reading makes receipt-based status Online. This can legitimately indicate a recent upload, but it must not imply a recent sensor measurement. The hero's recent-sample wording currently uses connection status. Existing stale-reading banners help, but the distinction is inconsistent.

Source: [fleet response](../server/app.ts), [freshness function](../packages/telemetry-contract/index.ts), [dashboard labels](../src/main.tsx).

**Proposed fix:** show last contact, measurement time and GPS-fix time separately. Identify device UTC versus server-receipt fallback; use uptime/boot identity when UTC is unavailable. Keep old positions visibly last known.

**Done when:** delayed uploads never make historical readings look live. A connected ESP32 with a failed sensor must not imply fresh sensor data.

### 6. Fix message history and refresh behavior

**Reproduced:** the message query returns the oldest 200 records, so message 201 disappears from the returned conversation.

**Code finding:** history and energy chart requests refresh on page/vehicle/mode changes, but are not consistently refetched when new telemetry arrives. Chart points are equally spaced by record index rather than elapsed time.

Source: [message query](../server/app.ts), [history fetching and EnergyHistory](../src/main.tsx).

**Proposed fix:** load recent messages with pagination, refresh the visible history/chart on new data, and plot actual timestamps with gaps.

**Done when:** message 201 appears, older messages remain accessible, and a new sample updates the open chart without leaving the page.

## Next improvements

| Area | Current limitation | Proposed improvement |
| --- | --- | --- |
| SOS retry | Queued requests retry on a browser online event or the existing Retry delivery button. Server recovery while Wi-Fi stays connected does not trigger automatic retry. All submission errors are queued, including permanent validation/access failures. | Retry transient failures after service recovery/login, prevent concurrent queue flushes, and distinguish rejected from unsent. Preserve idempotent IDs and account/mode scope. |
| Login/logout | Normal logout passes. Failed logout is not handled in the UI. Open event streams retain the identity captured at connection until close; APIs still reauthorize requests. | Handle expired sessions and offline sign-out clearly; close/revalidate streams on revocation/workspace changes. Do not claim an offline request revoked the server session. |
| CPE diagnostics | A USB reading is displayed before backend storage succeeds; failures appear mainly in the serial log. Calibration records do not configure the firmware. | Separate USB received, backend accepted, stored and dashboard refreshed indicators. Show the calibration version actually applied by firmware. |
| Firmware queue | 40-frame maximum; routine records can be lost, persistence writes are unchecked, and events share the finite queue. The default NVS flash partition is 20 KB. | Measure serialized capacity, check flash-write results, limit write wear, show queue depth/drop counts, and test restart recovery. Do not promise 40 persistent frames without that test. |
| Reports | JSON only; telemetry export stops at 5,000 rows. History has no date/sensor filters. | CSV, date ranges, explicit completeness/counts, units, source labels and event/evidence exports. |
| Permissions in the interface | Engineer views can show assistance action buttons although the backend permits only operator/admin updates. Driver messages are reached through Profile. | Match visible controls to enforced permissions and give drivers a clearer messages entry. |
| Production operation | Hosting, SMTP recovery, separate-network synchronization and backups remain unverified. Ingestion limiting is shared per IP/process. | Verify actual deployment, recovery and restore; add fleet-aware limits and operational monitoring before scaling. Any paid service needs a cost decision first. |
| Mobile presentation | Main driver layout passes width checks. Floating notices and bottom navigation can cover content while visible; long lab/admin pages need more usability work. | Check touch targets, scrolling, loading/error states and keyboard access on actual phones. |

## Current feature inventory

| Feature | What exists | What still needs work |
| --- | --- | --- |
| Login, logout, roles | Real driver/operator/engineer/admin authorization; assigned-device and TODA restrictions. | Session-expiry/offline UX and actual hosted recovery tests. |
| Driver dashboard | Mobile navigation, approved white BEMAC image, reported energy/security data. | Correct vehicle selection; physically verified readings. |
| TODA dashboard | Fleet counts, vehicle list, registration/assignment, assistance and incidents. | More search/filtering and tested larger-fleet performance. |
| Malabon fleet map | OpenStreetMap, Malabon default/reset, GPS markers, last-known labels, explicit vehicle framing. | Actual GPS reception, changing-position and stale/no-fix field tests. Keep the existing map; no Google Maps or paid map service proposed. |
| Battery/solar/wind | Separate measurement fields and recorded solar/wind energy integration. | Default firmware still emits null electrical measurements. Wind is not commissioned. |
| Savings | Recorded solar value using an illustrative fixed PHP 12/kWh tariff. | Configurable tariff, time periods and a defensible savings method; this is not verified cost savings. |
| Forecasting | Extension interface and honest unavailable state. | A measured battery model, state-of-charge method and validation. |
| Security | Firmware motion/switch detection, local LED/alarm state, persisted incidents and acknowledgment. | Alarm fixes and hardware validation. Driver/operator remote arm/disarm is absent; CPE commands use USB. |
| SOS | Persisted requests, acknowledgment/resolution and account-scoped unsent queue. | Recovery/error handling and real-world response procedures. |
| Messages | Persisted conversations and explicit read acknowledgment. | Recent-message pagination and assigned-vehicle selection fix. |
| History | Recorded telemetry table, pagination, JSON export, PV chart. | CSV, filters, timestamp axis and live chart refresh. |
| CPE Lab | USB bridge, diagnostics, credentials, test evidence and calibration references. | Correct session/device binding and genuine bench measurements. |
| PWA | Installable production shell; offline unsent-help behavior; private API responses excluded from cache. | Actual Android installation test. Cold offline startup shows sign-in; offline maps and browser push are absent. |
| Administration | Invitations, role changes, organizations, workspace switching and audit records. | Invitations are manually shared; deactivation/unassignment/device replacement workflows need design. |

## Add only after the fixes

1. **One proved physical bench flow:** MPU6050 and switches → ESP32 → USB → backend → saved event → operator/driver view. Follow [HARDWARE.md](HARDWARE.md); record actual results.
2. **GPS commissioning:** valid/no-fix/stale fixes and movement in Malabon, including reboot and network loss. GPS is disabled in the example firmware until verified.
3. **Independent calibrated energy sensing:** battery, PV input and controller output first; wind only after its hardware is commissioned. Firmware must emit the actual calibrated values, not specifications.
4. **A practical arming method:** decide whether a local physical control or authenticated remote command is required. Current bench commands require USB. Any remote version needs device acknowledgment and expiration; clicking a button must not falsely report Armed.
5. **Research reports:** CSV plus time-based plots, calibration/firmware identification and exportable test evidence.
6. **Later research additions:** LTE data transport, validated SOC/runtime predictions and optional background notifications. LTE currently performs AT detection only.

## Recommended next action

Start with the **CPE evidence/vehicle binding fix**, then selection, buffered events and local alarm behavior. These affect whether a demonstration and its saved evidence can be trusted. Re-run the relevant regression checks after each fix. Then perform the small physical bench flow before expanding the dashboard.

Canonical references: [hardware](HARDWARE.md), [telemetry](TELEMETRY.md), [architecture](ARCHITECTURE.md), [hosting setup](RAILWAY_SUPABASE.md). The older [verification report](VERIFICATION.md) records previous results; the checks above are the results performed for this review.
