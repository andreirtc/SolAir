# Exact modem listing review — 22 October 2026

User's actual purchase listing: https://shopee.ph/-Pretty-SIMCOM-A7670E-Module-Core-Board-4G-LTE-Cat1-TTL-UART-Compatible-2G-LTE-FDD-with-GSM-900-1800MHz-Includes-SIM-Card-Slot-i.299346404.41204351101

Fetched the accessible listing and all eight linked images. Image1 is a payment overlay; images2–8 are product photographs, not electrical specification diagrams. Private local reference copies remain in ignored `data/bench-evidence/modem-listing-41204351101/`; do not republish seller images or claim they are photographs of the group's actual wiring.

Image8 (seller original https://down-ph.img.susercontent.com/file/sg-11134201-7rasp-maxlnwopiiyeb2) explicitly marks **CAT1-A7670X-V1.01,2021.12** on the board back. Prior user identification was CAT A7670X V1.02. Images show the matching general compact green layout, microUSB, inductor/electrolytic, multi-pin white socket and VCC/GND/RXD/TXD/CTS/VDD/PWR-EN/GND-labelled header. Image3 has a different can marking/part revision fromimage6; neither establishes the group's silicon/board revision. Treat the user's actual part as authoritative; do not silently rewrite their BOM toV1.01 or assign an unknown connector pinout.

Accessible listing text contains the title/price/shop/gallery but no actual power-input, peak-current, VDD direction or UART-level specification. Ordinary unauthenticated item API attempt returnedHTTP403; no bypass/retry with forged tokens/login was performed. The description cannot be verified from this access. No matching manufacturer carrier schematic was located. SimilarVDD/VCC listings and AI-generated Manuals+ product summaries are not accepted substitutes, and bareSIMComVBAT ratings are not carrierVCC ratings.

Consequently this exact link establishes a useful carrier-family photo match, **not verified5V/5–16V/12Vcarrier approval, a VDDinput guarantee or electrical schematic release**. Keep the measured5V converter disconnected until its interface is resolved. Next document needed is the PowerSupply/PinDefinition text or image from this actual product description, or the matching board supplier schematic. No repeated whole-kit/pin-inventory request is needed.

During review, actual2.0.12LTE persisted51records on bootc0d2bdc14a097add1b2779f4 from02:35:40.909 to02:48:32.772 (seq14→399). Importantly gaps208.453s,326.625s,84.900s occurred; there were0USBforwardedrecords on that boot. Do not call this an uninterruptedhealthy13minuteLTEstream. Queue_dropped0 does not prove lossless telemetry. ACS1059.438–1203.500mV in the same receipts is not a controlledzero-input accuracy capture. Evidence `data/bench-evidence/2026-10-22-lte-2012-sustained-run.json` records the limits. Firmware2.0.13 remainsprepared/onhold; actualrecovery does not excuse the longgaps or uncertainpowerpath.

Useful software observation next, with no powerchange/upload: re-enableUSBserverforwarding while leavingLTEstreaming and current firmware/wiring unchanged for3minutes. This exposes the error/wait states between LTE successes for read-only diagnosis; do not label USBforwardedrowsLTE. Report captureend time. This observation can run alongside retrieving the missing listing specification and finishing the separateunpoweredbank.

## User follow-up before shutdown

User confirms sellerdescriptioncontainsnoneofthemissingelectricalspecifications. Do not request the same description/link again. No actualcarrierinput/translatorrating has thereby beenverified. Userstopsfornight; source/wiringpreserved, candidate2.0.13notuploaded, newphysicalworkawaitsresume.
