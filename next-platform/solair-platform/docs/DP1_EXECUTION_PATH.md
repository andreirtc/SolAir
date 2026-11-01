# DP1 execution path — 20 October 2026

The existing [visual workbench](visual-workbench/SOLAIR_WORKBENCH_CARDS.html#card7), Card 7, is the group-facing sequence. Global Start here links directly to it. Preserve Antigravity styling and the original backup. This orders work; it does not approve unverified electrical interfaces or replace the [CPE final acceptance register](CPE_FINAL_ACCEPTANCE_2026-10-20.md).

## Stable system target

Two series PV panels → MPT → one protected storage battery → suitable regulated 12 V converter → reviewed CPE distribution. The same battery receives solar charge and powers the CPE. A resistor load or separate motorcycle battery cannot close that charging objective. Existing adapter remains the current bench source. No battery has been bought/approved; the user's unspecified ₱5,000 candidate needs its exact listing/data reviewed.

## Execution sequence

1. Card 1: cold-build and measure the four-resistor 100 Ω bank on the one plate. Confirm actual fasteners, compatible strip links and plate clearance.
2. Card 2: complete the protected adapter/PZEM/shunt/bank test once. Use [the complete PZEM procedure](PZEM_12V_RESISTOR_FULL_GUIDE.md); preserve working RS485 and 2.0.3. Record actual shunt rating, resistance, voltage/current/power/reference evidence. No duplicate loose-resistor test before the bank.
3. Close CPE individual measurement/electrical/security/GPS gates and the actual wireless software/commissioning work in the acceptance register. Mandatory ACS current cannot be waived or calibrated from the tiny PZEM load alone.
4. Review one circuit revision: actual supply/USB/modem/RS485/analog domains, connectors, wire ends, protection, reset-safe outputs, BOM and footprints. Drafting may start now. Permanent soldering/final CPE holes/cuts follow reviewed interfaces; full final validation precedes production PCB release.
5. Card 4: M1 controller commissioning, then M2 actual solar-to-known-load operation after voltage-limit/protection/isolator checks. The low-power M1 preset is not a charging preset.
6. Release the actual shared-battery/converter/charging/protection interface from documented specifications. Procurement review can proceed alongside stages 1–5. No guessed battery pinout/fuse/charge termination.
7. Assemble and integrate the released design. Verify regulated 12 V before connecting CPE; show actual battery charging and CPE operation without wall/USB power, including solar-input-loss behavior. PZEM at MPT output is not automatically net battery charging current when the CPE also draws power.
8. Record combined/recovery operation, recommended ≥60 minutes, actual authenticated backend persistence and once-only replay. Archive one schematic/BOM/configuration/calibration/evidence revision. Revalidate affected functions after real assembly changes.

## Parallel work and boundaries

Supported rail/box dry fit and schematic drafting can proceed alongside tests. Final enclosure drilling/harness cuts wait for footprints, glands, connectors and service/antenna clearances. Card 6 stationary/gentle-hand-spin VAWT checks may proceed; powered impact-tool drive, wind charging, roof structure and BEMAC connection remain outside verified release. Exactly five PG9 glands/no jacketed multicore remain the recorded stock.

Panel Vmp19.69 V each gives nominal series39.38 V, not an accepted loaded observation. User's25–27 V each measurements were multimeter-only Voc. Review actual worst-case Voc and boost headroom over the intended pack range. Current48 V/13S/54.6 V, honest10 Ah battery and regulated12 V/5 A converter figures are screening targets, not delivered-unit acceptance.

Secure carrier HTTPS/CA/reachable endpoint and upload-failure failover while Wi-Fi stays associated remain unfinished software/commissioning, separately from the51/51 isolated software test result. No physical PASS, purchase, firmware upload or electrical release is created by this guide update.


20October battery-sourcing clarification: user reports the ₱5,000 candidate is from an individual seller, confirmed only48V10AhwithBMS. This is user-reported label/spec information, not capacity/condition/chemistry/charge-interface validation. Exact13S/54.6V chemistry, permitted charge/discharge current, ports/polarity, new/used status/capacity evidence and correct charger remain unconfirmed. No purchase approved/performed. Do not confuse this candidate with the earlier rejected/unverified Shopee20Ah13S3P listing. The published guide's48V13S54.6V target is still a screening target, not a claim about this seller's pack.


## 21 October — seller clarifies 48 V candidate; BMS inclusion is optional, not confirmed

User reports seller describes candidate as lithium-ion, nominal48V/max54.6V, with the phrase “10C to14C.” The discussed capacity is10Ah, but this new phrase is ambiguous: no assumption that it is an established continuous current, charging rate, Ah capacity or cell arrangement. Request exactcellmodel/13Sconfiguration, explicitcapacity and allowedcontinuouscharge/discharge current inamps. Seller offers packwithoutBMS or userpurchasesownDALY13SLi-ionBMS. This SUPERSEDES earlier shorthand that BMSwasincluded: installedBMSisnowUNCONFIRMED. Purchase/deliverynotconfirmed.

Recommendation: completepackwithcorrectlymatchedBMSinstalledandtestedbybatterybuilderbeforeanycharging/discharge; donotomitBMS forcostsaving or treatMPT/fuse/appasitsreplacement. DALYbrand+13SLi-ioniscompatibleinprinciplewith13groupsat4.2V=54.6V, butexactmodel/chemistry/protection/balancing/temperaturefeature/chargeanddischargeratings/portconfiguration/harnessandinstallationmustmatchactualpack. No specificDALYcurrentvariant orwiring released. No need tochoose100A/140ABMS fromunverified“10C–14C”marketing; modelselectionmustmatchcell/packwiringandintendedsystem. Askbuildertoinstallandverify groupvoltages/balanceandprotectedports.

Charger: targetdocumented13SLi-ion54.6VCC/CVwithtermination,2AonlyifpackandBMSpermitchargingat2A. Correctearlier“atleast2A”wording: itisnotpermissionforanyhighercurrentcharger. Wallchargerisforseparatepreparation, notsolarenergyevidence; itdoesnotreplaceBMS. MPTchargebehavior/PVvoltageenvelope/shared12Vconverter/windcontrollerinterface remainunverified. No livechargingprocedure orfinishedsystemclaim.

Primaryreference: https://www.dalybms.com/uploads/Old-series-hardware-BMS-manual.pdf (officialmanual; indexedcontentidentifiesdifferentcommon/separateportsandmodel-specificharnesssequence; directwebfetchsizefailure); https://www.dalybms.com/technical-support-2/ . This is a seller-specification update and procurement recommendation, not hardwarePASS/approvedpackorBMSinstallation.


### 21 October — user clarifies seller's C-rating

User confirms from the call that “10C to14C” means C-rating. At the discussed10Ah capacity, arithmetic gives100–140A; this is a seller claim, not verified pack capability. Continuous versus pulse/peak discharge, duration, exactcellmodel/parallelconfiguration, assembly/wire/connector ratings and permittedchargingcurrent are still unspecified. Do not infer100–140Acharging, choose a hugeBMS fromC-ratingalone or approve high-currenttesting. Installedmatched13SLi-ionBMS/balancing/protection, supported2Acharger and MPT/PVinterface review remain required; no newpurchase, wiring orhardwarePASS.


### 21 October — seller states 4P discharge arithmetic and asks setup-based BMS rating

User quotes seller: fourcellsparallel×25A=100Acontinuous, four×35A=140Apeakwithtemperaturecutoff. Preserve as SELLERCLAIM, not measuredcompletepackrating. This clarifies previouscontinuous/peakambiguity. Exactcellmodel/capacity/13Sassembly/busbars/wires/connectors/temperaturecutoffimplementation and actual permittedchargingcurrent remainunverified. Seller says DALYcurrentratingbasedonsetup; agreeinprinciple but match BOTHcharge/discharge needs, actualpacklimits and protection, not choose100–140Aonlyfromcellclaims. No specificDALYvariant released yet. If13S4P10Ahconfirmed, nominalcellcapacitywouldbe2.5Ah; exactmodelstillneeded.

User purchasingcheck: BMS, charger, stepdownconverter arethreeprincipaladditionalpartsbesidesbattery. Preferredbuilder-installed/tested13SLi-ionBMSwithbalancingandtemperatureprotection; documented54.6VCC/CV2Achargeronlyifpack/BMSallow2A; additionalbattery→regulated12Vconverter≥5Acontinuous/60Wscreeningtargetwithactualinputenvelopeandpeakbudgetreview. ExistingHCW-P715staysdownstream12V→5V, notraw48V. Completehardwarealsoincludesproperbattery-sideDCfuse/holder, rateddisconnect/matingconnectors and correctlyterminatedwires/insulation/mounting; notautomaticallyowned. Existing12Vbench2Afuse/holdernotautomaticallysuitable54.6V. BasicDALYdoesnotrequireBluetooth/applinkforCPEtelemetry; BMSappintegrationnotassumed. No purchase, wiringrelease orphysicalPASS.


### 21 October — user intends to purchase and install BMS themselves

User explicitly declines seller-installedBMS: seller willassemblebatteryonly; groupwillbuyDALYonlineandfitit. Preserve this intendedownership; do notclaimsellerinstallationagreed or useralreadycompetent/installationeasy. Explain13Sinstallationrequirescorrectindividualcellgroupbalance/senseconnections and protectedmainports, notmerelytwoexternalbatterywires. Wrongtaporder/polarity/harness/modelcanruinBMSorcreateashort. ObtainexactDALYmodel/manualBEFOREsellerclosespack; requestlabelled13Sgroup/tapmap, actualcellmodel/parallelconfiguration, individualgroupvoltage/balanceandQC, matchingmodel-specificpreparedharness, polarity/portdiagram andaccessibleproperlyinsulatedmountingprovision. Genericbalanceplugs/coloursnotuniversal; do notconnectBMSplugbyshapeorcolour. Keepunprotectedpackunused/unchargeduntilcorrectinstallationandchecks; recommendqualifiedbatterytechnicianreview/firstcommissioning. ActualMPTcharger/powerinterface review unchanged. No BMSinstallationinstruction/currentvariant/pinout orhardwarePASS released.
