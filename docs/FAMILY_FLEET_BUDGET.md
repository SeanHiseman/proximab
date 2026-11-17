# Family fleet budget: conditional planning conclusion

**Superseded mass allocation:** see [INTEGRATED_SHIELD_MASS_STUDY.md](INTEGRATED_SHIELD_MASS_STUDY.md)
for the user's requested minimum-added-shielding investigation. The separate
360 t radiation blanket below is a historical comparison, not the preferred
mass-minimising candidate. All technology and dose-validation limits still apply.

11 November 2026. Planning study only; no viewer, geometry or active mission
inputs changed. Reproduce with `python -m calculations.family_fleet_trade`.
Detailed results: [family-fleet-trade.json](../reports/family-fleet-trade.json).
Visual handoff: [FAMILY_FLEET_PLAN.md](FAMILY_FLEET_PLAN.md).

## Conclusion to carry into the next session

Select the 40-year crew / 60-year cargo pair as the lowest-antimatter case
among these three duration choices. Under the explicit reference assumptions,
allocate approximately **80 t antimatter**, **1,205 t crew dry hardware** and
**233 t cargo dry hardware**. Loaded departures are approximately **4,295 t**
crew and **993 t** cargo. For convenient provisional planning these can be
rounded to **85 t antimatter and 5,500 t combined departure mass**, but that
rounding is not a quantified reliability or engineering margin.

These are conditional design-to allocations, NOT established minimum spacecraft
masses or a demonstrated feasible mission. Even the reference engine is an
extreme hypothetical technology. A more optimistic set of assumptions reduces
the 40/60 fleet to 36 t antimatter; a less capable set does not close at all.
There is no defensible finite upper bound while shielding, storage and engine
technology remain unqualified. The earlier 4.29 t estimate was a lossless
200/100 t arrival-mass illustration, not a family-fleet budget.

## Timing and population: latest user instructions

Cargo departs at fleet year 0; crew departs at year 20 in EVERY scenario. Both
arrive together. Births are approximate and flexible, not fixed at crew year 20.

| Crew flight | Cargo flight | Shared arrival, fleet year | Birth window, crew year | Approximate parent/child arrival ages |
| --- | --- | --- | --- | --- |
| 40 y | 60 y | 60 | Around 20 | 60 / 20 |
| 30 y | 50 y | 50 | Around 10 | 50 / 20 |
| 20 y | 40 y | 40 | Around departure | 40 / 20 |

Allow gestation, recovery and burn schedules to shift these windows; exact
onboard times are in the numerical report. Do not schedule all births at once.
Accept adequate gravity exposure and possible pregnancy as instructed. There
are 32 initial adults and up to 32 children; all variants support 64 people.
No child torpor or biological age suspension is required to achieve the budgets.
The approximately 20-year family phase is included in each supply allocation.

## Comparable fleet results

Dry includes hardware development allowances, propulsion hardware, empty tanks
and landing tanks. It excludes people, inventories and propellants. Loaded
departure includes these, antimatter AND its matching matter. Do not add the
antimatter again. All masses are tonnes.

Reference hypothetical technology:

| Crew/cargo years | Crew antimatter | Cargo antimatter | Fleet antimatter | Crew dry | Cargo dry | Crew departure | Cargo departure |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 40/60 | 73.1 | 7.0 | **80.1** | 1,205 | 233 | 4,295 | 993 |
| 30/50 | 185.1 | 10.8 | **195.9** | 1,584 | 247 | 5,611 | 1,035 |
| 20/40 | No closure | 19.3 | **No closed fleet** | -- | 277 | -- | 1,134 |

More optimistic hypothetical technology, applied consistently to all cases:

| Crew/cargo years | Crew antimatter | Cargo antimatter | Fleet antimatter | Crew dry | Cargo dry | Crew departure | Cargo departure |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 40/60 | 32.6 | 3.6 | **36.3** | 937 | 197 | 3,770 | 968 |
| 30/50 | 63.1 | 5.3 | **68.4** | 989 | 201 | 3,980 | 976 |
| 20/40 | 184.7 | 8.6 | **193.3** | 1,182 | 207 | 4,820 | 995 |

