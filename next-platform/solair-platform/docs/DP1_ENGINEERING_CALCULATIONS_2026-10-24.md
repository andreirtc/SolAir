# SOLAIR DP1 — corrected theoretical energy budget · 29 October 2026

**Supersedes the former 10 W battery-side / 240 Wh/day case.** The user clarified that 10 W comes from 5 V × 2 A. It is a load budget, not a measured result.

## Electronics and two converter stages

Battery → large buck → 12 V → HCW → 5 V electronics. Choose 85% for each converter as an explicit unmeasured assumption.

| Stage | Calculation | Result |
| --- | --- | --- |
| 5 V load budget | 5 V × 2 A | 10.00 W at the 5 V rail |
| HCW input | 10 ÷ 0.85 | 11.76 W from the 12 V rail |
| Large-buck input for5 V branch only | 10 ÷ (0.85 × 0.85) | 13.84 W from either battery |
| 5 V-branch24-hour subtotal | [10 ÷ (0.85 × 0.85)] × 24 | 332.18 Wh/day |
| Current at reported 54.7 V | [10 ÷ (0.85 × 0.85)] ÷ 54.7 | 0.253 A · calculated, not measured |
| Prototype nominal capacity | 48 V × 10 Ah | 480 Wh; use nominal voltage for capacity |
| BEMAC nominal capacity | 55.2 V × 80 Ah | 4,416 Wh from reported module labels |

Additional loads are not quantified: 12 V siren operation, PZEM battery-side supply and any omitted standby/fan load. Add P_other,bus × operating hours (or use actual measured energy); for a 12 V alarm, E_battery = 12 × I_alarm × alarm_hours / eta_big. Include converter losses only once. Efficiencies may differ with battery voltage/load. This is not a fuse-sizing current or permission to use an unidentified primary wire.

## Full CPE parasitic offset and protection justification

CPE input is12 V. HCW feeds5 V electronics; the alarm uses12 V. The buzzer label gives12 V only,no current or power.13.84 W /332.18 Wh is a5 V-branch-only planning subtotal,not the whole CPE total.

| Branch | Battery-side calculation | Daily energy | Basis |
| --- | --- | --- | --- |
| 5 V electronics | 5 V ×2 A=10 W; battery-side:10/(0.85×0.85) | 13.84 W;332.18 Wh/day for this branch only | 2 A and both85% efficiencies are assumptions. |
| Other12 V standby loads | P_bat,idle=12×I_idle/0.85 | E_idle=338.82×I_idle Wh/day | I_idle is unknown; excludes HCW input already counted. |
| 12 V buzzer while sounding | P_bat,alarm=12×I_alarm/0.85 | E_alarm=0.235294×I_alarm×m Wh/day | I_alarm unknown; m=total sounding minutes/day.2 A fuse is not consumption. |
| Direct battery-side electronics | E_direct=P_direct×24 | 24×P_direct Wh/day | Add only loads outside the counted converter path. |
| Complete daily parasitic offset | E_CPE=332.18+338.82 I_idle+0.235294 I_alarm m+24 P_direct | Numerical total remains unfinalized | Currents inA;direct power inW. No unknown load is silently set to zero. |

P_battery=[5 I5/eta_HCW+12 I_idle+12 I_alarm D]/eta_big+P_direct. D=alarm sounding fraction. I_idle excludesHCW. I_alarm is incremental sounding current. Efficiencies include converter losses at the modeled load.

E_CPE=332.18+338.82 I_idle+0.235294 I_alarm m+24 P_direct Wh/day for the chosen2 A5 V load and85%/85% efficiencies. Currents inA,m inminutes/day,P_direct inW. Full numerical total remains unknown.

Let E_extra be the last three terms. Solar balances:prototype51.82−E_extra;BEMAC787.82−E_extra Wh/day. Stationary hybrid:64.84−E_extra and800.84−E_extra. These retain all earlier solar/wind assumptions. If total12 V supply current is measured,use12 I12,total/eta_big+P_direct without adding the5 V term again.

### Prototype fuses

| Device | Position | Purpose | Basis /status |
| --- | --- | --- | --- |
| 2 A alarm fuse | W3/3 →2 A fuse →F5305S DC+;return→W4/3 | Local protection of alarm-branch wiring; separate from HCW branch | Buzzer current/inrush is unknown.2 A is an existing value, not a proven load-derived optimum. |
| 5 A12 V output fuse | Large buck OUT+ →5 A fuse →W3/1 | Protection of the common12 V output feeder | 5 V branch needs≈10/(0.85×12)=0.98 A at12 V;add alarm and standby current. Verify curve,temperature,inrush and all protected wiring. |
| 15 A prototype main fuse | Pack+ →15 A fuse →W1/1 | Main prototype harness protection near the battery | 5 V-only battery draw≈13.84/48=0.288 A nominal. This normal-load example does not derive15 A or establish fault clearing. Modified termination suitability remains unverified. |
| Battery-side1 A /5 A targets | Proposed PZEM positive /large-buck input branches | Protection of their respective battery-side conductors | Earlier search targets,not finalized approvals. Procurement is deferred;do not restart shopping tonight. The installed5 A12 V output fuse is a different device. |

### BEMAC protection

| Device | Arrangement | Basis | Limit |
| --- | --- | --- | --- |
| Existing vehicle main protection | User-reported DC96 V /325 A | Retain the vehicle/OEM protection scheme | 325 A is its rating,not measured driving current.15 A cannot replace the traction main device. |
| Proposed SOLAIR charging branch | Dedicated DC protection at the approved battery connection | Size from maximum verified branch current and weakest conductor/termination | 400/55.2=7.25 A is only an ideal nominal solar power ratio. The70% energy scenario gives5.07 A;neither is a fuse-setting approval. |
| Future combined solar +wind | Both source paths and the shared branch need coordinated protection | Verified controller outputs,charge limits and cable ratings govern | The unlabelled12/24 V wind controller is not a verified BEMAC interface. Do not inherit the prototype15 A value. |
| CPE supply branch | Same12 V/5 V downstream architecture if a suitable converter is approved | 12 V output/alarm fuses stay on their12 V branches | Raw BEMAC-side protection uses OEM maximum voltage and branch/fault ratings. Prototype hardware compatibility is not assumed. |

