# A7670 V1.00 manual review — 22 October 2026

## Source located and verified

Actual user-local file: `/home/ralphandreicastillo326/A7670 Series Hardware Design_V1.00.pdf`.

SIMCom document: **A7670 Series Hardware Design, V1.00, released 2020-06-09**, 61 pages. The local file's SHA256 is `ae43b803731f9de6a7b543cdccaa57555f9102a65a765a08c1c9ac57c8e0090a`.

An independently retrieved public mirror is byte-identical: https://nostris.ee/pdf/A7670%20Series%20Hardware%20Design_V1.00.pdf . It is the SIMCom-authored module manual, not the CAT1-A7670X carrier schematic. Local text extraction and full-page visual inspection covered pages16,22–24,29, with further text checks of11–12,15,17,28,38,43. Page numbers below are the document's printed page numbers, also matching this PDF's page positions.

## What this manual establishes

| Item | Exact scope and reference | Effect on SOLAIR |
|---|---|---|
| Module supply | Table2 p11, Table6 p16 and Table7 p22: **VBAT3.4–4.2V, typical3.8V**, module pads55/56/57 | Applies at the metal module's VBAT pads. Does not specify the green carrier's VCC input. Do not turn the existing5V buck down to3.8V or connect5V directly to VBAT on this basis |
| Transmit supply demand | Section3.1/Figure6/Table7 p22: **2.8A peak at VBAT** in the stated maximum-power GSM transmit case, with a less-than300mV droop design target | Use this revision-specific case in power budgeting. It is not a measured current of this board, a constant LTE current, a carrier-input rating or permission to choose a larger fuse. Other document revisions'2A statements must not silently replace this2.8A value |
| Decoupling | Section3.1.1/Figure7 p23 discusses supply impedance and local energy storage; p24 Figures8/9 show regulator reference circuits | Illustrates a regulator between external DC and VBAT. Does not establish which regulator/protection is installed on this carrier or authorize copying its capacitor values into an unknown node |
| Native UART | Table6 p17 and Table32 p43 describe the module's **1.8V** digital interface. Figure15 p29 shows level conversion to the MCU I/O rail | The ESP32's3.3V UART must reach the module through a verified compatible carrier interface. Working AT/data alone does not certify the carrier translator or permit direct3.3V wiring to bare module pads |
| Module auxiliary rail | Table6 p16 and Table21 p38: module pad15 **VDD_1V8 is an output**, up to50mA | Do not equate the carrier header namedVDD with bare moduleVDD_1V8. The header may have a different role; its connection must be traced/verified before a schematic claim or new wiring |
| UART transport | Figure14/p29 shows two-wire crossedRX/TX with RTS/CTS unused. Notes give default115200 and describe RTS/CTS as not supported in the referenced version | No reason from this document to change the existing GPIO13RX/GPIO14TX/115200/no-flow-control configuration. Do not infer that a2020 note identifies the current modem firmware's every feature |
| USB | p17 identifiesVBUS as USB detection; the general feature table says USB device, not host | A5V USB detection/input specification is not a5V VBAT rating or proof of the carrier's microUSB/VCC power selection/backfeed behavior |

The absolute-maximum VBAT value on p43 is not the recommended operating range. Likewise, the group's4.3–4.7V handheld measurement was at **carrierVCC**, not confirmed at the bare moduleVBAT pads. Comparing those numbers directly to the VBAT table cannot establish an overvoltage or undervoltage diagnosis.

## Remaining board-specific identification

The actual board is user-reportedCAT A7670X V1.02; the exact seller's back photograph is CAT1-A7670X-V1.01/2021.12. The seller description is confirmed by the user to lack electrical specifications. Do not ask for that same description/link again and do not silently substitute a similar carrier.

Next bounded physical observation: with **all modem/CPE supplies disconnected**, identify the letters/numbers on the small black regulator IC beside the carrier's gray coil and large capacitor. A close-up of that particular region can substitute if the print is hard to read; do not request another whole-kit photo or pin inventory. The regulator's actual marking, its manufacturer's data sheet and relevant carrier connections can guide an actual power-path review. A chip marking alone still does not prove resistor settings, USB isolation, current capacity or VDD direction.

Until that interface is identified, leave the HCW-P715 output disconnected. Its user-measured5.0V is unloaded voltage only. Keep firmware2.0.12;2.0.13 remains a prepared diagnostic candidate, not an uploaded or physically accepted fix. No new physical PASS follows from finding this manual.

## Runtime restored during this review

The existing local app and restricted LTE ingress were stopped after shutdown. Restarted through Orca usingNode24.22.0:

- App3000: `term_75b03c32-57bc-47cc-859d-791f2c762c50`; `/` and `/api/health` return200.
- Device-only ingress3003: `term_74e17801-62fe-495b-a25a-b145371a812d`; unauthenticatedPOST`/api/ingest` returns401 as expected, with no device data inserted.
- Saved tunnel resume attempted in `term_c86e146c-c2c0-4be0-ba59-b053ad6c298c`. Cloudflare repeatedly returns **Unauthorized: Tunnel not found**. Closed only this newly created failed-retry terminal. Local credential persistence does not guarantee provider-side quick-tunnel retention.

The old public LTE address is currently unavailable. Do not direct a device LTE acceptance test to that expired address or attribute its failure to SIM credit/UART/physical modem power. No new hostname/configuration/credential rotation or firmware upload was performed. A stable reachable deployment endpoint or an explicitly managed replacement must be resolved before judging new Internet LTE delivery; avoid another blind sequence of URL reuploads. USB/backend measurements can proceed locally in parallel.

At this review the latest stored device receipt remained22October02:50:31.483Manila,2.0.12bootd7ae0fd890b4d19ccddca577seq6,transportUSB. No fresh post-shutdown bench data was observed. Preserve the earlier recorded passes and limitations.

## Sequencing correction after user review

The regulator-marking request is withdrawn as the next mandatory functional bench step. Earlier actual2.0.12LTEdelivery stands. Carrier documentation remains needed before supply/interface changes and final schematic release, but it must not restart passed modem bring-up. Preserve current wiring, keep the unusedconverter disconnected, and repair the expired backend address independently.
