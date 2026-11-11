# Compact ship mass and accommodation audit

Historical comparison. The current occupancy policy and 300 t planning allocation
are in [MISSION_300_TRADE.md](MISSION_300_TRADE.md); everyone is now awake only
for descent, rather than throughout the main burns.

10 November 2026. All masses are metric tonnes unless stated otherwise.

Recommendation: investigate two single-deck, continuously pressurised rounded
rims instead of two three-deck discs. Keep the current outside radius, 32 medical
berths, independent pressure isolation and essential machinery. Share the rooms
used by the eight normally awake people, and carry packed surface expansion
modules. A modelled first target is **1,234 t departure / 338 t landed**, compared
with **1,330 t / 376 t** now. These are conditional planning numbers, not a
qualified spacecraft mass prediction.

This report is a trade study; it does not change the viewer or selected layout.
Reproduce the calculations with `python -m calculations.compact_ship_audit`. Detailed ledgers
are in `compact-ship-audit.json`. The existing engine-reuse mass solver recalculates
propellant, hydrogen tanks, hot radiators and development allowance for each case.

## Accounting boundary and assumptions

- Same 32 people, 20 onboard years, approximately 0.2104c peak speed, 0.5c
  effective exhaust velocity and current arrival/staging assumptions.
- Eight awake and 24 in torpor during coast. All 32 awake during the two roughly
  63-day burns; the smaller accommodation must support them for months, not
  merely an emergency evacuation. All 32 retain a convertible sleeping/medical berth.