The optimistic 20-year row must not be presented as a reference-technology
alternative to the 30-year row. Within the SAME optimistic technology, 20 years
uses 5.3 times the antimatter of 40 years. Within reference technology, 30 years
uses 2.4 times the 40-year requirement.

## Mass allocation and why 300 t no longer describes this ship

Use 1,600 m3 gross gravity-habitat volume plus 800 m3 common volume as a planning
envelope. This is 37.5 m3 gross per person at full occupancy, before equipment
and circulation deductions; it is not a psychological sufficiency criterion.

For a surface-area screen only, two toroidal envelopes with major radius 7 m
and tube radius 2.4 m provide about 1,592 m3 and 1,326 m2 combined. An 800 m3
spherical common envelope adds about 417 m2. Round their roughly 1,743 m2 to
1,800 m2 for the shielding allocation. These are calculation shapes, not an
instruction to implement that wheel geometry. Their rotation ergonomics,
structures, penetrations, layout and deployment remain unqualified.

| Crew fixed allocation, before 25% hardware allowance | t |
| --- | ---: |
| Pressure envelopes, floors and insulation | 60 |
| Spin/transfer/deployment structure | 20 |
| Furnishings, hygiene, education, play and exercise | 14 |
| Surrounding radiation material: 1,800 m2 at 200 kg/m2 | 360 |
| Forward shield: 20 m diameter, 100 kg/m2, plus support | 36.4 |
| 64-person descent/refuge systems | 28 |
| Life support and two independent full-population food trains | 24 |
| Medical, maternity, embryos and convertible berths | 22 |
| Service power and cooling | 15 |
| Avionics and communications | 3 |
| Initial exploration, suits and repair tools | 8 |
| Fixed main-engine feed, standoff and containment services | 20 |
| Total before allowance | 610.4 |
| Fixed hardware including 25% allowance | **763.0** |

The reference 40-year ship then adds approximately 129 t scalable engine,
138 t main reaction-mass tanks, 73 t scalable antimatter containment, 4 t hot
radiators, and 25% allowance on those additions, plus 12 t descent tanks.
This produces the 1,205 t dry total. None of these coefficients is a measured
mass for a relativistic propulsion system.

The 40-year crew also carries 38 t inventories/people, about 153 t descent
hydrogen and about 2,753 t main ordinary reaction mass (including its reserve).
Main antimatter has equal matching annihilation matter. Food is synthesised in
a closed material loop rather than stored for the full journey. Inventories
include material for child growth; mass does not appear at birth.

Plan on roughly 16 awake original adults during parenting as a staffing screen,
plus up to 32 awake children. Installed life support and both independent food
trains must each cover the full 64-person emergency requirement. The assigned
500 kWe service load and 24 t plant allocation are targets needing engineering,
not demonstrated decades-long material closure. Three tonnes of reserve food
is a short interruption buffer, not years of independent food supply.

The cargo retains 85 t surface industry, exploration, expansion and backup
systems, plus landing/service hardware. Its fixed dry allocation is 158.5 t
including 25% allowance; scaling hardware brings the 60-year reference cargo
to 233 t dry. It carries 26 t surface stocks/maintenance inventory.

## Landing and staging

Main propulsion, forward shields, main tanks and 320 t of removable crew cruise
radiation material stay in orbit or are discarded AFTER interstellar braking.
No departure/arrival propulsion credit is claimed for discarding after braking.
The landable crew system retains 40 t shelter material, habitat and exploration
hardware. The 40-year case lands about 343 t excluding unused fuel reserves.
Surface coverage outside the refuge requires local shielding deployment; the
retained shelter is not proof of adequate long-term radiation protection.

Descent assumes 6 km/s total allowance, 1,800 s Isp antimatter-heated propellant,
10% landing fuel reserve and tanks weighing 8% of loaded descent propellant.
Tank mass is included in the landing rocket equation. This is hypothetical;
neither atmosphere-assisted landing nor an actual Proxima b landing profile is
validated. A 64-person lander is still required even when cargo is separate.

