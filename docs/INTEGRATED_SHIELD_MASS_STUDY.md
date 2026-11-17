# Minimum added shielding: useful-mass integration study

**Follow-up assumption audit:** [ARRIVAL_AND_RADIATION_AUDIT.md](ARRIVAL_AND_RADIATION_AUDIT.md)
explains why neither the 159 t descent hydrogen nor the optional 88 t extra water
is an established requirement. The full-envelope column and arrival delta-v
below are sensitivity assumptions, not a converged minimum-mass design.

11 November 2026. Planning only. No viewer, active geometry or mission input
changes. Reproduce with `python -m calculations.integrated_shield_trade`.
Results: [integrated-shield-trade.json](../reports/integrated-shield-trade.json).

## Finding

The earlier 360 t separate radiation-material blanket was not an optimised
mass allocation. Replace it with distributed ordinary reaction water, landing
hydrogen and retained water, while checking the inventory at END OF BRAKING.

The strongest investigated candidate keeps 2,400 m3 gross accommodation, uses a
more compact pressure-envelope shape, and surrounds it with a layered warm-water
and cryogenic-hydrogen arrangement. Under the same reference engine assumptions:

| 40-year crew / 60-year cargo | Previous separate blanket | Integrated candidate |
| --- | ---: | ---: |
| Crew dry hardware, allowances included | 1,205 t | **614 t** |
| Crew departure mass | 4,295 t | **2,797 t** |
| Cargo departure mass | 993 t | **993 t** |
| Combined departure mass | 5,289 t | **3,790 t** |
| Crew antimatter | 73.1 t | **43.9 t** |
| Fleet antimatter | 80.1 t | **50.9 t** |

This is about 49% less crew dry mass, 28% less fleet departure mass and 36% less
antimatter. It is a conditional allocation, not an engineered vehicle or proof
of equivalent radiation dose. At optimistic engine assumptions it becomes
451 t crew dry, 3,555 t fleet departure and 23.3 t fleet antimatter.

Do not call the water mass free. The candidate explicitly retains 40 t of
water for initial surface shelter and reserves. Although useful on the surface,
its independent life-support necessity is not established. It is fully charged
as carried inventory, with tanks and landing fuel. The reference candidate
requires no additional retained water beyond that and the already-budgeted
process water and propulsion reserve during nominal operations.

## Requirements held fixed

- 32 adults plus up to 32 children; no child-torpor saving required.
- Approximately 20 years of childhood accommodation, flexible birth windows.
- 1,600 m3 gravity-habitat gross volume and 800 m3 common gross volume.
- Full-population life support, medical/maternity, food production and refuge.
- Landable habitation and useful initial exploration; no dependency on successful
  cargo deployment for immediate crew survival.
- Cargo departs 20 years before crew: duration pairs 60/40, 50/30 and 40/20.
- Same hypothetical engine and descent assumptions as FAMILY_FLEET_BUDGET.md.
- Hardware allowance remains 25%; main fuel reserve remains 5%.

The 20 g/cm2 benchmark is held for the main comparison. It is a material-column
screen, NOT a validated safe dose for children, decades of GCR or engine exposure.
Mixed hydrogen/water columns are not automatically biologically equivalent to
the earlier material blanket. Particle-transport analysis must make that comparison.

## Materials and placement

Priority order:

1. Ordinary water reaction mass already required by propulsion. Keep the
   protection cells full by draining remote tanks first. Engine compatibility
   remains hypothetical; no demonstrated engine accelerates this water at the
   calculated exhaust speeds and efficiency.
2. Landing hydrogen, retained through interstellar braking, in insulated outer
   tanks around occupied volumes. It is ordinary hydrogen, never antimatter.
3. Four tonnes of the existing eight tonnes process water, located in useful
   wall positions. The rest receives no assumed shielding credit.
4. Forty tonnes retained surface water around refuge/occupied spaces, counted
   in the mass ledger and landed with its tanks.
5. Hydrogen-rich structural liners or polyethylene used where a transport model
   identifies gaps. No mass credit without a materials/geometry bill of materials.

Avoid lead or indiscriminate metal ballast. High-strength composites can reduce
structural mass, but lower density alone does not reduce the mass column needed
for radiation protection. Aerogel/foam provides insulation; it is not a substitute
for the same column of shielding material. Water is compact, reusable and useful;
hydrogen is attractive per mass but demands much more volume and cryogenic hardware.

Equipment, food and waste receive no generic tonne-for-tonne shielding credit
in this numerical study. Composition, processing availability, depletion and
solid-angle coverage must first be mapped. This avoids speculative double credits.

## Compact accommodation screen

Two nearly equal-height/diameter cylinders enclosing 1,600 and 800 m3 have
combined closed surface area about 1,235 m2; use 1,280 m2 with a small interface
provision instead of the previous 1,800 m2 toroidal-envelope allowance.

