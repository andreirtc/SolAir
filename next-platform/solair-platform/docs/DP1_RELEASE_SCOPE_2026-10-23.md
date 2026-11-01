# One SOLAIR design for DP1 and the prototype presentation

23 October2026. This clarifies release scope without declaring unobserved success.
Use the existing authoritative app and candidate2.0.18; last actual upload2.0.17.
Historical DP1 text saying no battery was bought is superseded: the user reports
buying/shipping a13S48V Li-ion pack. Its completed installation/commissioning is
not established merely by purchase.

| Keep this architecture | Required demonstration |
| --- | --- |
| Two PV panels → TOMZN → MPT → LONQ and solar-only PZEM/shunt → protected shared battery | Actual solar charging, meaningful voltage/current/power/energy evidence and correct charge settings |
| Protected battery → ACS primary net-current path → distribution; suitable battery-to12V converter → existing CPE/HCW5V supply | CPE operates from battery without the12Vwall adapter/USB supplying power; solar-loss operation and proper protection |
| Existing ACS supply/divider/ADS A1 | Stable input/zero and independently referenced useful-range current; raw voltage alone is not valid amperes |
| NEO6M → ESP32 → LTE HTTPS → existing SOLAIR backend and live map | Actual new authenticated LTE receipts, fresh outdoor location/movement, last-known/stale behavior and reconnection |
| Existing IMU, lid/mount, LED and bounded siren | Previously accepted basics retained; mounted/combined behavior demonstrated |
| One matching schematic/BOM/header assembly package | Actual power/logic/USB/isolation, primary/branch terminations and reset-safe outputs resolved before assembly release |

The recommended combined rehearsal is60minutes after measurement/power readiness,
with server timestamps and restart/network recovery retained as evidence. It is
not a promise of a finish time or a substitute for current accuracy. A reachable
laptop tunnel supports a supervised demonstration only while its host/network
stays running; permanent hosting is required for independent continuous operation.
No hosted deployment is currently configured here.

The wind interface remains an unavailable channel until its compatible safe
controller/charging interface is established. It may be described as planned or
shown at its actual verified scope; it is not silently counted as live charging.
No vehicle traction-bus/roof installation is inferred from a bench demonstration.

## Charger decision

Known builder permission:5A, not8A. New listing:54.6V8A13S Li-ion,T-plug; its exact
manufacturer/termination/rating are not supplied. Use a proper54.6V13S Li-ion
CC/CV charger with a current allowed by this exact pack. For the8A candidate,
obtain pack-builder approval for8A cells/BMS/charge harness, or select a documented
≤5A variant/current limit supplied by the charger manufacturer/seller. Do not
assume a10A BMS forces the charger down to5A or that a fuse regulates current.

The T-plug is a charger-branch connector choice, not a CPE redesign. Use a mating
lead/connector rated for full54.6V and chosen current with actual polarity and
source/branch protection. Do not presume a generic barrel adapter is suitable or
choose plug gender/contact polarity by guess. Existing selected12AWG distribution
and two genuine WAGO221-415 remain the latest plan; old10AWG CSV entries are
historical and do not override that conductor/connector decision. Final charger
pigtail end fitting and protection must match the actual item; no invented fuse
value or socket rating is released here.

Use wall charging for precharge separately, then disconnect it for the first solar
charging demonstration. Do not add wall/solar charging currents past the permitted
pack/BMS total. No battery energizing or new charging test is ordered by this file.