40/60 reference fleet sensitivity to landing propulsion:

| Landing Isp | Fleet antimatter |
| --- | ---: |
| 1,800 s hypothetical baseline | 80.1 t |
| 900 s hypothetical alternative | 102.3 t |
| 450 s chemical-like mass-ratio screen | 199.5 t |

For 450 s the propellant column represents combined chemical propellants, not
hydrogen alone. Most extra antimatter transports landing propellant across
interstellar space; the landing engine's own antimatter energy demand is tiny.

## Propulsion and exact accounting assumptions

| Parameter | Optimistic | Reference | Stress |
| --- | ---: | ---: | ---: |
| Annihilation energy into directed massive-exhaust kinetic energy | 80% | 50% | 30% |
| Engine handled annihilation power per kg | 5 GW/kg | 1 GW/kg | 0.2 GW/kg |
| Fraction of annihilation power deposited as ship heat | 0.0001% | 0.001% | 0.01% |
| Tank mass / loaded ordinary reaction mass | 3% | 5% | 10% |
| Additional containment kg / loaded antimatter kg | 0.5 | 1 | 2 |

These are sensitivity assumptions, not literature-derived capabilities or
statistical uncertainty bounds. Fixed containment services are additional.
All cases assume zero storage/propellant leakage; no demonstrated technology
can guarantee this for these inventories over decades.

Common: 25% hardware allowance; 5% main fuel reserve carried through braking;
two-sided 2,000 K hot radiators, emissivity 0.9, 5 kg/m2 planform; no staging
during the main burns; no beamed assistance or antimatter-catalysed fusion.
Ordinary reaction material is species-independent in the equations. Dense
water is a useful tank-volume screen, not a demonstrated relativistic exhaust.

For massive exhaust speed u*c, gamma_e = 1/sqrt(1-u^2), efficiency eta:

    annihilated mass per kg massive exhaust = (gamma_e - 1)/eta = f
    effective exhaust/c = gamma_e*u/(1+f)
    antimatter fraction of total rest-mass loss = f/[2*(1+f)]
    mass ratio R = exp[2*atanh(beta)/(effective exhaust/c)]

Unused energy escapes isotropically in the ship frame and contributes no net
thrust. The small heat-intercepted fraction is reradiated. All energy losses
enter the rest-mass accounting. Real anisotropic loss distributions require
a different engine model. It is incorrect just to divide ideal fuel by eta.

Burns have constant proper acceleration, equal coordinate durations and a
coast interval. Distance, travel time and peak speed are solved relativistically.
Search burn durations 0.1 year through 49% of flight time per burn, and massive
exhaust speeds 0.025c through 0.95c. Refine around each best point. Numerical
results are minima in this restricted family, not global propulsion minima.

Reference 40-year crew optimum: 2.46 years per burn, peak speed about 0.113c,
exhaust 0.226c; cargo: 1.97 years per burn, peak speed 0.0731c, exhaust 0.145c.
These differ from the lossless optimum because tanks and power hardware cost
mass. Crew initial annihilation power is about 129 TW, intercepted heat 1.29 GW.

Mass closure includes feedback: let B be fixed hardware plus inventories and
landing stocks. Let h be scalable hardware per tonne arrival mass including its
allowance, and q = 0.05 the unspent reserve fraction of main consumed fuel.

    arrival mass M = B / [1 - h - q*(R-1)]
    departure mass = R*M

A nonpositive denominator is not a very large finite ship: it means this set
of linear hardware assumptions cannot close. No searched 20-year reference
crew candidate closes. No stress-case crew candidate closes at any of the
three durations, although the 60- and 50-year cargo candidates do. This is a
model result, not proof that all possible propulsion architectures fail.

## Sensitivities and alternatives

At reference efficiency/hardware, changing intercepted heat from 0.001% to
0.1% raises the 40/60 fleet from 80.1 t to about 116.7 t antimatter. At 1%, no
40-year crew candidate closes. A conventional engine that absorbs a large
fraction of annihilation power as heat cannot inherit the low-budget rows.

