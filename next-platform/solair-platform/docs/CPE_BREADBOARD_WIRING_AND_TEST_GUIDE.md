# SOLAIR full CPE breadboard wiring and test guide

11 October 2026. One authoritative premium application: `next-platform/solair-platform`. Follow [firmware commands](../firmware/README.md) and [acceptance sequence](COMPLETE_CPE_BENCH_AND_APP_ACCEPTANCE.md). This is a future physical procedure, not a test report.

Current scope: **home12 V adapter bench only; BEMAC traction battery, panels and MPPT are disconnected**. See the [latest hardware clarification](CPE_HARDWARE_CLARIFICATION_2026-10-11.md). The group measured GPIO27 OFF approximately0 V and ON3.0–3.3 V; preserve active-HIGH. Reset/power-up safe-OFF remains pending. The team's new directive reports working ESP32, MPU, switches, LED, HW-548, active 12 V siren, buck and a 2 A fused supply. These are **team-reported**, without new captures/measurements in this workspace. Do not dismantle proven wiring merely to match a proposed pin map: photograph it first and reconcile `firmware/solair-cpe/pins.h`. All pin numbers below are GPIO labels printed beside the actual ESP32 headers, not pin positions counted from USB. USB connector orientation alone cannot identify a GPIO.

## 1. Inventory and unpowered inspection

Check off: classic ESP32-WROOM-32D 38-pin USB-C CP2102 and data USB cable; GY-521; two KW11-3Z; LED + 330 Ω; exact HW-548/F5305S board; active siren; 12 V/5 A supply; HCW-P715 buck; existing inline 2 A fuse/holder; ADS1115; HW-525 ACS758LCB-050B; NEO-6M GY-GPS6MV2/antenna; A7670E carrier/antenna/SIM/correct supply; PZEM-017 with correct 50 A shunt; USB-RS485; 3.3 V MAX3485; breadboard/jumpers; multimeter; rated fused power conductors/connectors and suitably rated resistor load. An ordered part is not a connected sensor.

Photograph both sides of every breakout, header names, ESP board marking, HW-548 six terminals, fuse holder, buck IN/OUT, modem connector/carrier labels, MAX3485 labels, PZEM revision/terminal diagram and shunt marking. Record meter model/range, supply voltage/polarity, continuity and actual ON/OFF logic. Identify breadboard rail breaks with continuity. No power until every intended rail is labeled. Need hardware-lead approval for any unknown connector or isolation boundary; never guess a pin from wire color.

## 2. Signal breadboard (conditional map)

```text
USB selected power → ESP32          separate GPIO19 → 330 Ω → LED anode
ESP GND → approved signal GND bus                      LED cathode → GND
ESP 3V3 → MPU/ADS approved 3.3 V supply
21 SDA ─┬─ MPU SDA       22 SCL ─┬─ MPU SCL
        └─ ADS SDA              └─ ADS SCL
25 → lid NO     lid COM → GND       (NC unused)
26 → mount NO   mount COM → GND     (NC unused)
34 ← verified conditioned ACS output; ACS power separately approved
32 ← verified GPS TX (software UART RX only; GPS RX unused)
16 ← MAX3485 RO; 17 → DI; 23 → DE + active-low RE
13 ← modem TX through verified translator; 14 → modem RX via translator
27 → HW-548 signal side only AFTER measured interface/polarity review
```

UART0 stays CP2102 USB console. UART1 is MAX3485/PZEM. UART2 is modem. GPS uses EspSoftwareSerial8.2.0 RX-only9600 on32. GPIOs do not create extra hardware UARTs. This allocation is implemented and must pass the combined soak before vehicle use. If GPS checksum failures/overflows grow under traffic, stop accepting the arrangement as ready; a reviewed I2C dual-UART bridge (e.g. SC16IS752 at a nonconflicting address, board-level 3.3 V compatibility) is an alternative requiring new hardware/driver validation. No unverified price or purchase is assumed.

## 3. Every module connection and gate