These are calculation shapes: a rotating gravity drum and a separate common
module, not a completed interior layout. Gravity varies with radius; the usable
gravity floors, access, privacy, fire compartments, structure and spin hardware
still need design. Gross volume preservation alone does not demonstrate equal
habitable performance. User-accepted gravity assumptions remain in force.

The original 60 t envelope/floor allocation is split into 40 t area-dependent
and 20 t fixed floor/interior structure. Only the first part scales with area:
new envelope/floors = 48.4 t. Spin systems stay 20 t and furnishings stay 14 t.
Thus basic accommodation becomes **82.4 t before allowance, 103.1 t after**,
versus 117.5 t before integration. Medical, life support, refuge, power and the
new distribution/cryogenic systems are additional. No arbitrary halving of
all habitat hardware is used.

The big saving is replacing duplicated shielding mass, not making the rooms
dramatically smaller or assuming extremely light membranes. BEAM demonstrates
expandability, not the stated mass of this 64-person rotating system.

## Hydrogen geometry and hardware are charged

Reference 40-year candidate landing hydrogen: approximately 159 t, or 2,246 m3
at 70.8 kg/m3. It is large, even though it was already in the fuel budget.

Compute uniform shells around both cylindrical habitat envelopes, including
endcaps. Leave 0.2 m around the warm envelope for water cells/thermal interfaces,
then solve shell volume for the available hydrogen. Result:

- Hydrogen thickness about 1.36 m.
- Radial hydrogen column about 96.5 kg/m2 (9.65 g/cm2).
- Outer cryogenic area about 1,997 m2.
- Forward protection diameter increases from the compact 14 m screen to about
  17.53 m, including another 0.2 m outer interface provision.

Credit radial column, not hydrogen mass divided by inner habitat area. Curvature
means the 159 t shell contributes only about 123.6 t of equivalent inner-area
column inventory; the remainder is still charged as carried fuel.

Additional allocations, before allowance:

- Warm distributed cells, liners, supports/plumbing and balance/control: 10.68 t.
- Cryogenic distribution/insulation: 5 kg/m2 of outer area, plus 8 t for cooling,
  power/thermal hardware and interfaces: about 17.98 t total.
- Existing landing tanks remain charged at 8% of loaded descent hydrogen.
- Additional 40 t surface-water tanks: 2 t; additional retained-water tanks,
  when needed, are charged at the scenario tank fraction.

Cryogenic hardware increases landing load and hydrogen demand; this feedback
is solved iteratively. The larger hydrogen envelope also increases the forward
dust shield mass. Neither penalty is omitted.

These tank/cooling coefficients are targets, not engineering minima. As a heat
screen, 2 W/m2 through roughly 2,000 m2 insulation gives 4 kW cold-side load.
At COP 0.01 this needs about 400 kWe, in addition to other services. The 8 t
equipment allowance needs a design capable of that load; existing 500 kWe
habitat capacity cannot silently absorb it. Extra fuel for hundreds of kW over
decades is grams of antimatter, but power conversion, cooling reliability,
leaks, vacuum jackets and piping are material engineering risks.

## Late-braking inventory, not launch inventory, sets the minimum

At the reference optimum, the nominal end-of-braking column is supplied by:

| Contributor | Actual or credited amount |
| --- | ---: |
| Unspent ordinary reaction-water reserve | 88.45 t actual water |
| Retained surface water | 40 t actual water |
| Located process water | 4 t actual water |
| Landing hydrogen shell | 159 t actual; 123.55 t inner-area column credit |
| Added retained water beyond these | 0 t |

Column credits sum to about 256 t over 1,280 m2, approximately 20 g/cm2.
Earlier braking and coast have more reaction inventory. The numerical report
tracks available material at eleven points in proper braking time. Excess
remote fuel is available to replenish cells; it is not claimed to be physically
inside the wall or shielding the crew until transferred there.

The minimum assumes uninterrupted cell coverage and balanced replenishment.
Penetrations, tank gaps, slosh, inaccessible residuals, failure isolation,
rotating/stationary transfer interfaces and particle incidence angles are not
resolved by the scalar column calculation. Pumps and tank arrangements must
preserve coverage continuously, including during depletion and vehicle rotation.

Reserve use is a real trade. If ALL main reaction reserve is consumed, the
nominal integrated candidate drops to about **13.1 g/cm2**, not 20. Do not count
the same reserve as both expendable contingency fuel and guaranteed protection.
A variant maintaining 20 g/cm2 without crediting any main reserve adds about
88.4 t retained water, increasing the 40/60 fleet to **57.8 t antimatter and
3,977 t departure**. This is the relevant stronger protection-allocation case;
it still does not validate an actual dose limit.

Hydrogen is consumed during descent, after interstellar braking. Protection
must transition to the retained water/refuge and locally deployed surface
shielding. This cannot assume an already functioning cargo settlement. Residence
time and exposure during descent and surface deployment need explicit limits.

