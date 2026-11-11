# Spacecraft mass and fuel planning estimate

The current two-disc design does not support a 500-tonne departure target. The nominal conditional estimate is **6,111 tonnes at departure**, retaining **1,991 tonnes after touchdown**. Even the optimistic combined sensitivity departs at 3,019 tonnes. These are transparent planning estimates, not measured masses or proof that the spacecraft is feasible.

This ledger assigns a numerical allowance to every carried system and solves fuel-dependent hydrogen tank and hot-radiator mass together. Antimatter containment, effective exhaust performance, intercepted engine radiation and dust protection remain unresolved. Filling their cells does not turn them into validated technology.

The reductions in MASS_OPTIMISATION.md show that the 6,111 t reference is not a demonstrated minimum. These comparisons retain the existing 3D geometry as a reference while evaluating different sizes, equipment targets, startup power and cruise food production.

## Scope and geometry

- 36 people, 18 couples, two inflatable discs, each with a 30 m radius and 4.5 m depth; six deck radii of 28/24/20/16/12/8 m.
- 4,071.5 m2 gross deck floor using 3 m usable axial width; 2,646.5 m2 after an explicit 65% net-area factor. This is an area allowance, not a verified circulation or pressure fit.
- Full-disc cylindrical envelope approximation: 13,006 m2 external surface and 25,447 m3 pressure volume. At 70 kPa and 293 K, its initial air-equivalent gas inventory is 21.2 t before makeup. Lobes, partitions, excluded voids and mixed-gas storage need separate reconstruction.
- 16-year proper-time transfer, target 1.2g main burns, 0.5c effective exhaust nominal; 12 km/s direct arrival allowance plus 1.025 km/s hydrogen terminal budget at an unproven 1,800 s Isp.
- All systems land permanently, except deployed scouts. Conservatively, the 450 kg scout allocation and all food/waste mass remain in the retained-mass calculation. No staging or expelled-waste savings are credited.
- 6 months of surface commissioning food included. Later food and all locally produced expansion rely on the assumed industrial/agricultural capability and accessible local resources. The 600 t local regolith substrate is excluded from carried mass.

## Component ledger

All entries below are tonnes. Hardware margins are separate. Quantities and assumptions are recorded per row in `mass-budget.json`; low/base/high are simultaneous design sensitivities, not statistical confidence bounds.

| Carried system | Low | Base | High |
|---|---:|---:|---:|
| Habitat pressure membranes, insulation and restraint | 78.037 | 130.062 | 234.111 |
| Folding composite floors | 40.715 | 73.287 | 122.145 |
| Habitat deployment frames, hatches and cabin partitions | 30.000 | 50.000 | 90.000 |
| Hubs, bearings, spin motors and balance equipment | 12.000 | 24.000 | 45.000 |
| Cabins, wardrooms, lounge, hygiene and exercise fittings | 12.000 | 22.000 | 38.000 |
| Service spine, engine mounts and attachment structure | 30.000 | 55.000 | 100.000 |
| Landing supports, restraints and habitat transport covers | 20.000 | 38.000 | 75.000 |
| Forward dust/gas shield stack and supports | 66.000 | 132.000 | 330.000 |
| Crew refuge radiation shielding | 15.000 | 30.000 | 70.000 |
| Direct and hydrogen-thermal engine hardware | 35.000 | 80.000 | 180.000 |
| Main antimatter storage and cryogenic hardware | 40.000 | 120.000 | 350.000 |
| Rigid 36-person descent refuge and airlocks | 12.000 | 22.000 | 40.000 |
| Redundant life support and water/waste processing | 15.000 | 28.000 | 50.000 |
| 36 torpor beds, medical systems and embryo storage | 14.000 | 27.000 | 50.000 |
| 10 MWe power conversion, distribution and startup storage | 20.000 | 40.000 | 85.000 |
| Service/surface radiators and heat-recovery loops | 58.722 | 93.955 | 164.421 |
| Avionics, navigation, communications and sensors | 4.000 | 8.000 | 16.000 |
| Advanced fabrication, chemistry and resource-processing seed | 30.000 | 65.000 | 150.000 |
| Inflatable farm, eight bays and 2,000 m2 crop hardware | 12.000 | 25.000 | 50.000 |
| Reused pressurised rover module, chassis and 7-day stores | 6.000 | 10.000 | 18.000 |
| Repair stock, tools, EVA suits and replacement units | 15.000 | 35.000 | 75.000 |
| Initial habitat atmosphere and gas makeup | 23.168 | 26.168 | 33.168 |
| Water/oxygen-cycle buffers and process starting inventory | 15.000 | 25.000 | 45.000 |
| Dry food plus food packaging, 16 years + 6 months commissioning | 166.407 | 190.273 | 229.976 |
| Medical, hygiene, nutrient and general consumables | 12.000 | 25.000 | 50.000 |
| Atmosphere, water and process tank hardware | 5.000 | 10.000 | 20.000 |
| 36 crew and personal effects | 3.240 | 3.600 | 4.320 |
| Remote exploration complete allocation | 0.450 | 0.450 | 0.450 |
| Surface and transit power antimatter plus matching matter | 0.002 | 0.002 | 0.002 |
| Thermal hydrogen tank and insulation | 4.704 | 14.281 | 72.749 |
| Engine hot radiator system | 2.474 | 83.455 | 1,224.331 |
| Hardware development mass allowance | 86.648 | 304.010 | 1,459.903 |
| Unburned direct propulsion reserve, matter + antimatter | 98.850 | 200.092 | 611.557 |