Halving the 360 t radiation-material allocation lowers the reference 40/60
fleet to about 62.1 t; doubling it raises the fleet to about 116.1 t. Neither
change establishes a safe exposure. Shielding is a mass sensitivity, not a
free parameter that can be reduced merely to meet a fuel target.

Pure annihilation alternatives, with the SAME reference hardware scaling and
independently optimised burns, require roughly 1,230 t antimatter at 0.5c
effective exhaust, 447 t at 0.7c, or 228 t with ideal photon exhaust for the
40/60 fleet. These include much larger fuel/storage feedback than the earlier
fixed-arrival-mass examples. Faster exhaust alone does not minimise antimatter.

Splitting cargo is retained as requested. It does not automatically save fuel
against an integrated ship: duplicated engine/landing/services must be charged
against the slower-cargo saving. The 60-year reference cargo's antimatter is
about 7 t versus 19.3 t for the same cargo architecture over 40 years. This
12.3 t difference is not a comparison against a shared integrated spacecraft.

For narrower cargo, a 6 m forward shield is a screening allocation. At the
reference 652 t main reaction load, water occupies about 652 m3. A 4 m diameter
cylindrical tank needs about 52 m cylindrical length before endcaps, cargo and
engine standoff. A 2 m tank needs about 208 m; a 6 m tank about 23 m. Shield
diameters 4/6/8 m give bare 100 kg/m2 face masses 1.26/2.83/5.03 t. Saving a
few shield tonnes by creating a much longer structure may lose overall.
Choose diameter after tank/structure analysis; no justified absolute minimum
diameter has been established. Radiators and off-axis shielding remain exposed
design issues, especially through braking attitude changes.

Variable exhaust, expending/staging tanks between burns, or an external
departure beam could lower antimatter further. They require additional models;
none is silently credited here. If unlimited external or nuclear propulsion is
allowed, zero antimatter is the trivial theoretical objective, but the mission
performance must then be demonstrated with that alternative energy source.

## Evidence limits and implementation gate

The user accepts gravity and pregnancy assumptions. This does not establish
decades-long radiation safety, reliable torpor, food-loop closure, maintenance,
tonnes-scale antimatter storage or the assumed engine power density.

The 200 kg/m2 surrounding-shield figure is a mass benchmark. NASA's 20 g/cm2
long-duration shelter guidance addresses solar particle events; it is not a
demonstration of safe 40-year galactic-cosmic-ray exposure or childhood exposure.
The forward 100 kg/m2 shield is likewise not an impact-survival calculation.
Both are held fixed across durations for a controlled comparison. Speed-specific
impact shielding and duration-specific dose modelling can change the ranking
or require much more mass.

Do not implement the optimistic figures as validated geometry. For the next
visual planning session show the 40/60 reference baseline, its component ledger,
the optimistic sensitivity and the unresolved engine/shielding assumptions.
Preserve accommodation, landing and exploration; do not force the new family
ship into the old 300 t cap by deleting necessary systems or allowances.

Verification: tests reconstruct trajectory distance, check exhaust energy and
momentum, recover the lossless limit, close all fuel/hardware/reserve masses,
verify landing tank feedback, reject impossible hardware and check optimisation
resolution. These verify accounting, not technology or medical feasibility.

Sources:

- [NASA antimatter propulsion overview](https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf): annihilation products, energy channels and propulsion concepts; does not substantiate the assumed GW/kg engine.
- [Keane and Zhang nozzle research](https://arxiv.org/abs/1205.2281): charged-pion nozzle simulation; do not equate a charged-particle speed with whole-engine effective exhaust including all losses.
- [Relativistic rocket equations](https://math.ucr.edu/home/baez/physics/Relativity/SR/Rocket/rocket.html).
- [NASA human performance/radiation guidance](https://www.nasa.gov/reference/4-0-human-performance/).
- [NASA habitability functions](https://www.nasa.gov/reference/7-0-habit-ability-functions-vol-2/): privacy, sleep, hygiene and other functional needs, not a validation of this volume allocation.
- [CERN antimatter](https://home.web.cern.ch/science/physics/antimatter/): production, storage and difficulty using annihilation products.
