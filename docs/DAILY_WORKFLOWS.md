# Driver setup, incidents and research evidence

Use the combined local site at **http://localhost:3000/**. Start instructions and private rollback information are in [PORT3000_INTEGRATION.md](PORT3000_INTEGRATION.md). Real SMS remains disabled in this launcher.

## What to do in the app

1. **Administrator:** open **People & assignments**. Search the new account. Save its correct TODA and approved access. Use **Drivers needing a vehicle / operator** to find unfinished assignments. The directory now shows saved vehicle IDs, models, responsible operators and whether the alert contact is verified with consent. Private phone numbers are not listed.
2. **Administrator:** in the user's TODA workspace, use **Vehicle assignments and invitations** on the same page to assign the correct registered vehicle and responsible operator. Administrators can open a different TODA through **Organizations**. A vehicle's ID/model comes from its registered record, not public signup.
3. **Driver:** sign in again after an administrator changes membership. **My vehicle → Account setup** shows the remaining steps. Completed assignment checklists collapse. Optional contact verification is separate. **Settings** keeps registration, appearance and contact preferences.
4. **Driver:** use **Your vehicle status** for connection, battery, GPS and security. Expand **Sensor status and reading ages** for details. A recent server contact does not make every sensor current. Unknown UTC time stays unknown. Old security reports are not presented as current armed/disarmed confirmation. Battery voltage is not a remaining-range estimate.
5. **Driver/operator:** open **Alerts/Security → SMS alert readiness** to see unmet notification requirements. This check sends nothing. In Settings, verification buttons are unavailable when the verification service is disabled. Saving preferences does not verify ownership or send a text.
6. **Operator/authorized engineer/admin:** under **Security → Alarm incidents and SMS delivery**, acknowledge the incident, record a shared note, then **Resolve with this note**. Notes require at least 10 non-space characters. Resolved incidents remain readable. Acknowledgment and resolution do not disarm the ESP32 or prove that a siren sounded. The first acknowledgment is preserved; repeat or out-of-order transitions are rejected.
7. **Driver:** use **View my history** on the vehicle status card. Staff use **History & Reports**. **Research evidence** downloads the selected vehicle/source's telemetry, CPE readings or hardware incidents. Only engineers/admins can export recorded bench evidence.

## What each status means

| Status | Meaning |
|---|---|
| Recent contact | A live, nonhistorical frame reached the backend less than 30 seconds ago. It does not prove a successful physical sensor reading. |
| Contact delayed / Offline | Latest contact is 30–89 seconds / at least 90 seconds old. |
| Sensor age | Device capture UTC age plus the sensor's reported sample age. Missing age or invalid/future UTC produces unknown, not fresh. A healthy flag without sample age remains age unknown. |
| Recent GPS fix | Reported valid fix with accumulated age at most 30 seconds. An older saved position may remain on the map; it is not a current fix. |
| SMS configuration checks complete | Saved prerequisites are present. It does not establish provider delivery, phone receipt or physical commissioning. |
| Provider accepted / Delivered | Accepted is submission acceptance; delivered requires a verified provider callback. Neither proves that a person read the text. |

Research CSV preserves IDs, source, raw payload, calibration/load labels, event and capture UTC, receipt UTC, reported sensor/GPS ages and historical-frame flags. Reporting delay is device-event-to-server-receipt time. Handling delay uses server receipt and acknowledgment/resolution times. Missing or inconsistent times stay blank. Telemetry/CPE exports are capped at 5,000 newest rows; incident exports at 200 newest incidents. HTTP export-limit headers declare these bounds, and incidents also expose a truncation header. These are bounded evidence downloads, not unlimited archives.

## Current access

| Role | Access enforced by the backend |
|---|---|
| Driver | Own settings and setup; assigned vehicles, incidents and research readings. Cannot acknowledge, write notes, resolve incidents or export engineering bench results. |
| Operator | Fleet monitoring and incident/assistance responses within their TODA; no account directory, invitations, vehicle registration, assignments, organization management or device administration. |
| Engineer | Existing authorized engineering access and incident handling in their TODA; no account administration or administrator-only SMS commissioning approval. |
| Administrator | Account/TODA administration; incident handling and device readiness in the active authorized workspace. |

Incident notes are visible to authorized viewers, including the assigned driver. Do not put private contact information in them. Existing retention redaction also clears old note text while retaining event/handling identities.

## Physical acceptance: still required

Use [OPERATIONAL_ACCEPTANCE.md](OPERATIONAL_ACCEPTANCE.md) and the [existing breadboard guide](CPE_DIRECT_BREADBOARD_QUICK_GUIDE.md); this work changes no wiring, firmware or GPIO configuration.

- Connect only the approved low-voltage bench circuit. Keep the siren disconnected until the hardware lead approves its driver and supply.
- Confirm actual sensor/switch changes in Device diagnostics. Record device ID, firmware, source, time and screenshots.
- Trigger an authorized local alarm. Match its incident to the actual serial/device event. Measure the real cutoff separately; dashboard state is insufficient.
- Lose Wi-Fi, trigger events, recover and restart. Verify unseen events appear once, old frames do not replace fresh state, and any finite-buffer losses are visible. Do not mark this passed using fixture tests.
- Export the matching readings, incident handling and bench evidence. Record failures as well as passes.
- Only after separate provider/payment approval and verified allowed recipients, perform an actual SMS test and retain independent handset evidence. See [OPERATIONAL_SETUP.md](OPERATIONAL_SETUP.md) for exact environment-variable names. No credentials belong in Git or chat.

## Implementation and rollback

Feature branch: `feature/daily-workflows-readiness`; created from the existing combined checkout without discarding its uncommitted work. No commit, push or merge was performed. A private source/database snapshot was saved before editing under `.tools/backups/daily-workflows-20261019-135725/`; it is ignored and must not be shared.

Additive migrations `011_incident_updates.sql` and `012_incident_updates_supabase.sql` add handling history and deny direct browser database access. They do not replace existing accounts, telemetry, device credentials or incident identities. The current local launcher retains SMS-disabled, loopback-only operation. The deployment destination still needs a reviewed feature-branch transfer into the group-history checkout before a later GitHub push.

Verification evidence and remaining limits are recorded in [DAILY_WORKFLOWS_VALIDATION.md](DAILY_WORKFLOWS_VALIDATION.md).