The nominal final hardware is 1,520.1 t, including 304.0 t hardware development allowance. Crew and retained consumables account for 270.5 t; unused direct-propulsion reserve is 200.1 t. The final retained mass is therefore 1,990.6 t. This is **not a dry-mass figure**: it includes consumables and an unused matter/antimatter reserve.

Main antimatter storage is assigned 40/120/350 t hardware, while carrying roughly 1,038/2,101/6,421 t antimatter in the corresponding cases. This mismatch cannot be resolved by a mass allowance: no bulk containment design or mass-capacity scaling law has been demonstrated. Storage feasibility is a central missing technology.

## Fuel and phase accounting

| Quantity | Low | Base | High |
|---|---:|---:|---:|
| Departure mass | 3,019.207 t | 6,111.491 t | 18,679.033 t |
| Final retained mass | 983.416 t | 1,990.635 t | 6,084.136 t |
| Thermal hydrogen loaded/consumed | 58.795 t | 119.012 t | 363.747 t |
| Direct antimatter consumed | 988.498 t | 2,000.922 t | 6,115.575 t |
| Propulsion antimatter loaded including reserve | 1,037.923 t | 2,100.968 t | 6,421.354 t |
| Matching ordinary matter loaded | 1,037.923 t | 2,100.968 t | 6,421.354 t |

The propulsion antimatter quantity is separate from the **1 kg surface-power bank**. Transit electrical generation adds 14.0 g antimatter plus matching matter at a 2 MWe allocation over 16 years and 40% conversion. The nominal hydrogen heater consumes only 0.206 g antimatter plus equal ordinary matter under its 50% heating-efficiency assumption. The large antimatter requirement comes from interstellar momentum, not surface electricity or hydrogen heating.

The nominal phase masses are:

| Event | Spacecraft mass, tonnes |
|---|---:|
| departure | 6,111.491 |
| after acceleration | 3,590.839 |
| before interstellar braking | 3,590.839 |
| after interstellar braking | 2,109.817 |
| after direct arrival braking | 2,109.648 |
| after hydrogen touchdown | 1,990.635 |

Let eta be the solved rapidity for each symmetric interstellar burn, f the effective direct exhaust fraction of c, and vH = Isp * g0. Then:

```text
RH = exp(1025 / vH)
RD = exp(2 * eta / f + 12000 / (f * c))
Mdeparture = RD * RH * Mlanded
burned direct propellant = (RD - 1) * RH * Mlanded
unburned direct reserve = 0.05 * burned direct propellant
thermal expended mass = (RH - 1) * Mlanded
```

Direct annihilation uses equal antimatter and ordinary rest mass; the effective exhaust includes directedness and losses. For hydrogen heating, AM/H2 = vH^2 / (4 * etaHeat * c^2), with etaHeat = 0.5. Hydrogen, heating antimatter and its matching matter sum to the thermal expended mass. The 5% direct reserve is retained and counted once; it is not fictitiously burned during the nominal trajectory. Surface handling or disposal of the remaining roughly 100 t antimatter is unresolved and is a reason to revisit reserve policy before an actual landing design.

