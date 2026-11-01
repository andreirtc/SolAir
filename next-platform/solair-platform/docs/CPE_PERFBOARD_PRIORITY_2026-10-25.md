# CPE handoff priority —25 October12:21

Stop the repeated ACS/breadboard measurement loop at the user’s request. Preserve evidence; unknown current stays invalid. This changes work order, not final acceptance.

## Operator and teammates now

1. Finalize the same CPE circuit using clean sheetsF–H, with every actual module pin and externalwire endpoint shown. RepeatedU1 means oneESP32. Correct labels: GND/+3.3V/+5V_RAW/+5V/12V_RETURN; retain distinct existing return domains.
2. Match the12×18cm isolatedpad physicallayout to actualparts. ESP32 two20pin socketstrips use19positions andleaveoneempty at thesameend; actualfit must bechecked without bendingpins. ADS12pin strip uses10positions; actualIMU/carrier/headerpinorders govern. KeepIMU on mainboard withfixedoppositeedgesupport.
3. Show short solidsharedlogicground and labelledACSOU1, dividerA1 andGND access. Preserve existingtwo10kresistors,104midpoint→GND and470µF25V(+5V/GNDcorrectpolarity). Keep components accessible/removable for necessarycorrections; do notguesscalibration or addfilters.
4. KeepACSprimaryIP+/IP−, shuntprimary, sirenpower andbatterycurrent offperfboard signaltracks. Show exactexternalpowerandcontrolentries.
5. Ownerreview before assemblyrelease: actualsupplies/logic/USBsource selection/reference/isolation/branchprotection andreset-safeoutputs, connectororientations andmatchesbetweencircuit/placement. CorrectGPIOassignmentsalonearenotthisreview. Do notclaimcurrentdraftreleaseorcompletedreview.
6. Afterconstruction: sourcesoffinspection/continuity/polarity; verifyrailsbeforepopulatingmodules; repeatcombinedfunctions. Record newboardacceptance separatelyfrombreadboardresults. CompleteACSstablezero/reference/rangevalidation alongsidePZEM onactualassembly; solderingisnotaguaranteedfix.

No further identical breadboard measurements or newmeter/filterpurchases are ordered. Keepcurrentinvaliduntilqualified. Sharedbattery/autonomousuptime and installedswitch/motiontests follow their ownreleaseconditions.
