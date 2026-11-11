# 300-tonne dry-mass allocation, food plant and relay chain

10 November 2026. Reproduce with `python -m calculations.mission_300_trade`.
Detailed calculation: `mission-300-trade.json`; full ledger: `mission-300-ledger.csv`.

The working case is **297.473 t dry**, including a **15% hardware development
allowance**, leaving **2.527 t** below a 300 t cap. This is a design-to allocation,
not a demonstrated feasible spacecraft mass. Physical shielding, structural,
medical and antimatter-system requirements may exceed their allocations.

## Final occupancy policy

| Phase | Awake | Torpid |
| --- | ---: | ---: |
| Departure acceleration | 8 | 24 |
| Coast | 8 | 24 |
| Arrival/interstellar braking | 8 | 24 |
| Descent | 32 | 0 |

All 32 retain protected berths and descent restraint positions. Common rooms
are sized for eight during transit. The rigid descent refuge remains; waking
everyone for descent does not require months of all-awake accommodation.
Recovery must begin early enough for descent duties; awake-phase duration and
medical recovery requirements are not yet solved. Surface provision supports
32 awake. Earlier reports assuming everyone awake during burns are superseded
by this policy. Historical trajectory fields explicitly named
`if_all_awake_during_burns` remain comparisons, not the selected roster.

## What the allowance means

System hardware is allocated **258.281 t**, plus 0.450 t fixed scout payload.
The 15% allowance adds **38.742 t**, making 297.473 t. It is a budgeting reserve
for equipment heavier than estimated; it is not an installed component and
does not reduce the equipment's physical mass when lowered.

| Allowance | Reserve | Dry total, same hardware |
| --- | ---: | ---: |
| 25% | 64.570 t | 323.301 t |
| 20% | 51.656 t | 310.387 t |
| 15% working planning case | 38.742 t | 297.473 t |
| 10% | 25.828 t | 284.559 t |

The earlier 294.551 t/25% case also assumed cruise engine 25→20 t and bulk
containment 38→20 t. Those cuts were unsupported engineering allocations.
The working 15% case **retains the 25 t engine and 38 t containment**. Reducing
reserve is accepting uncertainty; it is not evidence these speculative systems
can actually be built at the retained masses. A uniform 15% reserve is especially
weak for a concept whose major technologies are not engineered.

## Food demand, formulation and process size