| Module terminal | Supply/ground and destination | Signal / test |
|---|---|---|
| ESP USB / 5V / 3V3 / GND | USB alone for initial tests; use external5V only after board power-input/backfeed review; never12V | GPIO uses3.3V only; no siren current through board |
| MPU VCC/GND | Verified GY-521 at3.3V, GND signal bus | Check onboard regulator/pull-ups; no5V I2C |
| MPU SDA/SCL/AD0 | SDA21, SCL22, AD0 GND for0x68 | INT unused; alternate0x69 requires measured AD0 and `MPU_ADDRESS` change |
| ADS VDD/GND | 3.3V/GND | ADDR GND→0x48; ALRT unused |
| ADS SDA/SCL |21/22 shared | All pull-ups to3.3V; check aggregate loading |
| ADS A0–A3 | A0→GND or measured3.3V for stage05; unused inputs grounded for a stable test or explicitly recorded as floating | Input remains within0…VDD; gain ±4.096V does not permit exceedingVDD |
| Lid COM/NO/NC | COM→GND, NO→25, NC unused | INPUT_PULLUP; pressed LOW secure provisional mounting |
| Mount COM/NO/NC | COM→GND, NO→26, NC unused | Same, independent contact |
| Status LED |19→330Ω→anode, cathode→GND | Separate from27 in final wiring |
| HW-548 Signal+/− | Proposed Signal+→27, Signal−→ESP GND **only after confirmed board interface** | Active level/current/isolation unknown from labels alone; see branch below |
| HW-548 DC+/DC− | Protected12V positive/negative under approved diagram | Never a breadboard rail |
| HW-548 OUT+/OUT− | Approved siren +/− connections after protected-load test | No ESP GPIO power connection |
| ACS VCC/GND | Verified HW-525 board supply, possibly5V; signal GND only as approved | IC ratings do not establish breakout ratings |
| ACS VOUT | Through measured divider/buffer/protection→34 ADC1 | GPIO34 input-only; verify whole range≤3.3V, not just zero current |
| ACS current terminals | Low-current fused isolated source/load in series through verified IP+/IP− current conductor | Never route load current through VOUT/GND/signal breadboard; no traction current now |
| GPS VCC/GND/TX/RX | Verified breakout VCC supply/GND; TX→32 only if logic3.3V compatible; RX unused |9600 RX-only; antenna outdoors; no invented coordinates |
| A7670E USB | Carrier documented input/USB AT port and adequate dedicated supply | First USB-only, ESP disconnected |
| A7670E UART | Confirm actual connector RX/TX/GND and translator; modemTX→13, modemRX←14 via proper levels | Bare modem UART may1.8V; do not directly jumper unknown white connector |
| MAX3485 VCC/GND | Verified3.3V module/GND per isolation review | Not a5V MAX485 substitute |
| MAX3485 RO/DI/DE/RE |RO→16, DI←17, DE and active-lowRE←23 |LOW receive idle; HIGH transmit;9600 8N2 defaults |
| MAX3485 A/B |A/B to matching manufacturer PZEM RS485 terminals |Twisted signal pair; A/B labels may differ; verify without moving power |
| PZEM serial supply +5V/GND |External regulated5V to documented serial-side power terminals |Do not power from ESP GPIO; establish isolation/reference from actual revision |
| PZEM voltage sense / shunt sense |Exact manufacturer diagram for actual revision and 50A shunt required |Not the RS485 supply; use Kelvin sense terminals, not guessed numbered terminals |
| Wind |No controller connection yet |Firmware/UI unavailable; raw3-phase turbine wires stay disconnected |

Signal jumpers carry only low-current logic. Keep I2C/UART leads short, route away from siren/RS485 power, and use twisted A/B for RS485. Select actual power cable gauge from measured steady/inrush current, length, insulation/connector ratings and fuse coordination; no universal wire gauge is approved without those inputs. Breadboard contacts are never the siren/shunt/load current path.

## 4. Separate 12 V distribution

```text
12V/5A adapter + ── power distribution ── existing inline2A fuse ── HW DC+
                   └─ separately protected buck IN+
12V adapter − ───────────────────────── HW DC− / buck IN− per reviewed map
HW OUT+ / OUT− ── active12V siren according to exact module diagram
buck OUT+ / OUT− ── measured regulated5V / return → approved5V loads

ESP signal27/GND ── HW Signal+/Signal− per measured interface ONLY
```

The 2 A siren branch is the team's reported working arrangement, not a fresh calculated approval. Inspect holder contacts, fuse type and cable ratings; measure steady/inrush current and confirm protection with the hardware lead before repeating. Keep the fuse near the source. Adapter5A is capacity, not the expected load current or a fuse selection rule. Do not bypass the fuse to cure nuisance trips.

Set/measure the buck output while it is disconnected from ESP/modem. A carrier may need a supply other than5V; use its actual manual. Do not power a modem from ESP3V3/GPIO. Peak modem demand must not collapse the ESP rail.

