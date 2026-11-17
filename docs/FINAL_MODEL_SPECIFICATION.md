# S7 frozen specification for the ship-model redesign

This is the single selected conceptual baseline. It supersedes S6 geometry and fuel totals, the 17.8/18 t minimum-AM option, the 19.99 t + 10 kg split, and the 36.4 t energy-minimum option. It is ready for a conceptual model; it is not a dimensionally closed or flight-qualified engineering design. No further mission preference is required before a conceptual redesign.

## Sources and authority

- Inputs: `data/final_model_specification.json`.
- Calculated mass and chronological stage ledger: `reports/final-model-specification.json`.
- Reproduce: `python -m calculations.final_model_specification` (SciPy required).
- Selected architecture: `data/mission_architecture.json`.
- This document governs redesign; old geometry and reports remain historical references.

## Fixed mission and propulsion choices

- 24 adults, 24 berths, eight three-person bays; all-awake emergency capacity. Two separated reproductive banks. No in-flight births. No mandatory torpor schedule or intrinsic torpor radiation/ageing benefit.
- Crew launches 20 years after cargo; crew travels 20 Earth years, cargo 40, arriving together. Both allocations include 0.1 year for arrival operations, but final capture fuel has not been charged.
- Crew loads 20 t antimatter plus matching ordinary reactant. Cargo uses zero antimatter. D-He3 fusion feed approximately 40:60 by mass; no added inert feed.
- Eight equal-rapidity tank modules per main burn: 16 staged modules per ship. They are NOT equal in fuel capacity. Empty each module before discarding it; discard the final braking module.
- Zero unused main fuel after braking. Keep the separate 10% chemical landing contingency. Apply 10% hardware allowance, not a second allowance on already margined report rows.
- Keep optimistic 80% fusion/annihilation coupling, 5 GW/kg engine specific power, 2000 K hot radiator coefficients and existing containment/tank mass assumptions. These are design premises, not demonstrated performance.

## Habitat and external arrangement

- Two coaxial conceptual gravity modules, common axis along flight direction; counterrotation shown schematically. Each module: 9.5 m envelope radius, 4.5 m axial depth. Retain floor-radius references 8.5 m and 5.4 m. Bearing/interface dimensions and rotation rate require design.
- Allocate 750 m3 usable space across both modules, approximately 375 m3 each. This is not total geometric volume. Include food production, medical, exercise, maintenance, circulation and life support; do not draw an empty 750 m3 lounge plus separate unbudgeted systems.
- Forward collision shield: 20 m circular diameter, 100 kg/m2 face allocation, plus 3 t nominal supports. Face plus supports with 10% allowance totals 37.858 t. This replaces the inconsistent 19.54 x 15.6 m reference face. No verified impact rating is implied.
- The two coaxial 19 m habitat envelopes fit inside the nominal 20 m forward projected envelope. Tank attachments, clearance and the full protected envelope still need verification. Additional frontal area changes shield mass and must trigger recalculation.
- Main engine standoff target: 2000 m from habitat. This is a separation target, not a sized 2 km structural boom. Retain the 29.7 t tow-assembly allocation provisionally.
- Show main engine, main hot radiators, forward shield, orbital service unit and tank modules as nonlanding hardware. Radiator area can be derived from the assumed 5 kg/m2 and allowance, but shape, supports and thermal view factors remain unengineered.
- Keep the lander as the complete transit habitat assembly, with gravity machinery retained unless separately redesigned and costed. One service reactor lands; the second stays with the orbital assembly.

## Tank and shielding rules for the model

- Read `ships.<kind>.propulsion.segments` in chronological order. Each segment has phase 0 acceleration / phase 1 braking, index 0-7, fusion_t, antimatter_t, tank_and_separation_t and before/after masses. Ordinary annihilation reactant equals segment antimatter mass.
- Represent distinct deuterium, He3 and isolated AM-containment services; do not label every main tank hydrogen. Species subdivisions use approximate 40:60 mass, not volume.
- Tank diameter, length, liquid density, temperature, ullage, insulation, cryocooling and wall structure are NOT fixed. Do not infer real volume from mass with an invented density. A first concept may use explicitly schematic mass-proportional tank symbols; dimension labels must stay provisional.
- Place braking-fuel compartments around compact occupied/refuge regions and consume them last. This is an intended layout requirement, not solved all-sky coverage. It must coexist with the chronological staging and mass ledger.
- Carry only 8 t working water, all landed; no separate 36 t shield-water load. Working water, suitable stores and landing propellant provide persistent dual-use shielding where geometry permits.
- Retain 47.08 t engine-source shielding, 33 t unresolved GCR equipment allowance and the forward impact shield as separate allocations. Do not show them as certified protection or silently remove them.
- Keep the forward impact shield facing incident interstellar material during braking. A whole-ship flip with no forward protection is unacceptable. Thrust reversal, engine/tow repositioning and shield coverage require an explicitly provisional braking configuration.

## Landing and cargo disposition