Planning assumptions: 70 kg representative person; awake intake 2,500 kcal/day;
torpid intake 1,500 kcal/day (60%); 84 g protein/person/day in either state;
30% of calories from fat. These are design assumptions, not a prescribed medical
regimen. Coma is not equivalent to validated metabolic suppression. ESPEN
[clinical guidance](https://academy.espen.org/files/ESPEN-Guidelines/ESPEN_practical_and_partially_revised_guideline_Clinical_nutrition_in_the_intensive_care_unit.pdf)
favours measured energy expenditure; simple 20-25 kcal/kg/day estimates are
fallbacks, not evidence for a safe decades-long torpor treatment.

`8*2500 + 24*1500 = 56,000 kcal/day` during transit, or **2.712 kW** of chemical
food energy. Forty/eighty percent torpid-energy sensitivity gives 44,000/68,000
kcal/day. Descent and a fully awake settlement require **80,000 kcal/day**.

Transit formulation:

- Protein: `32*70*1.2 = 2,688 g/day`, supplying 10,752 kcal.
- Fat: `56,000*.30/9 = 1,866.7 g/day`, supplying 16,800 kcal.
- Digestible carbohydrate: `(56,000-10,752-16,800)/4 = 7,112 g/day`.

Illustrative microbial biomass composition is 65% protein, 10% lipid, 15%
digestible carbohydrate and 10% other matter. Actual organism composition,
digestibility, amino acids, purines and essential fats require analysis. It gives:

| Production branch | Transit daily output |
| --- | ---: |
| Protein-rich microbial biomass | 4.135 kg |
| Additional digestible carbohydrate | 6.492 kg |
| Additional lipid | 1.453 kg |
| Total solids including other biomass matter | 12.080 kg |

Do not multiply biomass by 4 kcal/g: its protein, lipid, digestible carbohydrate
and other matter have different energy contributions. Slurry avoids drying,
reconstitution and elaborate food preparation; it does not eliminate protein,
essential fatty acids, vitamins, minerals, tolerability or sterile processing.

Candidate process:

1. Recover CO2, nitrogen, minerals and water from crew waste through the life
   support/material-recovery system. Water is assumed 100% recovered. Eventual
   nutrient closure remains an enabling assumption, not a demonstrated process.
2. Electrolyse recovered water; use hydrogen/reducing power for carbon fixation.
3. Produce protein biomass with hydrogen-oxidising organisms; harvest/process
   it into digestible, controlled-purine material.
4. Convert CO2-derived intermediates into starch/carbohydrates using a chemical/
   enzyme pathway. As a stoichiometric screen:
   `6CO2 + 12H2 -> C6H10O5 + 7H2O`.
   The 6.492 kg/day starch-equivalent branch alone requires at least 10.58 kg/day
   CO2 and 0.962 kg/day hydrogen before reaction/energy losses.
5. Produce lipid using an acetate-fed organism/process, with a separate provision
   for essential fatty acids and micronutrients. A reported fuel-lipid process
   is not by itself a nutritionally complete edible-fat process.
6. Mix aseptically into feed slurry; provide ordinary texture/flavour for awake
   crew using small processing equipment. Maintain protected cultures and
   catalyst/enzyme renewal capability.

Primary research supports the constituent routes, not a complete space-qualified
diet plant: [Cai et al., starch from CO2](https://pubmed.ncbi.nlm.nih.gov/34554807/),
[Hu et al., gas-to-lipid bioprocess](https://pubmed.ncbi.nlm.nih.gov/26951649/),
[electromicrobial thermodynamic constraints](https://pubmed.ncbi.nlm.nih.gov/35265598/).

For sizing, explicitly assume sustained productivities of 0.5 g/L/h biomass,
0.25 g/L/h carbohydrate and 0.1 g/L/h lipid, at 80% productive availability.
These are sensitivity inputs, not universal measured food-grade process rates.

`V_L = output_kg_per_day*1000/(productivity_g_per_L_h*24*0.8)`

| Branch | Working volume for one coast-duty train |
| --- | ---: |
| Protein biomass | 431 L |
| Carbohydrate | 1,352 L |
| Lipid | 757 L |
| Total | 2,540 L |

Install two such trains. One supports transit, the other can be cleaned, serviced
or kept ready. Both together cover the fully awake settlement; neither alone
covers the full 80,000 kcal/day. Corresponding surface operating volume is about
3,832 L across the branches. This assumes variable/modular working volumes; a
fixed-fill reactor train may require more water. The one-tonne edible reserve
covers short production interruptions and descent; one all-awake day needs
approximately **17.08 kg** of this assumed solids formulation. Descent duration
is not assumed to be one day; this is a per-day buffer-sizing unit.

The flow calculation calls for **5 t working water**, including roughly 1 t
outside production vessels, rather than retaining the previous uncalculated 3 t
guess. This adds no annual replacement-loss reserve. Higher demonstrated
productivity could reduce it; auxiliary reactors and cleaning hold-up could
increase it. Process liquid is not counted as dry factory hardware.

Power: ideal chemical output is 2.712 kW. At 5-15% electrical-to-food efficiency,
synthesis requires 54.2-18.1 kW before additional plant operations. Allocate
125 kW electrical including auxiliaries; this is a load target, not measured
complete-process performance.

### Does the maths establish a minimum factory mass?

No. It establishes output, power and volume under stated assumptions. Hardware
mass also depends on pressure, safety, purification, auxiliary stages, redundancy,
enzyme life, materials, heat transfer and a complete bill of materials.

A cylindrical/hemispherical vessel screen, each cylinder length four radii,
0.3 MPa gauge pressure, 100 MPa allowable stress, 0.85 joint efficiency and 2 mm
minimum stainless wall, gives about **242 kg bare primary shells per train**.
This omits gas reactors, mixers, cleaning, jackets, openings, supports and safety
equipment. It is a component screen, not a factory minimum.

Cai's reported 22 nmol CO2/min/mg catalyst rate corresponds arithmetically to
about **9.5 kg active catalyst per coast-duty starch branch at 80% uptime**.
It does not establish catalyst lifetime, selectivity, auxiliary catalyst mass or
the ability to sustain that rate for years.

Working **3 t dry food-factory allocation**, before the ship's allowance:

| Equipment | kg |
| --- | ---: |
| Two trains' primary vessels and jackets | 600 |
| Electrolysis/gas conditioning | 250 |
| Carbon-intermediate and enzyme hardware | 400 |
| Harvesting/slurry processing | 300 |
| Pumps, valves and heat exchange | 300 |
| Cultures and micronutrient modules | 200 |
| Controls/analysis | 100 |
| Enclosure, frames and mounts | 550 |
| Cleaning/sterilisation | 300 |
| Total | 3,000 |

This is a concrete smaller target to engineer, not a proven minimum. In particular,
the gas-synthesis, catalyst-renewal and full nutrient-recovery stages need their
own mass/flow designs. The 3 t factory excludes water, the separate 1 t food-loop
inventory, edible reserve, shared power/cooling and medical feed equipment.

## Spares, tools and suits: 3 t instead of 10 t

| Function | kg |
| --- | ---: |
| Four lightweight suit systems and support/spare components | 600 |
| Common tools | 400 |
| Critical mechanical spare units | 700 |
| Repair/fabrication feedstock | 1,000 |
| Hoses, seals and thermal repairs | 300 |
| Total | 3,000 |

This assumes limited simultaneous EVA and extensive repair/commonality. It is
not a reliability demonstration for 20 years. Dedicated electronics spares are
inside avionics; medical equipment is inside the medical allocation. No second
copy is added here. The separate general-consumables line remains 8 t.

## Navigation, communications and avionics: 750 kg

This includes sensing position/attitude, flight computers, control interfaces,
instrumentation, wiring and communications. Relays replace none of the navigation
or survival-control functions.

| Equipment | kg |
| --- | ---: |
| Flight computers | 36 |
| Star trackers | 8 |
| Inertial units | 20 |
| Navigation cameras | 16 |
| Docking lidar | 20 |
| Optical terminals | 70 |
| Local/backup radios | 40 |
| Flight controllers/interfaces | 120 |
| Harness | 150 |
| Displays/instrumentation | 100 |
| Electronics spares | 70 |
| Enclosures, fault isolation and EMI protection | 100 |
| Total | 750 |

These are itemised allocations, not procured flight-unit masses. Keep an
independent survival communication capability; its actual range/link budget is
not proven by assigning 70 kg to terminals.

## 200 relays, wide thin receivers, 100 kg all-up cap

Added to `exploration_manifest.json` as a separate proposed system. Receivers
are deployable diffractive/reflective membranes focusing narrowband light onto a
detector. They need optical support, focus and pointing; a large plain sheet is
not itself a useful optical receiver. NASA has investigated
[thin-film diffractive communications optics](https://techport.nasa.gov/projects/17846);
its [communications survey](https://www.nasa.gov/smallsat-institute/sst-soa/soa-communications/)
also explains the aperture/pointing trade.

Choose 200 nodes at nominal 0.4 kg all-up each plus a 5 kg dispenser. Across
4.2465 light-years, 201 equal hops are **1,336 AU / 7.72 light-days** each.
CubeSat-class here means sub-kilogram nodes, not standard fully equipped 1U
CubeSats with demonstrated performance at these distances.

Assume 0.5c effective exhaust, release at the ship's peak rapidity 0.213636,
then brake to rest in the chosen barycentric frame:
`m_initial/m_dry = exp(0.213636/0.5) = 1.53307`.

- Nominal dry hardware per node: **260.9 g**.
- Combined braking matter/antimatter across nodes: **27.817 kg**, half antimatter.
- Node dry hardware plus dispenser: **57.183 kg**.
- 15% dry hardware allowance: **8.577 kg**.
- Total including braking fuel and allowance: **93.577 kg**, under the 100 kg cap.

These close a mass *allocation*, not feasible 261 g antimatter-powered hardware.
It must include receiver support, optics, detector, transmitter, controls,
braking engine, containment, independent long-life power, thermal control and
stationkeeping. No subsystem mass closure is claimed.

Ideal diffraction-screen assumptions: 1 W optical transmitter, 5 cm transmitting
aperture, 1,550 nm wavelength, 20% lumped optical/detection efficiency:

`photons/s = 0.2*P*(pi*Dtx*Drx/(4*lambda*R))^2/(h*c/lambda)`

| Receiver diameter | Detected photons/s | Screening bit/s at 10 photons/bit | Bare 1 micrometre film | Bare 0.25 micrometre film |
| --- | ---: | ---: | ---: | ---: |
| 1 m | 0.025 | 0.0025 | 1.1 g | 0.27 g |
| 5 m | 0.627 | 0.0627 | 27.5 g | 6.9 g |
| 10 m | 2.507 | 0.251 | 110 g | 27.5 g |
| 20 m | 10.030 | 1.003 | 440 g | 110 g |

Bare-film figures assume 1,400 kg/m³ polymer. Coatings, booms, focus optics and
deployment are excluded. A **20 m, 0.25 micrometre membrane** is the nominal
proposal, explicitly unqualified; it leaves only about **151 g per node** for
everything other than the bare film. A 1 micrometre 20 m film exceeds the whole
dry-node allocation before any hardware is added.

The bit figures are a photon-budget screen, not coding performance, capacity or
a validated noise-limited link. They exclude pointing error, backgrounds, focal
spot coupling, acquisition, Doppler, two-way/half-duplex duty and outages.
Larger transmitting apertures also help; the membrane need not forever be
limited to reception, but transmitter-quality wavefront/focus requires engineering.

At 1.2g, a coast-release node takes about **63 proper days and 0.01849 ly** to
stop: nearly one hop. Release must precede the desired final station. Early and
late deployment phases need different solved trajectories. Nodes do not remain
fixed relative to Earth's orbit; gravity and transverse motion require navigation.
The first node can already be old when the final node arrives. Barely powering
a receiver for decades is another requirement: even 1 W for 20 years is 175 kWh,
so an ordinary tiny battery does not suffice. No interstellar solar-power credit
is assumed. No energy/fuel for actual node electrical loads has been sized;
remaining cap alone is not evidence that its converter/containment will fit.

At 99.9% individual mission survival, all 200 survive with probability only 81.9%.
Bypass paths, spare nodes and a fallback link are needed. Propagation time remains
at least **4.2465 years one way**; relays improve signal strength, not causality.

## Radiator sizing and material mass

Use `A_emitting = Q/(emissivity*sigma*T^4)`, emissivity 0.9. Emitting area counts
both faces separately; for two unobstructed faces panel planform is half that.
No extra factor of two is hidden in the mass conversion.

The reduced electrical-load target is **1.2 MWe**: food 125 kW; habitat/medical
150; life support 200; containment/cryogenics 300; computing/comms 20; robotics
50; distribution 80; operating margin 275. These reductions need a real load
audit and are not an automatic consequence of having fewer awake people.

At 40% conversion, conversion waste heat is 1.8 MW; electrical loads ultimately
produce another 1.2 MW. No net credit for heat reuse is assumed.

| Loop | Heat | Temperature | Emitting area | Two-sided panel area | Allocated installed mass |
| --- | ---: | ---: | ---: | ---: | ---: |
| Conversion | 1.8 MW | 600 K | 340 m² | 170 m² | 0.680 t |
| Loads | 1.2 MW | 330 K | 2,478 m² | 1,239 m² | 4.957 t |
| Engine reference load | 938.6 MW | 1,500 K | 3,633 m² | 1,816 m² | 10.899 t |

Service areas include 25% area allowance. Installed targets are 2 kg per emitting
m² service and 3 kg per emitting m² hot, equivalently 4/6 kg per two-sided
planform m². They include an allocation for pipes, fluid, supports and deployment;
they are not demonstrated complete-system densities.

NASA's [carbon-carbon radiator work](https://ntrs.nasa.gov/citations/20080048181)
targeted roughly 2-2.2 kg/m² in the 500-1,000 K range. That does not qualify a
1,500 K radiator or automatically cover every installed component. Source area
conventions must be reconciled before using a quoted panel density.

The hot loop deliberately keeps the existing reference heat load instead of
claiming another propulsion-mass saving. Its 10.899 t target saves 7.266 t
against 18.164 t; service loops save 6.107 t against 11.744 t. Combined radiator
mass is **16.536 t**, versus 29.909 t previously.

The reference hot load still assumes only 1e-7 of annihilation power is absorbed.
Engine/shadow-shield heating may invalidate this assumption. Planetary view
factors, coolant lifetime, punctures, deployment and required cold-stage lifts
remain unresolved; see `SHIELDING_ASSESSMENT.md`.

## Bulk storage, cryogenics and structure

Possible storage improvements are a common vacuum enclosure, staged thermal
shields, low-conductance supports, lighter coils and common backup cryocoolers.
Higher-temperature superconductors can ease coil cooling, but do not eliminate
the much colder trapped-particle requirement. CERN's
[laser cooling research](https://www.nature.com/articles/s41586-021-03289-6)
reaches antihydrogen energy scales corresponding to about 50 mK; current
[production results](https://home.cern/breakthrough-antimatter-production/) are
microscopic, not validation of bulk storage.

For refrigeration, even the ideal minimum is
`W >= Q_cold*(T_hot/T_cold - 1)`.
At 300 K hot/4 K cold, each watt leaking into the cold stage needs at least
74 W input, and substantially more in practice. Cold-stage heat leaks, field,
geometry, particle species/density, quench containment and redundancy must be
specified before deriving mass. Neither 38 t nor 20 t is an established storage
mass. The working case retains **38 t**, and retains the **25 t cruise engine**.

Other explicit targets, before the allowance:

- Bearings/drives/balancing **6→5 t**: one balanced rotor, smaller equipment,
  duplicated controls. A load/bearing/seal design is still needed.
- Habitat frames/partitions/hatches **8→5 t**: two simple pods and shared
  partitions. Pressure hatches, access and fire boundaries remain included.
- Settlement frame/services **8→5 t**: common load paths and direct mounts.
- Landing supports/restraints/covers **10→6 t**: compact packed loads and common
  restraints; ground pressure, stability and landing loads determine feasibility.
- Flight frame **12→8 t**: fewer unused bays; required engine radiation
  stand-off is not proven shorter by this allocation.
- Refuge **6→4.5 t**: retain 32 awake descent places and restraints; no deletion
  based on the normal torpor roster.

No finite-element or detailed bearing/landing calculation is supplied. These
are design-to allocations, not specific savings established by material strength.
The full ledger below retains the 31 t dust shield and 40 t crew-shield provision;
neither has a demonstrated adequate protection performance.

## Complete dry and supply ledger

The following table is generated from the calculation. Previous means the
400.258 t/25% study; all fuel is excluded, except that the relay's separate
100 kg all-up cap is checked including its braking fuel. That fuel is not in
the ship dry total. Scout payload keeps its fixed allocation without added margin.

| Item | Previous t | Working target t |
| --- | ---: | ---: |
| Habitat pressure membranes, insulation and restraint | 5.887 | 5.887 |
| Folding composite floors | 2.016 | 2.016 |
| Habitat deployment frames, hatches and cabin partitions | 8.000 | 5.000 |
| Hubs, bearings, spin motors and balance equipment | 6.000 | 5.000 |
| Cabins, wardrooms, lounge, hygiene and exercise fittings | 3.000 | 2.000 |
| Settlement delivery frame and surface services | 8.000 | 5.000 |
| Landing supports, restraints and habitat transport covers | 10.000 | 6.000 |
| Forward dust/gas shield stack and supports | 31.000 | 31.000 |
| Total modular polyethylene berth/shelter shielding provision | 40.000 | 40.000 |
| Hydrogen-heated touchdown assembly | 10.000 | 8.000 |
| Touchdown antimatter isolation hardware | 2.000 | 1.500 |
| Rigid 32-person descent refuge and airlocks | 6.000 | 4.500 |
| Redundant life support and water/waste processing | 10.000 | 8.000 |
| 32 torpor beds, medical systems and embryo storage | 11.000 | 9.500 |
| 2 MWe conversion, distribution and backup allowance | 6.000 | 4.500 |
| Service/surface radiators and heat-recovery loops | 11.744 | 5.637 |
| Avionics, navigation, communications and sensors | 2.500 | 0.750 |
| Advanced fabrication, chemistry and resource-processing seed | 15.000 | 12.000 |
| Reused pressurised rover module, chassis and7-day stores | 3.500 | 2.500 |
| Repair stock, tools, EVA suits and replacement units | 10.000 | 3.000 |
| Initial habitat atmosphere and gas makeup | 2.000 | 2.000 |
| Water/oxygen-cycle buffers and process starting inventory | 3.000 | 5.000 |
| One tonne spare edible food plus packaging | 1.020 | 1.020 |
| Medical, hygiene, nutrient and general consumables | 8.000 | 8.000 |
| Atmosphere, water and process tank hardware | 2.000 | 1.500 |
| 32 crew and personal effects | 2.880 | 2.880 |
| Two surface micro-rovers | 0.030 | 0.030 |
| Redundant microbial/chemical full-diet food factory and small garden | 10.000 | 3.000 |
| Food-loop startup and circulating material inventory | 1.000 | 1.000 |
| Cruise engine standoff and support frame | 12.000 | 8.000 |
| Interstellar magnetic nozzle and cruise engine | 25.000 | 25.000 |
| Bulk cruise antimatter containment and cryogenics | 38.000 | 38.000 |
| Space scouts, microlanders and their support allocations | 0.420 | 0.420 |
| Separation interfaces and independent service isolation | 2.000 | 1.500 |
| Direct-engine hot radiators | 18.164 | 10.899 |
| Touchdown hydrogen tank hardware | 1.035 | 1.035 |
| Spin booms and pod balance attachments | 4.000 | 3.000 |
| Pressurised transfer tunnels and flexible interfaces | 2.000 | 1.500 |
| Packed surface expansion starter | 4.000 | 3.000 |
| 200-node relay dry hardware and dispenser | 0.000 | 0.057 |
| Hardware development allowance (15%) | 79.962 | 38.742 |

Dry hardware including allowance: **297.473 t**. Supplies and people: **19.900 t**. Combined non-fuel total: **317.373 t**.

Verification: 18 focused tests check nutrient energy accounting, branch flow/volume, descent occupancy exception, radiator heat balance and face conventions, relay fuel/hardware cap, component totals and mass-ledger closure. They do not validate the assumed medical, structural, production or radiation performance.
