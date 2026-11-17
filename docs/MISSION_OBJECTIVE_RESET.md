# Mission objective reset — proposed planning direction

Implementation follow-up: the 24-adult architecture is now selected in
`data/mission_architecture.json` and represented in the viewer. See
`PROPULSION_ARCHITECTURE.md` for implemented changes and the propulsion comparison.
The planning discussion below records the proposal before that implementation.

Objective: deliver mentally and physically capable adults to Proxima b who can
establish a settlement and have children, while minimizing antimatter. This supersedes
preserving the present family-in-transit architecture as the design objective.
No active specification, viewer or existing mass ledger is modified.

## Feasibility comes before the minimum

No evaluated architecture currently demonstrates the requested health outcome.
The radiation constraint is unclosed, and decades of human torpor are not a proven
capability. A unique optimum also requires a numerical acceptable health risk,
reliability requirement and propulsion-technology boundary. Minimizing antimatter
alone permits replacing it with external energy or fusion; these introduce different
large engineering costs. The recommendations below are study choices, not proven optima.

## Recommended baseline to investigate

- 24 adult settlers, with 16 and 32 as sensitivity cases. Preserve trained backup
  personnel, medical coverage and social capacity rather than minimize head count
  to a few individuals. This is not a validated minimum viable colony population.
- No planned pregnancies or child development in transit. Carry separately located,
  protected and redundant banks of embryos/gametes from many donors. Preserve both
  reproductive choice and diversity; a bank does not replace healthy gestational
  parents, caregivers or a viable settlement population.
- Approximately 20 years crew flight, with 15 and 25 years as nearby alternatives.
  Do not credit torpor with halting ageing. Young adults departing around age 20
  arrive around age 40 on the 20-year case; relativistic time savings are modest.
  Embryos preserve egg-age advantages but do not remove gestational health risks.
- Use 600–900 m³ total usable crew space as a preliminary sizing range for 24 adults,
  not a demonstrated psychological minimum or pressure-envelope specification.
  Count machinery separately. Concentrate sleep, torpor and routine occupation in
  compact protected gravity spaces; retain privacy, exercise, communal activity and
  enough emergency capacity for everyone awake. Size from a roster and usable floor
  plan before fixing volume. Do not repeat 64-person family accommodation by default.
- Torpor is an optional mass and occupancy benefit contingent on medical validation.
  Do not select a minimum awake percentage until medical access, maintenance,
  emergency response and psychosocial needs can be staffed. No biological radiation
  protection or slowed ageing is credited merely because a person is unconscious.
- Retain the cargo launch 20 years before crew: a 20-year crew mission pairs with
  40-year cargo. Put surface expansion and heavy industry on cargo; carry independent
  survival, landing, repair and initial surface capability with the crew. Simultaneous
  arrival means cargo success cannot be verified before crew launch. A separate earlier
  reconnaissance mission is needed if verified landing conditions are a requirement.
- Establish protected surface accommodation before pregnancy. Do not infer that a
  habitable-zone orbit guarantees a suitable atmosphere or safe surface radiation.

## Propulsion benchmark

Reproduce with `python -m calculations.mission_reset_trade`.
This isolates the speed penalty from arbitrary habitat mass allocations. It uses
100 tonnes retained after braking, instantaneous burns, no reserves, 50% conversion
of annihilation energy to massive-exhaust kinetic energy, and optimizes constant
exhaust speed. Other energy is modeled as isotropic waste in the ship frame. This
is an idealized comparison within this rocket model, not a universal physical minimum.

| Crew duration | Speed | Antimatter t / 100 t retained | Reaction mass t | Total departure t |
|---|---:|---:|---:|---:|
| 15 y | 0.283 c | 28.76 | 476.4 | 633.9 |
| 20 y | 0.212 c | 15.11 | 437.2 | 567.4 |
| 25 y | 0.170 c | 9.38 | 420.5 | 539.3 |
| 30 y | 0.141 c | 6.40 | 411.4 | 524.2 |
| 40 y | 0.106 c | 3.54 | 402.6 | 509.7 |