| Check | Requirement | Meaning |
| --- | --- | --- |
| Fuse current rating | Check load/inrush,temperature,time-current curve and weakest protected wire/termination. | A higher rating is not automatically better. |
| Fuse +holder DC voltage | At least the highest circuit voltage,including the applicable charging limit. | Prototype maximum54.6 V:documented60 VDC or higher is a voltage screen,not complete approval. BEMAC maximum remains an OEM requirement. |
| Interrupting rating | At least the available prospective fault current at that installation. | 15 A /325 A rated current is not a battery short-circuit-current limit. |
| Selective operation | Compare actual upstream/downstream fuse curves and let-through energy. | 2 A below5 A alone does not prove selective clearing. |

### Loose PZEM VB+ wire

Loose PZEM wire →lead1 of separate battery-rated inline holder →fuse →lead2 →W1 opening5. No extra ring lug/bolt. The assembly is unavailable and full12 AWG will not fit the terminal. Keep this wire disconnected/insulated;do not reopen procurement tonight. The existing15 A bolt-on main fuse is a different device.

Sources: [Analog Devices](https://www.analog.com/en/resources/technical-articles/how-to-measure-the-efficiency-of-a-multiphase-buck-converter-integrated-circuit.html); [Littelfuse](https://www.littelfuse.com/assetdocs/fuse-fundamentals-at-the-heart-of-electrical-systems-fuses-keep-operations-live?assetguid=55d2e833-b53b-467f-a0c2-f15ff2316db3).


## Solar only

| Daily calculation | 48 V / 10 Ah prototype | 55.2 V / 80 Ah BEMAC |
| --- | --- | --- |
| Nominal battery energy | 480 Wh | 4,416 Wh |
| Solar potential: 400 W × 4 PSH × 70% | 1,120 Wh/day before cap | 1,120 Wh/day |
| Accepted solar in this case | 384 Wh/day · proposed 2 A cap × nominal 48 V × chosen 4 clock hours | 1,120 Wh/day · compatible full-array interface assumed |
| 5 V electronics, including two assumed conversion losses | 13.84 W battery-side | 13.84 W battery-side |
| 5 V-branch24-hour consumption subtotal | −332.18 Wh/day | −332.18 Wh/day |
| Solar balance before additional unbudgeted loads | +51.82 Wh/day | +787.82 Wh/day |
| Balance / nominal battery energy | 10.80% | 17.84% |
| Solar energy / modelled electronics energy | 1.16× | 3.37× |
| Study-informed distance equivalent | 0.41 km · energy comparison only | 6.29 km |
| Equivalent riding time at assumed 20 km/h | 1.2 minutes · energy only | 18.9 minutes |

Formula: E_solar = panel_W × PSH × yield. Prototype accepted energy = min(400 × 0.70, 48 × 2) × 4 separately chosen clock hours = 384 Wh. BEMAC potential = 400 × 4 × 0.70 = 1120 Wh, assuming compatible full-array acceptance. E_net = accepted solar − modelled electronics − additional loads. Nominal energy share = E_net / (nominal V × Ah) × 100. Range equivalent = E_net / (1000 / 7.99). Riding minutes = equivalent km / 20 × 60. These are not measured SOC or actual range.

## Future stationary hybrid and riding alternative

Wind power = 0.5 × 1.225 × (0.9 × 0.6) × 5³ × 0.15 × 0.70 = 4.34 W. Three steady natural-wind hours outside the solar window add 13.02 Wh. Prototype hybrid balance = 64.84 Wh; BEMAC = 800.84 Wh before omitted loads. BEMAC hybrid equivalent = 6.40 km / 19.2 minutes.

Geometry, wind duration, coefficient and electrical interface are assumptions. Unlabelled controller is not approved for either battery. Riding in still air at 20 km/h gives 17.9 Wh gross and at least 25.5 Wh extraction-related propulsion cost; wind-only net is at most -7.7 Wh before further losses. Do not combine alternative stationary/riding days.

## Understanding the MPT setting, BEMAC case and UP study

| Question | Explanation |
|---|---|
| Is 2 A for the MPT? | Yes: proposed controller OUTPUT-current cap for the small prototype, not PV-input current or measured net battery current. CPE consumes part of that output. Not a recorded saved setting. |
| Why 2 A? | Chosen modest initial test proposal: 2/10=0.2C. Not an optimum, a BMS requirement or approval of the cells/protection. |
| Why 51.82 Wh prototype? | Nominal 48×2=96 W; four independently chosen effective clock hours give384 Wh; subtract332.18 Wh electronics=51.82 Wh. Four PSH does not establish four capped-current clock hours. |
| Why 787.82 Wh BEMAC? | No prototype2 A cap in this case:400×4PSH×0.70=1120 Wh potential; minus332.18 Wh=787.82 Wh, assuming an OEM-compatible interface accepts it. |
| BEMAC controller current? | Model reference power280 W / nominal55.2 V=5.07 A implied output, NOT a recommended setting. Actual permitted vehicle voltage/current/port remain OEM requirements. |
| If BEMAC were also capped at2 A? | For a separately chosen four-clock-hour nominal model:55.2×2×4−332.18=109.42 Wh, not787.82 Wh. |
| Your on-site findings | Battery labels/configuration establish480 Wh prototype and4416 WhBEMAC. They do not measure route Wh/km. |
| UP study contribution | 7.99km/kWh charging economy for68VM high demand; reciprocal125.16Wh/km is adopted as a planning proxy. |
| Combining with DP1 logs | Use same-period solarWh minus electronicsWh, OR validated net batteryWh without a second load subtraction. Divide measured Wh by125.16 for a study-based distance equivalent; a short trial is not a measured full day. |
| What may we claim? | A theoretical/study-based distance equivalent. Study charging energy and our DC battery energy are different boundaries. Actual extra kilometres require matched vehicle tests including mass/drag, route and load. No study-based calibration of sensors. |

Defense sentence: Our site findings establish battery size; our solar model or DP1 logs supply contributed energy; the UP study supplies a distance benchmark. Actual additional range needs our own vehicle comparison.

## Motorpool findings + UP study — retained provenance

| Reported motorpool finding / other source | Role |
|---|---|
| Each Toshiba module27.6V,40Ah,1104Wh,12S | 27.6×40=1104Wh nominal per module. Printed40Ah already belongs to the module. |
| Four modules2S2P | 55.2V×80Ah=4416Wh, agreeing with4×1104Wh. |
| Technician-supervised56–60V | Operating reading, not nominal capacity or charge ceiling. At assumed280W, implied controller current is5.00A at56V and4.67A at60V, not measured current or a setpoint. |
| SU80CB-5318contact/DC60V/Ith200A;mainDC96V/325A | Equipment labels retained, not energy/range inputs or charging-current permissions. |
| UP study7.99km/kWh | Reciprocal125.16Wh/km supplies the separate charging-energy planning benchmark. |
| Solar/load model787.82Wh/day | 787.82/4416×100=17.84% nominal-energy equivalent using motorpool labels;787.82/125.16=6.29km equivalent using UP benchmark. |

This combines reported pack data, assumed energy contribution and a study benchmark. It does not establish measured motorpool route consumption, solar output, SOC gain or actual additional kilometres.


## Plain defense script

Our electronics budget starts at 5 volts times 2 amperes, or 10 watts on the 5-volt rail. Assuming 85 percent efficiency for each of the two converters gives 13.84 watts at the battery for the5 V branch and 332.18 watt-hours over 24 hours. Additional12 V standby,alarm operation and direct battery-side loads remain to be added. The solar model gives 384 watt-hours for the proposed current-limited prototype case and 1,120 watt-hours for the compatible BEMAC reference. Subtracting that modelled consumption gives 51.82 and 787.82 watt-hours respectively, before additional loads. The BEMAC distance equivalent is 6.29 kilometres using the study benchmark. These are planning assumptions, not measured range or energy results.

## Sources

- [Analog Devices: converter efficiency = output power / input power](https://www.analog.com/en/resources/technical-articles/how-to-measure-the-efficiency-of-a-multiphase-buck-converter-integrated-circuit.html)
- [JICA / Philippine DOE (2004), p.143: annual solar-resource context](https://openjicareport.jica.go.jp/pdf/11752441.pdf#page=154)
- [Dobos (2014), NREL PVWatts V5: Tables 3/6 and thermal model](https://www.nlr.gov/docs/fy14osti/62641.pdf)
- [Abaya et al. (2019), UP Diliman 68VM pilot: Table 2.5](https://easts.info/on-line/proceedings/vol.12/pdf/PP2237.pdf)
- [BEMAC: 68VM manufacturer specifications](https://www.bemac-philippines.com/en/electric-tricycles/models/68vm-passenger)
- [Mohan & Saha (2024): measured Savonius rotor power coefficients](https://doi.org/10.1177/0309524X241239983)
- [U.S. DOE: Small Wind Guidebook, power equation and power-curve method](https://www.energy.gov/cmei/systems/windexchange/small-wind-guidebook)

---

<details><summary>Historical advanced scenario and original input audit · different assumptions</summary>

# SOLAIR DP1 — calculated engineering assumptions

Not physical PASS or a BEMAC connection instruction.

## What the evidence supports

The 400 W array, 39.38 V series Vmp, 48.16 V series Voc, 480 Wh prototype and 4416 Wh BEMAC are label-derived. The proposed 2 A output setting implies ceilings of 96 W at 48 V or 109.2 W at 54.6 V, not guaranteed charging. All earlier daily-yield, wind and added-range results below are optional assumption scenarios, not realistic performance predictions without supporting measurements.

Worked arithmetic example only: suppose validated net battery readings are constant 48.0 V and +1.50 A for 30 minutes. Pnet=72 W; Eterminal=72×0.5=36 Wh. This is 7.5% of prototype nominal Wh, or 0.82% of BEMAC nominal Wh; neither is a measured SOC increase. The 1.50 A and 30 minutes are invented example data, not SOLAIR observations. No separate CPE subtraction is made from already-net battery current.

## Every input: value, provenance and replacement evidence

Defaults and user-edited values are distinguished. An edited value still needs evidence. Origin describes the original default, not proof of a user edit.

| Input | Current value | Status | Origin of default | Replacement evidence |
|---|---|---|---|---|
| pvW | 400 W | Reported label + series arithmetic | Two 200 W panels: 200 + 200 = 400 W at nameplate test conditions. | Keep the rating; use measured loaded input/output power for actual performance. |
| vmp | 39.38 V | Reported label + series arithmetic | Two 19.69 V Vmp labels: 2 × 19.69 = 39.38 V. Series current stays the same. | Log actual loaded voltage; Vmp is not open-circuit voltage. |
| pvVoc | 24.08 V per panel | Reported label | User supplied Voc = 24.08 V per panel. Two in series give 48.16 V at label conditions. | Obtain the panel's actual temperature coefficient for the cold-voltage check. |
| pvIsc | 10.72 A per string | Reported label | User supplied Isc = 10.72 A per panel. In series it remains 10.72 A at label conditions. | Keep as a rating; Isc is not the normal operating current. |
| field | 75 % | Unsupported example assumption | 75% was chosen by the earlier worksheet. No irradiance, temperature, shade or soiling measurement establishes it for SOLAIR. It is not a quoted NREL recommendation. | Prefer logged controller-output Wh; for a forecast use documented irradiance, module temperature/coefficient, orientation and separately defined losses. |
| wire | 98 % | Unsupported example assumption | 98% was chosen as a simple wire-loss allowance. No measured loop resistance or input/output comparison establishes it. | Calculate loss from actual loop resistance and current, or measure power at both ends simultaneously. |
| mppt | 90 % | Unsupported example assumption | 90% was chosen for the controller. It is not a measured MPT conversion or tracking efficiency, nor a guaranteed datasheet minimum. | Use simultaneous PV-input and controller-output energy over the same interval; record operating conditions. |
| buck | 85 % | Unsupported example assumption | 85% was chosen for the 48 V-to-12 V converter. Seller maximum efficiency does not establish this value at the actual load. | Measure converter input and output power/energy at representative load, including modem operation. |
| store | 95 % | Unsupported example assumption | 95% was chosen to represent charging storage loss. It is not measured battery charging efficiency or a round-trip efficiency. | Report battery-terminal electrical Wh directly. Claim internal stored energy only with a separately validated battery model or capacity test. |
| psh | 4 equivalent h/day | Unsupported weather scenario | 4 equivalent full-sun hours was chosen without a local dated irradiance source. It does not mean four clock hours of full output. | Use recorded test energy or dated plane-of-array irradiance for the actual location, month, tilt and shading; annual averages are not a defense-day forecast. |
| cpeW | 12 W at converter output | Unmeasured load example | 12 W was chosen for illustration. No sum of verified component measurements establishes it. The former 12 V/5 A adapter rating is capacity, not consumption. | Measure complete CPE consumption at the stated boundary with modem/sensors operating and record alarm/startup separately. |
| cpeHours | 24 h/day | Operating-plan scenario | 24 h means an intended always-on CPE duty cycle, not demonstrated uptime. | Use actual on-time and recorded power states; label planned duty separately from completed tests. |
| otherW | 1 W at battery bus | Unmeasured load example | 1 W was chosen for all other average bus draw. It is not measured PZEM, controller, display, fan or standby consumption. | Measure the actual included loads. Do not count a load here if already included in a measured total bus draw. |
| protoLimit | 2 A controller-output limit | Proposed engineering setting | 2 A is a deliberately limited proposed commissioning setting: 2/10 = 0.2C for a 10 Ah pack, and one fifth of the reported 10 A BMS charge rating. This comparison does not establish the cells' permitted charge current. It is not an actual saved setting, measured current or optimized choice. | Record the accepted and saved MPT setting plus actual delivered current; pack/BMS/protection limits still apply. |
| protoChargeV | 54.6 V | Reported pack maximum | 54.6 V is the reported 13S Li-ion upper voltage: 13 × 4.2 V. It is not a constant voltage throughout charging. | Use actual instantaneous pack voltage in P = VI and accepted charge-profile settings. |
| protoAvgV | 48 V | Nominal-voltage approximation | 48 V is the pack's reported nominal voltage, reused as an assumed average during charging. No logged average establishes it. | Integrate actual V(t)I(t); do not assume the nominal voltage is the minimum operating voltage. |
| windowHours | 1 h | Example test duration | 1 h was chosen for a demonstration calculation. It is not an actual completed run. | Use the difference between recorded start/end timestamps and identify data gaps. |
| usable | 80 % of nominal Wh | Unsupported operating-window assumption | 80% usable energy was chosen for runtime examples. It is not measured battery capacity, a known BMS cutoff, depth-of-discharge approval or measured SOC accuracy. | Use a validated usable-energy test over defined starting/ending states, or report observed uptime only. |
| bemacWh | 4416 Wh nominal | Reported module labels + topology | Four reported Toshiba modules, each 27.6 V/40 Ah/1104 Wh, in 2S2P: 55.2 V × 80 Ah = 4416 Wh. | Keep as nominal energy; actual usable capacity and OEM charging requirements are separate. |
| referenceKm | 60 km per charge | Published manufacturer reference | BEMAC 68VM page publishes 60 km at constant 20 km/h. It does not establish this vehicle's loaded-route battery Wh/km. | Measure battery energy used divided by route distance under recorded passenger, speed and weather conditions. |
| speed | 20 km/h | Published reference / scenario | 20 km/h is BEMAC's published constant-speed range condition, reused as the riding example. It is not the prototype's measured speed. | Use logged actual vehicle speed and route duration for a vehicle test. |
| addedPenaltyWh | 0 Wh/day | Optimistic omitted-penalty assumption | 0 Wh omits extra rack mass/drag beyond the separate modeled rotor drag. No test proves the added installation has zero penalty. | Compare matched baseline and equipped route energy; avoid subtracting rotor drag twice. |
| windD | 0.9 m | Unverified listing geometry | 0.9 m comes from the seller's 900 mm wheel diameter. Whether this is the actual assembled VAWT swept diameter is unverified. | Measure the assembled rotor's maximum swept diameter. |
| windH | 0.6 m | Unsupported interpretation of listing | 0.6 m was inferred from 600 mm blade length. The listing does not establish that this is the VAWT swept height. | Measure actual swept rotor height. A supplied photo confirms VAWT form, not these dimensions. |
| rho | 1.225 kg/m³ | Standard reference condition | 1.225 kg/m³ is standard sea-level air density near 15°C. It is not measured Caloocan air density; warmer air is generally less dense at equal pressure. | Use measured pressure/temperature and a stated air-density model if a wind calculation is retained. |
| cp | 0.25 dimensionless | Unsupported rotor coefficient | 0.25 was chosen as an illustrative aerodynamic power coefficient. A general guide's range does not establish this rotor's Cp, and Cp varies with operating point. | Use a measured loaded power curve with wind speed; do not fit Cp merely to recover the seller's 400 W claim. |
| genEfficiency | 80 % | Unsupported example assumption | 80% was chosen for generator conversion. No generator test or loss map establishes it. | Use a measured combined electrical power curve where possible; do not apply this efficiency again to already measured electrical power. |
| windEfficiency | 85 % | Hypothetical future interface | 85% was chosen for future wind rectification/conditioning. The owned unlabelled controller has no accepted 54.6 V charging interface. | Identify and validate the actual interface, then measure its input/output energy. This assumption is not permission to connect it. |
| windSpeed | 5 m/s | Unsupported weather scenario | 5 m/s is an example steady wind, not measured local wind or a site forecast. A guide using 5 m/s for annual ratings does not prove local wind. | Log actual wind speed at rotor height with simultaneous loaded electrical power. |
| windHours | 4 h/day | Example duration | 4 h of steady natural wind was chosen without a recorded wind time series. | Integrate the actual varying power over actual timestamps; average wind cubed is not average wind-power input. |
| rideHours | 2 h/day | Example duration | 2 h of riding was chosen for a comparison day, not obtained from an actual route log. | Use actual trip duration with matched baseline/equipped tests. |
| headwind | 0 m/s, signed | Still-air scenario | 0 m/s represents no ambient wind. Only motion-generated relative airflow remains; crosswind and turbulence are omitted. | Measure wind vector and vehicle motion. This one-dimensional model cannot reproduce a road airflow field. |
| ct | 0.8 dimensionless | Unsupported incremental drag coefficient | 0.8 was chosen for the rotor's modeled drag using the same assumed area. It is not measured and does not include all rack/vehicle interaction. This model's Ct is a force coefficient, not a measured turbine thrust curve. | Measure incremental drag or, preferably, matched-route battery Wh/km. A formula cannot supply an unknown coefficient. |
| driveEfficiency | 80 % | Unsupported drivetrain coefficient | 80% was chosen to convert added mechanical drag power to battery draw. It is not measured BEMAC drivetrain efficiency. | Use matched route electrical-energy differences rather than inventing a vehicle efficiency. |
| betaVoc | -0.3 % per °C | Unsupported panel coefficient | −0.30%/°C was chosen for an illustrative cold-voltage calculation. It is not from the actual panel datasheet. | Obtain the exact panel manufacturer's signed Voc temperature coefficient, including units. |
| tMin | 10 °C cell temperature | Unsupported design-temperature scenario | 10°C was chosen as a cold example. It is not a documented site design minimum or measured panel temperature. The 25°C reference comes from STC, not local weather. | Use the appropriate documented design minimum and actual panel coefficient; record the basis before releasing the voltage check. |

## Formula meanings and why they apply

### Electrical power

`P = V × I`

P is watts (W), V is volts and I is amperes (A), measured simultaneously at the same DC branch. Voltage is energy per charge (J/C); current is charge per time (C/s); their product is J/s = W. Use average of instantaneous VI if the load varies, not unrelated average V and I.

Use limit: A panel's open-circuit voltage and short-circuit current are different operating points. Voc × Isc is not its delivered power.

### Electrical energy

`E = ∫ P(t) dt; E ≈ Σ [(Pi + Pi−1)/2] × Δtseconds / 3600`

Energy is accumulated power. W × hours = Wh; seconds/3600 converts timestamps to hours. The trapezoid rule approximates the area under the power-time trace when samples resolve its variation.

Use limit: For verified constant power only, E = P × t. Log gaps and unvalidated current invalidate an apparently precise Wh result.

### Series / parallel and battery nominal energy

`Vseries = ΣV; Ahparallel = ΣAh; Enom ≈ Vnom × Ah`

Series voltages add by Kirchhoff's voltage law; series current is shared. Parallel groups at the same voltage add charge capacity. V × Ah has units Wh. Multiplying nominal voltage by charge capacity approximates the actual voltage-versus-charge integral.

Use limit: 480 Wh and 4416 Wh are label-based nominal energy, not measured available energy or calibrated SOC.

### Efficiency and conversion

`η = Eout / Ein; Pout ≈ Pin × η; Pin ≈ Pout / η`

η is a dimensionless fraction, so 85% means 0.85. Conservation of energy: output is input minus loss. Multiplying applies to sequential stages; dividing finds the upstream demand needed to supply a known downstream load.

Use limit: Measure both sides over the same interval. PZEM after the controller already includes controller loss: do not multiply a measured output by controller efficiency again.

### Current-limited output

`Pcontroller ≤ min(Pavailable after conversion, Vbattery × Ilimit)`

At the proposed 2 A output limit, the voltage-current ceiling is 48 × 2 = 96 W at a 48 V operating point, or 54.6 × 2 = 109.2 W at 54.6 V. The smaller constraint controls output.

Use limit: These are ceilings, not guaranteed production. A full battery, CV taper, clouds, thermal limits and CPE draw can reduce actual net charge. This assumes Ilimit is controller-output current, not a separately measured net-battery limit.

### Solar weather model

`Pdc ≈ PSTC × (GPOA / 1000 W/m²) × [1 + γP(Tcell−25°C)]; HPSH = ∫GPOA dt / (1000 W/m²)`

GPOA is irradiance on the panel plane, Tcell is cell temperature, and γP is the actual power-temperature coefficient in fraction/°C. PVWatts uses irradiance and temperature to scale rated DC power. HPSH is equivalent full-sun hours: integrated irradiance divided by reference irradiance.

Use limit: Neither GPOA nor temperature/γP is known here. The old 75% field factor is not evidence for them. A 4-PSH energy total cannot predict current-limited output without the time profile; do not turn it into four literal hours at fixed power.

### Net battery-terminal energy

`Pnet = Psolar,out + Pwind,out − Ploads,bus; Eterminal = ∫ Vbattery × Inet dt`

All powers must use one electrical boundary. Positive Inet means current into the battery after physical sign validation. Energy conservation makes generation minus connected loads equal net terminal transfer when the boundary includes those branches.

Use limit: Validated signed ACS net current already accounts for CPE draw; do not subtract CPE a second time. Terminal Wh is not internal chemical stored Wh, SOC or vehicle range. For losses use ΔEstored = ∫[ηcharge max(Pnet,0) + min(Pnet,0)/ηdischarge]dt with separately validated efficiencies.

### Runtime / refill / range

`truntime ≈ Eusable / Pload; trefill ≈ ΔEstored / Pnet,stored; Δd ≈ Enet / eroute`

Wh/W gives hours; Wh/(Wh/km) gives kilometres. Eusable is measured usable energy over defined states; eroute is battery Wh used divided by actual route km. These ratios require representative load/route conditions.

Use limit: When net charge is ≤0 there is no finite refill time. 4416/60 = 73.6 Wh/km mixes nominal energy and brochure range: it is a comparison proxy, not measured route efficiency. Convert distance to time only at a stated representative speed.

### VAWT wind power

`A = D × H; Pair = ½ρAv³; Pelec = Pair × Cp × ηgenerator × ηinterface`

A is swept rectangle area in m²; D/H are actual swept dimensions in m, ρ is air density kg/m³ and v is upstream wind m/s. Air kinetic energy is ½mv² and mass flow is ρAv; multiplying gives ½ρAv³ in W. Cp is the extracted mechanical fraction; efficiencies cover later electrical stages.

Use limit: The formula is physically grounded but unknown height, Cp, wind and efficiency prevent an actual output prediction. A measured electrical power curve already includes rotor/generator losses. The 400 W label is a rating claim, not an all-wind output.

### Riding turbine drag

`Fdrag = ½ρCdA vrelative²; Pdrag,mechanical = Fdrag × vvehicle; Ebenefit = Ewind,electrical − Eextra,traction`

Dynamic pressure ½ρv² times area and an empirical force coefficient gives force in N; N × m/s = W. Added drivetrain input needs its own measured conversion or matched electrical-energy test. Relative airflow from riding in still air comes from traction energy.

Use limit: Cd/Ct and incremental installed drag are unknown. A general drag equation does not determine them. The old Ct=0.8 is illustrative only; a Ct≥Cp software guard is a crude consistency screen, not rotor validation. Crosswind, vehicle-flow interaction and tailwind credit need a better model or matched road tests.

### Cold open-circuit voltage

`Voc,cold = Nseries × Voc,STC × [1 + βVoc(Tmin−25°C)]`

This is a first-order manufacturer-coefficient temperature correction. βVoc must be signed fraction/°C: −0.30%/°C = −0.003/°C. Cooling gives negative ΔT; a negative coefficient therefore increases Voc.

Use limit: The actual coefficient and design minimum are missing. The old 50.33 V example cannot release the real controller voltage check. The calculator clamps temperatures above 25°C to 25°C for its cold-only comparison.

### Current, resistance and protection

`Iin ≈ Pload / (Vin × η); Vdrop = IR; Rwire = ρcopperLloop/Awire; Ploss = I²R`

These follow P=VI, efficiency definition and Ohm's law. Lloop includes outward and return conductors; copper resistivity ρcopper is a different quantity from air density ρ. A shunt uses R=Vrated/Irated; resistors combine by series sums and parallel reciprocal sums.

Use limit: Estimated operating current does not uniquely choose a fuse. Minimum voltage, startup, conductor/terminal limits, fuse curve/temperature derating, DC voltage and fault interruption are separate requirements. 60/(48×0.85)=1.47 A cannot prove that 5 A is the correct final fuse.

## Other constants and component-selection provenance

- **STC: 1000 W/m², 25°C cell temperature, AM1.5:** Nameplate reference conditions, not current outdoor conditions. The 400 W array rating is conditional on these tests.
- **Prototype 48 V, 10 Ah; 13S; 4.2 V/cell maximum:** User-reported pack/chemistry basis: 480 Wh nominal and 54.6 V maximum. Full-charge voltage × Ah is not nominal energy.
- **20% start / 80% target; 288 Wh; 96 Wh starting energy:** Chosen worksheet energy fractions: 480 × (0.8−0.2)=288 Wh and 480 × 0.2=96 Wh. Not measured SOC, usable capacity or approved cutoff.
- **60 V MPT input comparison:** Family-manual input maximum used as a comparison only; actual unit and cold panel voltage must be checked. It is unrelated to a battery minimum voltage.
- **400 W @ 12 m/s, 2 m/s starting speed:** Seller wind claims. The model caps the pre-interface electrical output at 400 W and imposes an artificial zero below 2 m/s; neither is a measured power curve or loaded cut-in. The model stops at 12 m/s because no overspeed power curve is known.
- **16/27 Betz limit:** Ideal isolated-rotor aerodynamic bound from momentum theory. This is a physics sanity check, not this VAWT's efficiency, installed power curve or universal bound for every ducted/vehicle-flow configuration.
- **24 h/day; 3600 s/h; 3.6 (km/h)/(m/s):** Unit conversions/definition of a day, not equipment assumptions. The time model puts all on-windows at t=0, assumes constant power in each window and no battery-capacity clipping.
- **100% discharge efficiency:** Implicit simplification of the optional stored-energy scenario, not a tested battery property. Terminal electrical-energy reporting needs no invented storage efficiency.
- **60 W CPE ceiling; 5 W PZEM allowance; 40 V example:** 60 W came from the former 12 V × 5 A adapter capacity, not a measured load. 5 W was an unsupported PZEM sizing allowance. 40 V was an illustrative voltage, not a confirmed pack minimum/BMS cutoff. These cannot finalize a fuse.
- **5 A converter / 1 A sense fuse; 75% loading; ≥60 VDC:** 5 A and 1 A are preliminary search targets, not values uniquely derived from load current. 75% is a possible product-guide derating example, not a universal rule. ≥60 VDC rounds above the pack's 54.6 V maximum; actual DC interruption, holder, wire, startup and fuse curves remain required.
- **TOMZN 16 A, 500/600 V; 1.25 × Isc:** Breaker markings are user-reported. 1.25 × 10.72=13.4 A is an illustrative comparison, not a completed code, trip-curve or fault-rating design.
- **Copper ρ = 0.0175 Ω·mm²/m at assumed 20°C; 4 m loop; 12 AWG 3.31 mm²:** Copper resistivity and AWG area are approximate reference values. Four metres is an example loop length, not a measured SOLAIR route or cut list. Contact resistance and hot-wire resistance are omitted; voltage-drop math does not certify ampacity.
- **50 A / 75 mV shunt; four 100 Ω resistors:** Reported part values: Rshunt=0.075/50=0.0015 Ω; two 200 Ω series branches in parallel give 100 Ω nominal. Tolerance, temperature and instrument error still matter. 12.0 V is the worked resistor-test point, not a reported loaded reading.
- **WAGO 4 mm² flexible-wire maximum; 12 AWG ≈3.31 mm²:** Genuine 221-415 manufacturer limit and approximate standard wire area. Delivered connector/contact identity and preparation still govern. SB50 family wire range does not identify a contact stamped 6 as suitable for 12 AWG.
- **Buck 12–75 V input; 12.0 V selected output; BMS 20 A discharge / 10 A charge:** Seller/input label and user-reported BMS ratings. Arithmetic range inclusion is not delivered electrical/thermal acceptance. BMS ratings are protection envelopes, not actual current demand or charge regulation.

## Basis

User-reported four Toshiba modules, each 27.6 V / 40 Ah / 1104 Wh; external 2S2P gives 55.2 V / 80 Ah / 4416 Wh. Technician-observed 56–60 V is not the charging ceiling. Prototype: 13S Li-ion, 48 V / 10 Ah nominal (480 Wh), 54.6 V maximum. BEMAC reference 60 km at constant 20 km/h is a published reference, not measured route consumption. Nominal Wh/range is a planning proxy.

## Scenario inputs

| Parameter | Value |
|---|---:|
| pvW | 400 |
| vmp | 39.38 |
| field | 75 |
| wire | 98 |
| mppt | 90 |
| buck | 85 |
| store | 95 |
| psh | 4 |
| cpeW | 12 |
| cpeHours | 24 |
| otherW | 1 |
| protoLimit | 2 |
| protoChargeV | 54.6 |
| protoAvgV | 48 |
| windowHours | 1 |
| usable | 80 |
| bemacWh | 4416 |
| referenceKm | 60 |
| speed | 20 |
| addedPenaltyWh | 0 |
| windD | 0.9 |
| windH | 0.6 |
| rho | 1.225 |
| cp | 0.25 |
| genEfficiency | 80 |
| windEfficiency | 85 |
| windSpeed | 5 |
| windHours | 4 |
| rideHours | 2 |
| headwind | 0 |
| ct | 0.8 |
| driveEfficiency | 80 |
| pvVoc | 24.08 |
| pvIsc | 10.72 |
| betaVoc | -0.3 |
| tMin | 10 |

PSH is represented by a rectangular equivalent solar window, not a forecast of actual sun hours. Field derating covers additional module/availability losses, not a second PSH factor. CPE is on during the first specified hours including the solar window. Other bus draw continues 24 h. Charge-storage efficiency is applied only to positive net charging; discharge efficiency is assumed 100%. BEMAC interface is hypothetical and assumed to accept modeled power; prototype remains current-capped. Capacity, reserve, starting energy and no clipping must be checked.

## Formulas and results

- Panels in series: 2 × 19.69 = 39.38 V Vmp; 2 × 200 = 400 W; current is 400/39.38 = 10.1574 A at nameplate conditions, not twice that current.
- User panel labels: Voc 24.08 V and Isc 10.72 A each; series Voc 48.1600 V, series Isc 10.72 A. Cold example uses assumed -0.3 %/C and Tmin 10 C: 50.3272 V, margin to 60 V 9.6728 V. Actual coefficient/design temperature remain unverified; this is not a released cold-Voc check.
- BEMAC: (2 × 27.6 V) × (2 × 40 Ah) = 4416 Wh; 4 × 1104 Wh agrees. Module 40 Ah is already its printed capacity.
- Prototype: 48 × 10 = 480 Wh; do not use 54.6 × 10 as nominal energy. Capacity ratio = 9.2.
- Modeled PV bus W = PV W × field × wire × MPPT efficiencies = 264.6000 W.
- Auxiliary bus W = CPE W / buck efficiency + other bus W = 15.1176 W.
- Prototype solar bus W = min(modeled PV W, current limit × charge voltage) = 109.2000 W.
- Prototype window storage Wh = signed net charging W × window hours, with storage efficiency on positive net power = 89.3782 Wh; 18.6205% of nominal prototype energy. Same Wh is 2.0240% of modeled BEMAC capacity.
- Prototype 20–80% energy refill at assumed average voltage = 288 Wh / net stored W = 3.7481 h. Constant-condition estimate; not full-charge/CV prediction.
- Prototype no-solar CPE runtime from assumed usable energy = 480 Wh × usable fraction / auxiliary W = 25.4008 h, not observed uptime.
- Daily energy integrates the equivalent solar interval and remaining no-solar interval, then subtracts entered extra vehicle penalty = 645.6800 Wh. Solar bus gross = 1058.4000 Wh; auxiliary draw = 362.8235 Wh.
- BEMAC nominal energy/range proxy = 4416/60 = 73.6000 Wh/km; not measured drive efficiency. Added distance equivalent = net Wh / proxy = 8.7728 km. At assumed 20 km/h: 26.3185 extra minutes equivalent.
- Prototype usable-energy e-trike equivalent = 5.2174 km; this pack is NOT qualified to power the BEMAC traction system.
- Restricted prototype daily scenario, at assumed average pack voltage and current cap = 5.0000 Wh net. Unclipped peak/end energy from assumed 20% start = 403.3529 / 101.0000 Wh. Outside reserve/capacity means the unconstrained result is not an achievable day.

## Energy harvesting — solar versus solar + wind

Actual shape: VAWT, user-confirmed photo. Listing: 400 W at 12 m/s, 12/24 V three-phase AC; included controller is owned but unlabelled. No accepted wind charging interface or measured power curve exists. Main DP1 remains solar-only; preliminary wind test follows the main prototype, otherwise DP2.

- Geometry assumption: diameter 0.9 m × height 0.6 m = 0.5400 m². Listing 600 mm is NOT confirmed rotor height. Photo confirms shape only.
- Assumptions: rho 1.225 kg/m³, Cp 0.25, generator efficiency 80%, future wind-interface efficiency 85%. Pbus = min(400 W, 0.5 rho D H v³ Cp eta_generator) × eta_interface. Model sets power zero below 2 m/s, an idealized threshold; starting speed does not prove loaded cut-in. No extrapolation above 12 m/s. These are illustrative engineering inputs, NOT a fitted or measured curve.
- Parked natural wind 5 m/s for 4 h: 7.0284 W at hypothetical bus, gross 28.1138 Wh. Solar-only parked net 645.6800 Wh/day versus hybrid parked 672.3881 Wh/day; wind increment 26.7081 Wh. Hybrid range/time equivalents 9.1357 km / 27.4071 min.
- Riding model: 20 km/h, 2 h, signed headwind 0 m/s (positive headwind, negative tailwind); apparent wind abs(vehicle m/s + signed headwind) = 5.5556 m/s. Only collinear steady airflow is represented; turbulence, shielding and crosswind require measurement.
- Drag model: F = sign(relative airflow) × 0.5 rho A Ct |v_relative|², Ct 0.8 assumed, not measured. Incremental traction-bus power = F × vehicle speed / drive efficiency (80% assumed): 56.7130 W. This simple model assumes equal efficiency for a tailwind credit; it is not a vehicle dynamometer result.
- Wind while riding: gross electrical 19.2824 Wh; added drag battery cost 113.4259 Wh. After piecewise storage/load integration, wind increment -94.1435 Wh. Still-air riding is not a free charging source.
- Reference traction baseline 1472.0000 W × riding hours; baseline-only change -2944.0000 Wh. With solar and CPE: -2273.3718 Wh battery change; with solar, CPE and turbine/drag: -2367.5153 Wh. These include traction. Relative to baseline, solar assist 670.6282 Wh (9.1118 km equivalent); hybrid assist 576.4847 Wh (7.8327 km equivalent). Positive assist need not mean the moving battery is charging.
- Prototype comparison during a simultaneous solar/wind demo window: retain a coordinated total source-power cap of charge limit × voltage. Solar-only 89.3782 Wh stored versus hypothetical compatible-wind 89.3782 Wh. Existing solar may already reach the cap, leaving no added wind acceptance. This is not an instruction to parallel the unknown controller.
- Each row is an alternative day, not additive. All windows start at time zero in the simplified model; parked wind lasts windHours, riding wind lasts rideHours. Auxiliary loads are counted once. Storage loss is applied only to positive net charging. Extra penalty is applied once to each day. No capacity clipping; full pack may curtail. Added range uses the same unmeasured nominal-energy/range proxy.

## Component selection and justification — separate from energy harvesting

### Branch protection

Selected design search targets: 5 A converter input and 1 A PZEM branch, fuse and holder documented at 60 VDC or higher, with suitable documented DC fault interruption. These assume CPE output at most 60 W and are not established final ratings. A 60 W chosen ceiling (former 12 V × 5 A adapter capacity, not measured CPE consumption) at nominal 48 V and assumed 85% buck efficiency implies 1.4706 A input; this does not establish a fuse time-current curve, wire coordination or DC interruption. The earlier worksheet used an unsupported 5 W PZEM sizing allowance: 5/48 = 0.1042 A; 1 A remains only the earlier provisional search target. This is not measured consumption or a manufacturer requirement. With an illustrative 75% continuous-loading factor, 5 A and 1 A allow 3.75 A and 0.75 A normal current, above the estimated nominal-voltage 1.4706 A and 0.1042 A. 48 V is nominal, not a minimum. Earlier 40 V was an illustrative lower-voltage scenario, not a battery label or confirmed BMS cutoff; there the estimates are 1.7647 A and 0.125 A. Actual minimum voltage, startup and fuse datasheets/temperature/clearing curves govern. Daily-average other-load assumptions remain separate from this worst-case allowance. Inline form is allowed if the actual fuse/holder/leads have documented suitable DC and fault ratings. Anonymous 250 V-only glass parts are not verified. Do not omit protection or deliberately short-test a battery.

## Measurement and limits

Replace assumed watts with measured V × A at a stated boundary. Integrate PZEM solar W and calibrated signed ACS net battery W over actual timestamps; do not count solar energy twice. Efficiency requires matched input/output energy measurements. Full battery curtails charging. Vehicle added mass/drag and actual route Wh/km remain unmeasured; extra-penalty default 0 is an optimistic assumption. Wind numbers are assumed future-interface scenarios, not measured production or evidence of an accepted wind-to-battery connection. OEM Toshiba/BEMAC charge voltage/current/port/VCU requirements remain separate from prototype settings.

## Other component justifications

- Existing TOMZN: user reports 16 A and 500/600 V; source top + left / - right, load bottom + left / - right. Label Isc 10.72 A; a single illustrative 1.25 multiplier gives 13.4 A, below 16 A. This arithmetic does not establish local protection compliance, trip curve, fault interruption, temperature/wire coordination or a verified delivered model.
- SB50 pair is owned, but the actual supplied contact barrel gauge is unconfirmed. Overall family wire-size range does not mean every contact fits every size. Use documented 12 AWG-compatible contacts; no automatic second connector purchase.
- Genuine 221-415 accepts flexible wire up to 4 mm²; 12 AWG is about 3.31 mm². Actual authenticity, preparation and terminal ranges still govern.
- Seller buck input 12–75 V includes 54.6 V pack maximum arithmetically; delivered electrical/thermal behavior needs verification. ACS current accuracy still requires zero and independent known-current/range validation.
- Initial prototype charge rate = 2 A / 10 Ah = 0.2C. BMS-label discharge rate = 20/10 = 2C; not a current regulator.
- BEMAC 20–80% nominal energy refill = 4416 × 0.6 = 2649.6 Wh. Under the default net 645.68 Wh/day scenario, 4.10 equivalent modeled days without driving; not a weather forecast or CV/full-charge timing.
- At 264.6 W and the observed 56–60 V range, P/V gives 4.73–4.41 A. This does not establish the OEM charging voltage/current or port.
- Copper wire example at assumed 20°C: rho 0.0175 ohm mm²/m, loop 4 m, 12 AWG area 3.31 mm² gives R=0.02115 ohm; at 2 A, drop 0.0423 V and loss 0.0846 W. Not a cut list or ampacity certification.
- 50 A / 75 mV shunt: R=0.0015 ohm; at 2 A, 3 mV and 0.006 W.
- Resistor bank: (100+100) parallel (100+100)=100 ohm. At 12 V: 0.120 A, 1.44 W total, 0.36 W each.
- Wind hardware: user confirms a VAWT and an included unlabelled controller; listing says 400 W at 12 m/s, 12/24 V, three-phase AC. Compatibility with 13S and BEMAC is unverified. No wind-interface purchase is made mandatory for solar DP1.

## Sources

- [PVWatts / STC and irradiance-temperature model](https://pvpmc.sandia.gov/modeling-guide/2-dc-module-iv/point-value-models/pvwatts/)
- [NREL PVWatts version 5 manual](https://pvwatts.nrel.gov/downloads/pvwattsv5.pdf)
- [DOE small-wind guide: wind power and measured power curves](https://www.energy.gov/cmei/systems/windexchange/small-wind-guidebook)
- [NASA drag equation and empirical coefficient](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/drag-equation/)
- [BEMAC published range condition](https://bemac-philippines.com/en/electric-tricycles-3/models/68vm-passenger)
- [Toshiba SCiB module catalog](https://www.global.toshiba/content/dam/toshiba/ww/products-solutions/battery/scib/pdf/SCiB_toshiba_en.pdf)
- [Littelfuse fuse selection guide](https://www.littelfuse.com/assetdocs/fuseology-selection-guide?assetguid=fa4aa360-f6c4-4eec-88a6-3d7ec3fe57d5)
- MPT manual: https://storage.ua.prom.st/752298_mpt_7210a.pdf

</details>