The 16-year transfer calculation covers the ideal interstellar trajectory. The extra arrival operations require either using explicit time contingency within 16 years or increasing peak speed slightly; the present fuel allowance is not an integrated 16-year landing trajectory.

## Heat, acceleration and mass feedback

At nominal departure mass, 1.2g requires 71.92 MN initial thrust and 43.12 PW annihilation power. Intercepting only 10^-7 of that power still deposits 4.312 GW. A 0.9-emissivity hot loop at 1,500 K requires 16,691 m2 emitting area; a separate 10 MWe service/surface model at 600 K and 330 K requires 23,489 m2, including a 25% area allowance. The nominal total is **40,180 m2 emitting area**, not panel planform area. Two emitting faces could reduce panel planform, provided both have suitable views; the original 16,896 m2 geometric emitter is insufficient for these assumptions.

Engine radiator areal masses of 3/5/8 kg per emitting m2 and interception fractions of 10^-8 / 10^-7 / (3 * 10^-7) are explicit futuristic assumptions. They are not current material or engine specifications. Heat recovery is credited only by retaining the common 10 MWe load model; it is not counted as eliminating final heat rejection. Radiator temperature, surface/space view, plumbing, deployment, gamma/neutron transport and coolant qualification are unresolved.

The larger radiator adds mass, requiring more propellant and initial thrust, which increases intercepted heat. The calculation solves that feedback:

```text
Mlanded = B / (1 - kTank - kHotRadiator - kReserve)
```

B is fixed hardware with its development allowance plus crew/consumables. The other coefficients express mass per landed tonne. Nominal coefficients are 0.00897 tank, 0.05240 hot-radiator and 0.10052 reserve. The nominal critical interception fraction is **1.70 * 10^-6**: above that, these radiator/engine assumptions have no finite solution at 1.2g. This is an algebraic model limit, not a physical feasibility boundary independent of the assumptions.

At 0.3c effective exhaust, the nominal resized planning case rises to 18,769 t departure and 3,008 t retained, carrying 8,180 t propulsion antimatter. The combined high case has a negative feedback denominator and is reported as having **no finite solution**, rather than assigned an invented mass.

## Food, materials and uncertainty

Food uses the NASA 2018 baseline historical dry-food value of 0.617 kg/person/day and the 0.26 kg/person/day nominal packaging example from its waste table. With 36 people for 16.5 years, this is 190.3 t. No lower torpor metabolism is credited. Low packaging of 0.15 kg/day assumes future bulk packaging; high dry-food demand of 0.75 kg/day and packaging of 0.31 kg/day are planning sensitivities. These values do not validate 16-year food or pharmaceutical shelf life. [NASA Life Support Baseline Values and Assumptions Document, tables 4-43 and 4-57](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf)

Water and oxygen recovery are assumed regenerative; carbon/waste is retained and oxygen regenerated from CO2, rather than quietly venting mass between burns. Initial stocks are not a 16-year open-loop supply. Contamination, leakage, nutrient and brine closure still require a chemical inventory.

Membrane assumptions of 6/10/18 kg/m2 and folding-floor assumptions of 10/18/30 kg/m2 describe advanced areal-mass targets. They need pressure, puncture, creep, fire, acoustic, load and repeated deployment qualification. NASA's comparison of TransHab and BEAM illustrates that deployed inflatable volume does not make the enclosure mass negligible; its volumetric numbers are not used as coefficients here. [NASA Artificial Gravity Concept Feasibility Study](https://ntrs.nasa.gov/api/citations/20190000843/downloads/20190000843.pdf)

The 50/100/250 kg/m2 dust-shield scenarios give 66/132/330 t before separate crew shielding. No one of these is demonstrated adequate at 0.26c. A credible shield design could require much more mass, a different architecture or a lower speed.

Local fabrication, full medical repair capability and suitable resources remain accepted mission assumptions. The 65 t factory and 25 t farm starter allocations are not demonstrations of complete industrial independence. Population growth after landing needs expansion, reserve food and medical production before births and later childhood needs become limiting.

## Reproduction and checks

```powershell
python -m calculations.mass_budget
python -m unittest discover -s tests -v
```

`build_budget()` returns the complete ledger without writing files. Running the script regenerates `mass-budget.json` and the component ledger in `spacecraft_layout.json`. Six tests verify species/rest-mass conservation, phase accounting, component reconciliation in all three scenarios, no torpor food discount, temperature/power sizing inputs and detection of a non-closing high-mass 0.3c case.