Ordinary matter equal to the antimatter mass is also annihilated; it is not included
in the reaction-mass column but is included in departure mass. Retained mass must
include shielding, tanks, engines, landing inventory and everything else still aboard.
Real finite burns, hardware and reserves require a closed vehicle calculation.

For equal antimatter, the 20-year retained mass must be only 23.5% of the 40-year
retained mass in this benchmark. Reducing 64 occupants to 24 is not by itself a
fourfold ship-mass reduction. Fixed equipment and protection remain substantial.
At 300 t retained, the 20-year benchmark requires 45.3 t antimatter, 45.3 t ordinary
annihilation reactant and 1,311.6 t reaction mass; departure is 1,702.2 t. This is a
scaling example, not a proposed 300 t complete ship or an updated fleet budget.

Within this model, decreasing exhaust speed initially trades more reaction mass
for less antimatter, but eventually the rocket mass ratio reverses the benefit.
Increasing efficiency cannot be assumed to provide orders-of-magnitude savings.
Tank mass, thermal rejection and containment must be included in a real optimum.

## Radiation and biological constraints

At the previously used 1.04 mSv/day adult-reference rate, 20 years gives about
7.6 Sv before modest time-dilation correction. A 1.2 Sv transit allowance requires
about 6.3 times lower average dose; a 0.6 Sv transit allocation requires about
12.7 times lower average dose. These are heliospheric reference calculations, not
predicted interstellar exposures. Faster travel helps but does not solve protection.

Do not treat 20–40 g/cm² shielding as adequate by decree. Compare retained useful
mass, local passive protection and active-shield concepts with transport calculations
including secondaries, interstellar spectra, occupied geometry and propulsion phases.
An active shield earns no mass-saving or dose credit until field geometry, power,
structure, failure behavior and dose performance are specified. Thick passive shielding
likewise needs transport; no exponential attenuation extrapolation is justified.

Unknown shielding mass prevents an honest minimum dry-mass or fleet-antimatter number.
The former approximately 53 t fleet estimate did not demonstrate the health objective.

## Propulsion architecture branches

1. Fully onboard annihilation rocket: retain as a reproducible reference. Antimatter
   is likely measured in tonnes for the studied mass/speed scale, not kilograms.
2. External launch energy plus onboard braking: investigate before optimizing habitat
   kilograms. It removes the launch energy source from the ship but requires a major
   beam/pellet infrastructure, coupling and pointing analysis. Onboard braking fuel
   still has to be accelerated; do not simply halve the old antimatter budget.
3. Fusion or antimatter-triggered nuclear propulsion: potentially eliminates or greatly
   reduces antimatter as the bulk energy source, at the cost of nuclear fuel, exhaust
   performance, reactor/pulse hardware and heat. No numerical antimatter saving is
   credited without a selected reaction, ignition gain and propulsion model.
4. Magnetic/electric sail braking: potentially saves braking fuel, but evaluate density,
   field and sail mass, duration and terminal capture. Do not assume free braking within
   a 20-year timetable. Slow uncrewed cargo is the first application to investigate.

Preferred next comparison: a 24-adult, approximately 20-year, no-births-in-transit
vehicle against the same mission with external launch energy and with fusion-based
propulsion. Keep the health and surface-survival criteria fixed across all cases.
If none closes radiation and reproductive health, report no feasible architecture;
do not relax those criteria silently to manufacture a mass optimum.

Sources:
- NASA radiation standard: https://www.nasa.gov/reference/4-0-human-performance/
- NASA radiation reference table: https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf
- NASA torpor concept: https://www.nasa.gov/general/torpor-inducing-transfer-habitat-for-human-stasis-to-mars-2/
- ASRM recipient age and embryo donation: https://pubmed.ncbi.nlm.nih.gov/27450186/
- NASA propulsion assessment: https://ntrs.nasa.gov/api/citations/20200000759/downloads/20200000759.pdf
- Magnetic/electric sail deceleration research: https://arxiv.org/abs/1603.03015