**Power selection:** start USB-only. Before using buck5V, unplug USB power and all external power, verify the board's5V input and backfeed topology, then choose one source. For simultaneous USB data with external5V, use a verified data-only USB cable/power isolator designed for this purpose and establish the intended signal reference. Merely assuming the DevKit has power ORing is not approval. Do not attach USB and buck5V in parallel without that review.

**HW-548 gate:** photograph terminal labels and preserve the tested map; independently measure LOW/HIGH switching at actual3.3V and input current. With siren disconnected, use a suitable rated meter/test load to verify OFF on reset, boot, GPIO unplugged and USB loss. Determine any required bias/interface so floating GPIO cannot sound the siren. Set `ALARM_ACTIVE_HIGH` to that measured result, then `ALARM_POLARITY_VERIFIED` and `ENABLE_ALARM`. Default firmware flags are not a substitute for reset-safe electronics. Do not automatically bond Signal− to DC− where isolation is intended. Record actual isolation/ground arrangement and suppression appropriate to this exact active siren. Offline behavior is deliberate: an armed physical trigger may sound locally without Wi-Fi; loss of Wi-Fi alone must not activate the siren.

## 5. Inputs, analog and position tests

For MPU/ADS, run01/05 with no12V load. Scanner must find0x68/0x48. If absent: remove power, check VCC/GND, continuity and pull-ups; isolate one module at a time. If0x69 is found, confirm AD0 before changing config. Do not change address blindly or tie5V to the bus. Observe real MPU raw/scaled values and stationary gravity; thresholds require mounted measurements, not a theft-classifier claim.

For each KW11, use an unpowered continuity meter to identify COM/NO. Pressed COM–NO closes→GPIO LOW; released→HIGH. Hold both secure before ARM; final mounting must make that convention meaningful. Debounce50ms. Cut/broken wire is indistinguishable from an open contact in this circuit. Test each separately, capture raw/debounced states, and never label a breadboard lever position as final enclosure validation.

ADS05: A0→GND should read near0V; then remove power, reconnect A0 to measured3.3V and repeat. A0 supply rail must never exceed VDD. Capture raw counts, conversion and multimeter reference; other channels need an explicit wiring description. No60V connection/divider is supplied by this test.