## What each reduction actually buys

Reference technology, 40/60 years; fleet totals include unchanged cargo:

| Candidate | Crew dry | Fleet departure | Fleet antimatter |
| --- | ---: | ---: | ---: |
| Previous separate 360 t blanket | 1,205 t | 5,289 t | 80.1 t |
| Existing envelope, water integration, 20 g/cm2 | 771 t | 5,355 t | 66.3 t |
| Compact envelope, water integration, 20 g/cm2 | 655 t | 4,603 t | 56.1 t |
| Compact envelope + landing hydrogen, 20 g/cm2 nominal | **614 t** | **3,790 t** | **50.9 t** |
| Compact water-only, 10 g/cm2 sensitivity | 564 t | 3,627 t | 47.6 t |
| Compact water-only, 5 g/cm2 sensitivity | 543 t | 3,362 t | 47.3 t |

The 10/5 g rows are NOT selected protection levels. They show that simply
reducing the column eventually gives diminishing antimatter savings because
useful retained fuel and water already provide much of it. A lighter dry ship
does not automatically minimise departure mass: engine re-optimisation can
exchange antimatter for additional ordinary propellant.

Holding cargo unchanged, minimising CREW DEPARTURE MASS instead of antimatter
in the integrated-hydrogen case gives about 1,498 t crew departure, but raises
crew antimatter to 102.3 t. Fleet totals become roughly 2,491 t and 109.3 t.
That conflicts with the user's primary antimatter-minimisation objective.
Do not silently optimise for the smallest launch mass.

## Updated duration comparison for integrated hydrogen candidate

Same 64-person accommodation and nominal 20 g/cm2 allocation in all rows.

| Crew/cargo years | Reference fleet antimatter | Reference fleet departure | Optimistic fleet antimatter | Optimistic fleet departure |
| --- | ---: | ---: | ---: | ---: |
| 40/60 | 50.9 t | 3,790 t | 23.3 t | 3,555 t |
| 30/50 | 121.1 t | 4,379 t | 43.2 t | 3,640 t |
| 20/40 | No closure | -- | 118.5 t | 3,920 t |

Propulsion efficiencies, power density, losses, reserve conventions and remaining
unclosed technology assumptions are inherited from FAMILY_FLEET_BUDGET.md.
This integration does not make the hypothetical engine or radiation protection
demonstrated. The optimistic figures are not assured lower bounds.

## Visual implementation handoff and remaining work

Investigate this candidate before committing visual geometry. Keep the original
model untouched until a later implementation request. Required visual layers:

1. 64-person gravity accommodation and common module, with gross/usable volumes
   distinguished; screen compact drums against existing wheels without assuming
   identical gravity floor area or access.
2. Thin warm-water protection cells, pressure envelope, thermal separation,
   liquid-hydrogen tanks, vacuum insulation and forward shield shown separately.
3. Remote ordinary reaction tanks distinct from distributed protective tanks;
   show the drain-last rule and remaining reserve at arrival.
4. Antimatter containment remote from all occupied spaces; never label it as
   shielding. Include engine radiation geometry and braking attitude separately.
5. Timeline views for departure, coast, late braking, reserve use, descent and
   surface deployment. Show depletion and protection shortfalls explicitly.
6. Material labels: ordinary fuel, required working inventory, retained surface
   water, additional retained protection inventory and dedicated hardware. No
   duplicated mass in shielding and propellant totals.

Next high-value engineering checks are particle transport and coverage mapping,
distributed cryogenic tank/rotary interface feasibility, usable gravity floors,
and power/thermal hardware sizing. Do not book further numerical savings from
active magnetic shields, novel foams, unspecified composites or regeneration
without a corresponding mechanism and mass ledger.

Verification checks nominal column throughout braking, reserve-depletion case,
water/tank/fuel feedback, landing mass, curved hydrogen volume and column,
no double counting, and numerical-search resolution. These are accounting checks.

## Sources

- [NASA Water Walls study](https://ntrs.nasa.gov/citations/20190001191): proposed integration of life-support processing, water storage and radiation protection; not a qualified decades-long system.
- [NASA multilayer/multipurpose shielding research](https://www.nasa.gov/directorates/stmd/space-tech-research-grants/passive-radiation-shielding-integrating-multilayer-and-multipurpose-materials-into-space-habitat-design/): need to evaluate actual particle spectra and arrangements with transport analysis.
- [NASA shielding materials](https://ddtrb.larc.nasa.gov/radiation/): low-atomic-number materials, including hydrogen, water and polyethylene.
- [NASA cryogenic hydrogen shield concept](https://techport.nasa.gov/projects/14528): concept research, not validation of this shell, hardware allocation or mission.
- [NASA BEAM demonstration](https://www.nasa.gov/international-space-station/bigelow-expandable-activity-module-beam/): expandable habitats exist; does not establish this rotating family habitat's mass.