- Crew: 450 s chemical landing propulsion, 500 m/s total powered-descent target including losses, atmosphere-assisted entry, handover target 300 m/s. Four 3 MN engine allocations; detailed sizing and throttle control unresolved.
- Deploy a fresh 50 m crew aeroshell. The interstellar dust shield stays orbital; it is not reused as certified atmospheric TPS.
- Cargo retains 1000 m/s chemical descent, a 35 m aeroshell and four 1.5 MN engine allocations.
- Nuclear thermal landing remains unselected. Do not combine its hypothetical fuel saving with the selected 500 m/s chemical saving.
- Cargo must land and confirm water, power and protected accommodation before crew descent. Crew carries 8 t water and one operating service reactor to the surface. Cargo holds the heavy industrial, exploration, habitat-expansion and repair equipment in the input ledger.
- No Earth return, indefinite loiter or independently survivable cargo-failure mission is claimed.

## Selected mass ledger

All masses tonnes. Inventories include people and supplies; retained core is not dry mass.

| Quantity | Crew | Cargo |
|---|---:|---:|
| Fixed hardware including landing tanks | 368.095 | 168.983 |
| Main engine | 121.401 | 15.140 |
| Main hot radiators | 42.373 | 5.284 |
| Retained dry hardware | 531.869 | 189.408 |
| Staged tanks, containment and separation | 303.363 | 46.500 |
| Departure dry hardware | 835.232 | 235.908 |
| People and inventories | 30.920 | 25.000 |
| Chemical landing propellant | 30.197 | 45.266 |
| Fusion fuel | 26,398.498 | 4,067.228 |
| Antimatter | 20.000 | 0.000 |
| Matching ordinary annihilation reactant | 20.000 | 0.000 |
| Departure total | 27,334.848 | 4,373.401 |
| Retained after main braking | 592.986 | 259.674 |
| Landed dry hardware | 195.157 | 132.683 |
| Entry package | 256.274 | 202.949 |
| Touchdown including chemical contingency | 228.823 | 161.798 |

Departure = departure dry + inventories + chemical fuel + fusion + AM + ordinary annihilation reactant. Subtotal rows overlap. Cargo dry mass includes all its delivered hardware; crew landing hardware remains 195.157 t, with 30.920 t inventories and 2.745 t nominal leftover landing contingency.

### Crew fixed-hardware detail

| Item | Mass with allowance | Lands |
|---|---:|---|
| Pressure envelopes, floors and frames | 55.000 | Yes |
| Spin, bearings and transfers | 13.200 | Yes |
| Adult furnishings and exercise | 8.800 | Yes |
| Life support and two food-production trains | 24.200 | Yes |
| Medical, 24 berths and two reproductive banks | 11.000 | Yes |
| Habitat service fission-electric unit | 16.500 | Yes |
| Transit backup fission-electric unit retained in orbit | 16.500 | No |
| Service thermal management and distribution | 11.000 | Yes |
| Avionics, communication and autonomy | 4.400 | Yes |
| Landing cradle and chemical engines | 19.800 | Yes |
| Deployable aeroshell and fresh TPS | 13.200 | Yes |
| Arrival separation and power transfer | 8.800 | Yes |
| Water storage and plumbing | 6.600 | Yes |
| Forward shield face and supports | 37.858 | No |
| Remote engine tow assembly | 29.700 | No |
| Fixed main-feed and deployment services | 8.800 | No |
| Engine shadow shields and neutron-layer allowance | 47.080 | No |
| Unresolved GCR equipment allowance, no dose credit | 33.000 | No |

### Trajectories

- Crew: 1.671446 years per burn, 16.557109 years coast, 0.1 year arrival allocation; peak 0.232307c. Proper transfer time 19.416047 years, excluding arrival allowance.
- Cargo: 0.990929 years per burn, 37.918142 years coast, 0.1 year arrival allocation; peak 0.108964c. Proper transfer time 39.670277 years, excluding arrival allowance.

## Engineering gates: not further user preference choices

1. Capture/approach: incorporate the earlier 12 km/s allowance into the trajectory and loaded fuel, or replace it with a justified trajectory requirement. It is currently omitted. No nonexistent main reserve can pay for it.
2. Propulsion: establish burnup, coupling, thrust, heat leakage, radiator performance, containment and engine lifetime.
3. Radiation: transport analysis of GCR, forward secondaries and engine sources through the complete changing tank geometry. The dose result remains null.
4. Packaging: resolve cryogenic storage volumes, stage clearances, plumbing, spin/tow interfaces, braking thrust reversal and protected frontal area; charge added hardware.
5. Entry: demonstrate the assumed atmosphere, aeroshell performance, 500 m/s terminal budget and landing control.
6. Mission survival: close food/water/reliability budgets, including 8 t water adequacy, long-term operations and cargo commissioning.

These gates may change fuel, dry mass or geometry. No claim of final optimality or healthy-arrival qualification is made.

## Redesign acceptance checklist

- Read only S7 as selected data; legacy values are labeled historical.
- Show both ships and launch dates; population is 24 adults with no in-flight children.
- Show departure, cruise, braking, post-braking/orbital, entry and surface states.
- Hide each emptied stage when jettisoned; display stage-specific masses, not equal-sized fuel loads.
- In surface view show only land-designated hardware, landed inventory and remaining landing contingency.
- Show the working water and two service units in their correct dispositions.
- Label unresolved tank geometry and braking layout as schematic; do not show fabricated final dimensions or dose values.
- Label the 20 m shield, 19 m habitat envelopes, 750 m3 usable allocation and 2000 m engine-standoff target with their conceptual status.
- Preserve component mass totals and do not apply the 10% allowance twice.
- Run model phase-state and mass-conservation checks before calling the redesign complete.