ACS06: verify exact board supply and Vout with a meter **before** connecting GPIO34. At zero current record conditioned pin voltage and sensor-side Vout; set `ACS_FRONTEND_SCALE`, `ACS_ZERO_V` and measured sensitivity. The [Allegro IC datasheet](https://www.allegromicro.com/-/media/files/datasheets/acs758-datasheet.pdf) gives device characteristics, not complete HW-525 breakout approval. Use a low-current independently measured fused load and fit `(Vout-zero)/sensitivity`, with correct direction. Only then set `ACS_CALIBRATED`; uncalibrated telemetry keeps amperes null. Overflow/near-rail values are faults, not zero. Do not insert a handheld meter's current input across a supply.

GPS07: verified supply, TX level to32, GPSRX unused. Observe raw NMEA, checksums, genuine UTC/satellites/HDOP and a fresh valid outdoor fix. Indoors may have bytes without fix. Disconnect and confirm unavailable/stale behavior. The driver/operator map displays genuine last-known positions; a retained stale location must not be presented as a fresh fix.

## 6. LTE and PZEM

LTE08a: use only the carrier's documented USB supply/AT interface initially. Identify its actual port; run the allowlisted USB script from its README. `AT`, model, CPIN, CSQ, CEREG, CGATT and COPS are diagnostics. Never paste SIM PIN, IMSI, IMEI, Wi-Fi/APN credentials or device token into a report. A response to AT is not registration/packet transport. If carrier UART supply, connector pinout or logic translation is missing,08b stays gated; supply the exact model/photo/manual and measure levels first. Then wire verified translator to13/14 and test registration independently from cellular POST. The [SIMCom product resources](https://en.simcom.com/product/A7670X.html) identify official A76XX documentation; they do not identify the user's carrier connector.

PZEM09a: exact revision diagram/shunt markings must come from the team's module or [manufacturer product documentation](https://en.peacefair.cn/product/786.html). The code implements read-only function04/register0…7,9600 8N2, address1 by default; compare with the actual manual. ESP firmware never writes settings; it checks holding register0x0003=0x0001 (50A) before accepting readings and rechecks every30 seconds. The laptop script checks before each poll. Its separate explicit --set-50a command is gated on delivered revision/manual and matched shunt verification; see stage09a README. No energy reset/factory calibration is implemented. Mismatched range invalidates current/power.

Before connecting any load, obtain the **manufacturer's terminal-to-terminal** map for voltage sense, shunt sense, serial5V and return. Then connect a low-power, isolated, fused DC source→rated resistor load→shunt current path→source return as that map specifies; sense leads go only to the matching Kelvin/shunt sense terminals. Do not guess between low-side/high-side wiring or numbered screw terminals. The high-current shunt bolts are distinct from sense terminals. No load current goes through a breadboard, RS485 board, USB adapter or small signal terminal unless the exact manufacturer diagram explicitly calls for it. External regulated5V powers the documented communication side.

USB-RS485 A/B goes to documented PZEM A/B. Establish galvanic isolation of the actual adapter/meter/supply before connecting the laptop; nonisolated modules must not bridge a hazardous floating system to USB ground. First laptop-only09a with safe resistor bench, then disconnect USB-RS485 before09b MAX3485. Termination/biasing must suit the short bus and modules; do not arbitrarily double-terminate. Confirm MAX3485 logic3.3V, direction23 and idle receive, then compare both paths' real V/A/W/Wh with instruments.

**No traction/PV power hookup is authorized by this guide.** Two200W panels in series, TOMZN breaker, MPT-7210A, CNLONQ isolator and AndersonSB50 require a separately reviewed charging diagram, ratings, isolation and BMS interface. The reported ~39.4V PV Vmp is not a maximum open-circuit design voltage. BEMAC55.2V nominal is not a safe test source. PZEM voltage alarms and a fuse do not provide cell-level BMS protection; direct bus-bar bypass remains unapproved. Wind3-phase output remains disconnected until controller/interface approval.

## 7. Power-on, upload and app order

1. Power off, photograph/continuity-check the stage circuit, disconnect unrelated powered branches and close serial monitors.
2. USB-only upload of the stage target using [firmware README](../firmware/README.md); no default COM port. Flashing replaces the ESP program. Observe startup OFF before attaching any approved output load.
3. For powered stages, power off again; attach the reviewed protected branch, select one ESP power source, verify signal references, then energize the approved supplies. First observe that the load stays OFF.
4. Start centralized app with actual private IPv4 device-only ingress, sign in as engineer, Real hardware mode, provision the exact device privately, configure/recompile/upload test10 or final firmware as needed. Browser is loopback3000; ESP posts to actualPC-IP:3002/api/ingest.
5. Match genuine sequence/boot/time and accepted payload in CPE Lab; inspect driver/operator same vehicle, history, security alerts and CPE CSV. Browser SSE connectivity alone is not device connectivity. Save evidence; disarm and remove power before any rewiring.

## 8. Troubleshooting

| Symptom | Check / stop condition |
|---|---|
| I2C not found | Power off; correct3.3V rail, shared ground, SDA/SCL, AD0/ADDR, pull-ups; isolate modules |
| Switch inverted | Continuity COM/NO/NC and actual secure mechanics; preserve LOW secure logic unless reviewed change |
| Siren sounds on boot/reset | Remove load power immediately; wrong polarity/floating interface; physical stage BLOCKED |
| GPS invalid | Antenna/outdoor sky, actual9600 stream/checksums, TX levels; bytes≠fix |
| GPS overflow under traffic | Record counters; shorten leads/reduce noise; concurrency not passed; consider reviewed UART bridge |
| AT no response | Exact USB AT port/baud; carrier powered on correctly; UART translator/connector; no guessed PWRKEY |
| Modem resets | Measure peak supply droop and wiring; independent appropriate supply; stop if heating/overvoltage |
| PZEM timeout/CRC | Address/9600 8N2, serial5V, A/B, direction23, isolation/reference; do not swap power terminals |
| Analog overflow | Disconnect signal, verify voltage/conditioning/gain; no null-to-zero conversion |
| HTTP401 | Exact device ID/token; credential rotation; do not share token while troubleshooting |
| Connection refused | PC actual IP, device-only listener3002, private firewall scope, same reachable network |
| HTTP400/409 | Contract validation/conflicting identity; preserve queue/evidence; do not treat409 as acknowledgement |
| Dashboard stale | Device last receipt vs browser SSE, source mode, queue/network; retain last values as outdated |

Every stage saves `stage-ID-date-serial.txt`, wiring photo, meter readings with units/reference, result and tester. For alarm add video/current/reset behavior; for integrated tests add real CSV and matching boot/sequence/event identity. Illustrative serial examples in stage READMEs are formats, never measurements performed by Codex.