- Torpor gets **no food, oxygen, water-throughput or radiation-protection credit**.
  SpaceWorks/NASA torpor studies motivate the architecture, but do not establish
  that the proposed decades-long repeating human regimen is safe. NASA-hosted
  [research priorities](https://science.nasa.gov/wp-content/uploads/2023/05/194_4ed6e97e79c39f2f69c20b8a5d320550_GRIKOYURI.pdf)
  call for fundamental investigations; the
  [NIAC study](https://ntrs.nasa.gov/citations/20180008683) is conceptual.
- Hardware carries the existing 25% development allowance. Stocks and people do
  not. That allowance is not a substitute for omitted systems or shielding.
- Departure is assembled in space. Earth launch, antimatter production,
  launch/assembly hardware and infrastructure are excluded.
- The current viewer previews cruise-engine reuse with late release, whereas
  the root selected-budget report also preserves the older independent descent
  engine architecture. This audit reproduces the viewer's current masses exactly.

## Current mass breakdown

Hardware entries below exclude their development allowance. Propellant includes
both matter and antimatter; do not add the antimatter again.

| Item at departure | t |
| --- | ---: |
| Habitat envelopes, floors, frames, bearings and fittings | 97.22 |
| Flight and settlement support frames | 30.00 |
| Landing supports, restraints and transport covers | 20.00 |
| Dust shield and crew radiation-shield allowance | 42.16 |
| Cruise/touchdown engines and antimatter containment | 75.00 |
| Rigid refuge and airlocks | 9.45 |
| Life support, medical systems and process tanks | 32.00 |
| Electrical conversion and service radiators | 17.74 |
| Avionics, navigation and communications | 4.00 |
| Settlement fabrication/resource-processing seed | 30.00 |
| Food factory | 10.00 |
| Pressurised rover | 6.00 |
| Spares, tools and EVA suits | 15.00 |
| Separation interfaces | 2.00 |
| Calculated hot radiators and hydrogen tanks | 19.20 |
| **Hardware subtotal before allowance** | **409.78** |
| Hardware development allowance | 102.45 |
| People, stocks and scout payloads | 44.70 |
| Propulsion matter + antimatter, including correction reserve | 764.65 |
| Touchdown hydrogen | 8.62 |
| **Departure total** | **1,330.20** |

Propulsion antimatter alone is **382.32 t**, plus the same mass of matching matter.
The separate electrical-power stock is already within the 44.70 t stocks entry.
The dry/stock/release mass is not synonymous with the landed mass.

The 44.70 t comprises 11.014 t habitat/factory gas, 16.333 t water/process buffer,
12 t general consumables, 1.020 t edible reserve/packaging, 1 t food-loop
inventory, 2.880 t people/personal effects, 0.450 t scouts and about 0.002 t
electrical-power matter/antimatter. Some inherited component labels still say
36 crew or 10 MWe; their actual calculations use 32 crew and 2 MWe.

Current hardware details: membranes 35.29 t; floors 15.27 t; habitat frames,
hatches and partitions 24 t; bearings/spin equipment 12 t; fittings 10.67 t.
The 75 t propulsion hardware comprises 25 t cruise engine, 38 t bulk containment,
10 t touchdown assembly and 2 t local containment. The 32 t support machinery
comprises 14 t life support, 13 t medical/torpor and 5 t process tanks.

The phase ledger closes as:

| Fate of departure mass | t |
| --- | ---: |
| Direct propulsion consumed | 764.272 |
| Hydrogen consumed | 8.624 |
| Early released equipment and its allowance | 54.170 |
| Late released engine stage, reserve and allowance | 126.833 |
| Retained after touchdown | 376.301 |

The tiny hydrogen-heater matter/antimatter consumption is included in the exact
JSON balance but rounds to zero here. Late release/divert is not a solved safe
landing manoeuvre.

## Accommodation: remove duplicate functions first

The present usable allocation is 484 m² per disc, including its cabins, within
496 m² assumed net per disc. Total net area is 992 m². It is laid out much more
like a permanent 32-person settlement than a transit facility for eight awake
people. The current full-disc gas approximation also pressurises 10,751 m³.

Proposed room changes:

| Current function | Compact treatment |
| --- | --- |
| Sixteen private double cabins | Four 8 m² double cabins shared by the rotating awake couples; personal lockers remain assigned |
| Separate second dining room and pantry rooms | One galley/dining function, split into two small independent stations for isolation |
| Multiple lounges, library, arts/music, learning/conference | Two flexible common rooms with folding furniture and acoustic separation |
| Separate counselling and telepresence rooms | Private use of a cabin/consultation room by schedule |
| Separate mission control and communications | Small control consoles in shared work rooms; emergency controls in both rims |
| Separate science laboratory and clean workshop | One clean bench and modular instruments; industrial work remains outside crew accommodation |
| Large fresh-food gardens | Small morale/fresh-food provision within the existing food-factory allowance; bulk greenhouse space deployed/built on surface |
| Separate oxygen, CO2, water and thermal rooms | Maintainable service bays with partitioned hazards; retain the equipment and isolation valves |
| Multiple dedicated stores | Secured underfloor/perimeter racks with accessible inventory; preserve clear egress |
| Large permanently furnished settlement rooms | Packed expansion modules commissioned after landing |

Retain 32 torpor/ordinary sleep berths: the 24 asleep and eight rotating out of
torpor are not interchangeable with eight beds. Four private double cabins are
extra awake-crew privacy, not the only sleeping accommodation. During burns,
all crew use their convertible berths and stagger meals/exercise. This is a
substantial comfort concession for approximately two months at each end.

Draft shipwide usable programme:

| Function | m² |
| --- | ---: |
| 32 convertible torpor/sleep berths, equipment footprint | 80 |
| Four double cabins | 32 |
| Galley/dining | 24 |
| Lounge/library/learning/arts/telepresence | 32 |
| Exercise/rehabilitation | 24 |
| Medical/recovery/consultation | 24 |
| Hygiene | 12 |
| Control/communications | 12 |
| Life support/water/electrical equipment | 40 |
| Clean workshop/science bench | 20 |
| Two airlocks and suit service | 20 |
| Accessible stores/food reserve | 24 |
| Circulation/berth access/transfer | 64 |
| **Total** | **408** |

This is a space allocation, not a verified floor plan. Bed transfer clearances,
accessible evacuation, acoustics, fire boundaries, equipment maintenance and
all-awake exercise scheduling must fit before selecting it. Keep local medical,
hygiene, controls and life-support isolation in both rims. Eight awake people
does not imply eight people continuously available for watchkeeping.

## Geometry and quantified savings

Use two continuous rounded pressure tori, each with major radius 17 m and tube
radius 2.5 m: outside radius remains 19.5 m. Each has one occupied deck near
18 m radius and an assumed 3 m usable floor width. There are no stacked inner
decks or redundant concentric pressure walls. The unpressurised centre is an
intentional opening, not a gap between occupied rooms. Necessary support and
access structures are separate; they do not enclose an unused full disc.

| Quantity | Current | Candidate |
| --- | ---: | ---: |
| Outside diameter | 39 m | 39 m |
| Occupied decks per wheel | 3 | 1 |
| Gross floor area, both wheels | 1,527 m² | 679 m² |
| Assumed usable floor area | 992 m² | 441 m² |
| Pressure-envelope surface area | 5,881 m² | 3,356 m² |
| Pressure volume | 10,751 m³ | 4,195 m³ |
| Spin for 0.5g at occupied floor | about 5.05 rpm | about 4.98 rpm |

Torus surface area is `count × 4π²Ra`; volume is `count × 2π²Ra²`.
The current 6 kg/m² envelope and 10 kg/m² floor assumptions are retained for an
apples-to-apples sensitivity. They are not validated material specifications.
The torus requires pressure-restraint, rotation, fatigue and deployment analysis.
Remaining net area beyond the 408 m² programme is only 33 m²; this is a tight fit.

Keep the spin radius: shrinking the entire wheel raises rpm for the same gravity.
The present approximately 5 rpm also needs human adaptation/recovery validation;
there is no assumed universally safe rpm threshold. NASA's
[human performance experiments](https://ntrs.nasa.gov/citations/19730003384)
show why radius and rotational tolerance need assessment.

| Component | Current t | Compact target t | Direct reduction t |
| --- | ---: | ---: | ---: |
| Pressure envelopes | 35.29 | 20.13 | 15.15 |
| Floors | 15.27 | 6.79 | 8.48 |
| Habitat/factory gas | 11.01 | 5.56 | 5.45 |
| Frames, partitions and hatches (case B) | 24.00 | 18.00 | 6.00 |
| Fittings (case B) | 10.67 | 6.00 | 4.67 |
| Added surface expansion kit | — | 6.00 | -6.00 |
| Added access/hub integration allowance | — | 2.00 | -2.00 |

The 6 t surface kit is an optimistic **starter allowance**, not an unlimited
settlement habitat. A roughly 100 m² starter expansion should have its own bill
of materials: envelope/restraint, floors, foundations, fittings, connectors,
deployment equipment and repair kit. Initial fill gas must come from retained
gas inventory or verified local production; for example 400 m³ at the existing
70 kPa/293 K assumption uses approximately 333 kg, reducing the 2 t gas reserve.
Surface heating/cooling and life support still consume power. Larger expansion
must be separately budgeted or manufactured locally.

NASA's [BEAM demonstration](https://www.nasa.gov/international-space-station/bigelow-expandable-activity-module-beam/)
is approximately 1.41 t for 16 m³. It demonstrates packaging/deployment, not
that large fully equipped surface rooms are almost massless. The 6 t starter
allowance remains particularly uncertain. Every additional tonne of landed
hardware beyond it adds approximately 3.14 t at departure in this model.

## Other reductions, system by system

1. **Support frame: 30 t total.** Remove genuinely unloaded bays, minimise joints,
   mount cargo directly and share equipment supports. Case C targets the 20 t
   flight frame at 16 t (4 t saving), retaining the 10 t settlement frame.
   Shorter geometry alone does not reduce a fixed mass allowance. Engine/crew
   radiation separation is unresolved: do not shorten a required stand-off just
   to make the picture compact. Attachments, shielding shadows, radiator views,
   balancing, thrust loads and access determine usable spacing.

2. **Landing gear, restraints and covers: 20 t.** A lighter, smaller packed
   settlement can reduce footprint, legs, covers and restraint loads. Case C
   tests 15 t (5 t saving), not a structural sizing result. Recalculate landing
   loads, ground bearing, stability and packed centre of mass before claiming it.

3. **Industrial seed: 30 t.** Distinguish essential mining/water extraction,
   machining, electrical repair and polymer processing from a complete factory.
   Share motors, manipulators, controllers and power supplies; schedule batch
   operation. Case C tests 20 t (10 t saving). The risk is losing the ability to
   construct the very surface habitats, power expansion and replacements that
   justify carrying less. Local resources on Proxima b are assumed, not known.

4. **Rover: 6 t.** Smaller two-seat cab, shorter range and removable/shared
   tools could target 4 t (2 t saving). Keep independent emergency oxygen,
   communications, pressure isolation and a recovery plan. An unpressurised
   utility rover saves more cabin hardware but increases suit dependence and
   limits field work. Reusing the refuge as a cab is an alternative requiring
   docking and load analysis; do not delete it and book the same hull twice.

5. **Rigid refuge: 9.45 t plus 11.16 t radiation allowance.** Share normal berths,
   restraint systems, emergency controls and surface use where practical. Its
   geometry in the drawing is already smaller than the envelope used by the
   budget formula. This is an inconsistency to resolve, not an automatic saving:
   the 32-person endurance, access, seat/bed positions and radiation shielding
   are not sized. No reduction is booked here.

6. **Bearings/spin equipment: 12 t.** A single wheel could remove a bearing/hub
   set, but would reduce independent habitable redundancy, need angular-momentum
   control and probably become larger for the same floor area. Do not assume
   the full 12 t disappears. Two rims are the recommended first trade.

7. **Life support: 14 t; medical/torpor: 13 t; tanks: 5 t.** Smaller room volume
   reduces initial gas and some ventilation/thermal loads, not 32-person waste,
   oxygen and medical demand. Preserve two isolatable processing paths and
   essential local emergency supplies. Consolidate racks and plumbing only after
   a duty/load audit. No hardware reduction booked.

8. **Water: 16.33 t.** Allocate water between working inventory, process needs,
   contamination reserve and shielding. Shared water walls may do two jobs;
   they cannot remove a required accessible process buffer. NASA demonstrated
   [98% recovery of collected water](https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/),
   not a perfectly closed 20-year settlement. For illustration, a 4 kg/person/day
   stream with an unrecoverable 2% loss would require about 18.7 t makeup over
   20 years for 32 people. The selected budget assumes much more complete eventual
   material recovery. No further reduction booked.

9. **Food factory: 10 t, loop inventory: 1 t, emergency diet: 1.02 t.** The
   current factory is already the lowest, unproved target for two full-diet trains.
   Smaller leisure rooms do not reduce its throughput. Keep redundant production
   and protected cultures. The edible tonne lasts only about 50.6 full-crew days
   at the model's 0.617 kg/person/day; it may need increasing, not cutting.
   No metabolic saving from torpor is booked. Large carried crop rooms are
   already absent from the selected staple-food architecture.

10. **Power conversion: 6 t; service radiators: 11.74 t.** The current 2 MWe
    allocation includes 0.5 MW containment, 0.356 MW life support, 0.267 MW
    habitats/medical and 0.25 MW food factory. Eight awake crew cannot justify
    reducing this to one quarter. Insulation, efficient equipment, batch loads
    and temperature-matched heat reuse may reduce it, but demand and sink
    temperatures must be measured/modelled first. No reduction booked. Shared
    hot radiators are another 18.16 t and already recalculate with engine thrust;
    heat recovery does not eliminate ultimate heat rejection.

11. **Cruise engine and containment: 63 t.** Do not equate lower thrust with a
    proven proportional mass saving. The 38 t containment allowance supposedly
    stores hundreds of tonnes of antimatter and is not demonstrated engineering.
    Keep it fixed in these scenarios. Engine shielding/cooling may add much more
    than any proposed cabin saving. The 10 t touchdown assembly and 2 t local
    containment are likewise retained; engine reuse is already in this baseline.

12. **Spares/tools/suits: 15 t; general consumables: 12 t.** Common fasteners,
    pumps, seals, filters, electrical modules and repairable assemblies can reduce
    inventories. Audit failure modes and shelf lives before reductions. Printed
    structure is not a substitute for semiconductors, catalysts, medicines,
    precision bearings or pressure-rated seals. No blanket cut booked.

13. **Avionics/comms: 4 t; separation: 2 t.** Share processors, buses and
    interfaces while preserving independent survival controls. Staging requires
    isolation, release, recontact prevention and disposal hardware. Relatively
    small savings; no numerical reduction without an equipment list.

14. **Scouts: 0.45 t combined.** Already small. Removing all of them loses
    reconnaissance capability for little saving compared with habitat structure.
    No reduction booked. Direct mounts can simplify brackets, but that requires
    a quantified support/deployment allowance.

15. **Shielding: 31 t forward plus 11.16 t refuge allowance.** Neither is a
    demonstrated adequate mass. The [shielding assessment](SHIELDING_ASSESSMENT.md)
    identifies unresolved secondary radiation and shield-cooling loads. Keep both
    fixed for this trade; smaller required shadow geometry might eventually save
    mass, but a safe design could instead increase mass substantially. Inflatable
    rooms still need surface radiation/thermal protection, potentially locally
    placed regolith, equipment and foundations.

16. **Development allowance: 102.45 t baseline.** It falls automatically when
    actual hardware falls. Do not cut its percentage merely to hit a mass target.
    These targets already depend on aggressive, unqualified hardware assumptions.

17. **Mission performance.** Reducing peak speed/accepting a longer voyage can
    reduce propellant, whereas removing fuel without changing the mission cannot.
    This report keeps travel time and engine performance fixed. Crew reduction is
    also a different mission, not an accommodation efficiency saving.

## Recalculated cases

These cases are cumulative alternatives, not savings to add together.

| Case | Departure t | Landed t | Departure saving t | Propulsion antimatter t |
| --- | ---: | ---: | ---: | ---: |
| Current viewer | 1,330.2 | 376.3 | — | 382.3 |
| A: one-deck rounded rims; 6 t surface kit and 2 t access allowance; old frames/fittings held | 1,267.3 | 351.2 | 62.9 | 364.3 |
| B: A plus frames 24→18 t and fittings 10.67→6 t | 1,233.8 | 337.8 | 96.4 | 354.6 |
| C: B plus industrial seed 30→20 t, landing 20→15 t, rover 6→4 t, flight frame 20→16 t | 1,168.1 | 316.5 | 162.1 | 335.7 |

Case B saves about 7.25% at departure; C about 12.19%. Case A is still a new
pressure-vessel concept with an uncertain surface-kit allowance. Case C adds
four unvalidated equipment mass targets. None is a certified lower bound.

At this operating point, removing 1 t of landed base hardware saves about
**3.14 t at departure**, including its allowance, propellant and derived hardware.
Removing 1 t of flight-only frame hardware saves about **3.06 t**; removing 1 t
of landed consumable saves about **2.52 t**. These multipliers are model-specific.
No component reduction is counted a second time as a separate fuel saving.

## Recommended sequence

1. Draw and check the 408 m² room programme, especially all-awake burn operations,
   accessible medical transfers, clear doorways and independent survival zones.
2. Compare continuous one-deck rim construction with narrower two-deck alternatives;
   size pressure restraint, floors, attachments and access instead of merely
   deleting visual geometry.
3. Itemise the surface expansion kit, fill gas, thermal control and deployment
   equipment. Demonstrate what the factory can actually make locally.
4. Re-size frames/landing gear from reduced packed loads, and audit the 30 t
   industrial seed before choosing the more aggressive cuts.
5. Close radiation protection, heat rejection, torpor and long-term material
   recovery budgets before adopting a departure-mass commitment. The attractive
   compactness gains do not resolve those independent feasibility gaps.

Verification: tests check reproduction of the current viewer baseline, departure
ledger closure, each scenario's released/consumed/landed mass balance, retained
essential allocations, area arithmetic and absence of selected-design mutations.
They validate bookkeeping, not physiological, structural or radiation safety.
