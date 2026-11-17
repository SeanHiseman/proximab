# S2 fuel substitution and lean-budget trade

Reproduce with `python -m calculations.fuel_substitution`; numerical output is
`reports/fuel-substitution.json`. These comparisons retain the 20-year crew and
40-year cargo schedules and the S2 nonpropulsion packages. They do not change the
selected design. Hardware and protection remain unqualified.

## What fusion saves

The annihilation-only comparator accelerates inert reaction mass. It does not
eliminate reaction mass and is not a photon rocket. The distinction between
annihilation-powered and fusion-assisted concepts is also discussed in
[NASA's propulsion review](https://ntrs.nasa.gov/api/citations/19990110316/downloads/19990110316.pdf).
The numerical performance here comes from our optimistic model, not that review.

At identical burn durations and massive-exhaust speeds, replacing fusion with
inert propellant raises crew antimatter from 88.974 to 94.998 t and cargo antimatter
from 3.361 to 8.319 t. Fusion therefore saves 6.024 t (6.34%) and 4.958 t (59.60%),
respectively. Tanks, containment, source power, radiator mass and reserves are
reclosed for each comparison; fixed allocations remain the same.

Allowing the annihilation-only comparator to choose different speeds and burn
durations gives a sampled energy minimum:

| Vehicle/design | Departure t | Fusion fuel t | Inert reaction mass t | Antimatter t | Primary energy ZJ |
|---|---:|---:|---:|---:|---:|
| Crew hybrid S2 | 3931.87 | 2935.51 | 0 | 88.974 | 32.971 |
| Crew annihilation-only | 3767.27 | 0 | 2757.60 | 94.965 | 34.140 |
| Cargo hybrid S2 | 2829.79 | 2508.61 | 0 | 3.361 | 2.050 |
| Cargo annihilation-only | 1304.74 | 0 | 998.31 | 7.230 | 2.599 |

Matching ordinary annihilation reactant equals the antimatter mass and is included
in departure mass. All loaded fuel quantities include reserves. The fleet hybrid
saves about 9.86 t AM (9.65%) and 1.72 ZJ (4.68%) against the sampled annihilation-only
fleet. It is heavier: minimum departure mass and minimum primary energy differ.
Search resolution is 0.25 y burns and 0.02c exhaust increments, not a global optimum.
The sample spans burns 0.25-9.75 y for crew and 0.25-10 y for cargo, exhaust .08-.80c.
Massive-exhaust speeds are .26c/.48c crew and .12c/.24c cargo in this comparator.

## What antimatter saves

Electrical-ignition fusion alone has .07855c massive exhaust in the model.
The 20-year crew mission cannot close with the S2 hardware and reserve coefficients
over the sampled burns. It also fails that sampled search with zero fuel reserve;
engine/thermal mass feedback matters as well as reserves. This is not a universal
impossibility result for fusion or other staging architectures.

At the S2 crew trajectory, a fuel-only calculation carrying the 606.85 t nonpropulsion
core needs approximately 218,984 t fusion fuel. That calculation removes ALL main
propulsion hardware and reserves, so it is only an illustration of the rocket-equation
penalty, not a complete alternative or a matched 98.7% savings claim. The actual
hybrid loads 2935.51 t fusion fuel plus 88.974 t AM and matching reactant.

For cargo, the sampled closed fusion-only case has a 1-year burn at each end,
55,371.63 t fusion fuel, 56,622.79 t departure mass and 18.579 ZJ primary energy.
The selected hybrid saves 52,863.02 t fusion fuel (95.47%) for 3.361 t antimatter.
This dramatic difference is strongly dependent on retaining 5% of all nominally
burned fuel as reserve: deleting that reserve reduces the fusion-only cargo to
4616.85 t fusion fuel. Zero reserve is not a proposed mission. Reserve policy must
therefore be explicit in every fuel-saving comparison.

## Lean allowance sensitivities

These keep current burn durations and exhaust mixtures. All hardware allowances,
including tanks, engines, radiator, separation kit and fixed hardware, change
consistently. Landing propellant is recalculated for the lighter landed package.
Chemical reserve remains 10% of nominal burn; inventories and crew count are unchanged.
Reducing allowance is accepting less uncertainty, not an engineering mass saving.

| Hardware allowance | Main fuel reserve | Fleet departure t | Fusion t | AM t | Primary ZJ |
|---|---|---:|---:|---:|---:|
| 25% | 5% | 6761.66 | 5444.12 | 92.34 | 35.02 |
| 15% | 5% | 6165.50 | 4968.27 | 84.03 | 31.88 |
| 10% | 5% | 5876.44 | 4737.27 | 80.02 | 30.36 |
| 25% | 2% | 5626.45 | 4379.84 | 77.67 | 29.44 |
| 15% | 2% | 5145.24 | 4008.54 | 70.91 | 26.88 |
| 10% | 2% | 4910.93 | 3827.54 | 67.63 | 25.63 |

No lean case establishes radiation compliance or adequate reserves for dispersions,
faults or propulsion degradation. Quantify those demands before declaring an
allowance adequate; do not reduce shielding performance or reserve allocations
merely to meet a desired mass.

## Where to save mass

At the original S2 profile, each tonne removed from retained crew orbital mass
saves 6.442 t departure and 0.1461 t antimatter. A tonne removed from landed crew
dry mass saves 8.536 t departure and 0.1936 t AM after chemical-fuel feedback.
For cargo the corresponding orbital multipliers are 10.953 t departure and
0.01312 t AM. These are local fixed-profile sensitivities, not universal constants.

Moving 10 t of landed hardware from crew to cargo saves 1.762 t fleet AM, but
increases total departure mass by 59.780 t under these profiles. Both ships' landing
propellant is resized. This move is possible only for equipment not needed during
the crew flight or before independent surface startup.

| Area | Concrete mass-saving investigation | Limitation |
|---|---|---|
| Main fuel reserves | Replace blanket percentages with navigation, capture, performance and failure budgets | Smaller percentages reduce recoverability; no arbitrary reserve credit |
| Habitat envelopes/floors | Smaller rigid pressure volumes with inflatable low-load rooms; structural sizing | Inflatable volume still needs floors, fittings and protection |
| Spin/bearings/transfers | Fewer rotating interfaces, shared drive/support structures | Requires revised geometry and failure analysis |
| Furnishings/medical | Convertible spaces, shared fixtures and equipment | Already modest allocations; preserve exercise, care and privacy |
| Life support/food | Shared bulk storage and utility equipment, repairable modules | Do not replace two complete food trains with one without long-duration evidence |
| Power/service thermal | Size from actual food, cryogenic and habitat loads; avoid separately oversized units | No validated service load inventory yet |
| Surface equipment | Move nonessential industry, expansion and heavy tools to early cargo | Crew must retain startup and emergency capability |
| Landing cradle/TPS | Structural integration and smaller landed package; compare entry trajectories | Atmosphere and entry hardware unresolved; cannot simply reuse an eroded dust shield as TPS |
| Water/gases/food/spares | Reuse as protection and structure ballast, close actual loss budgets | Retained minimum coverage and reliability must be met; removing water may increase shield mass |
| Forward shield | Reduce projected area through genuine layout redesign | Existing gravity modules must fit; reducing area numerically is insufficient |
| Engine shadow shielding | Optimize standoff, intercepted solid angle and shadow geometry | Coupled transport and heat analysis required; cannot delete dose protection |
| GCR equipment | Concentrate protection in occupied multifunction rooms and use retained inventories | Current 37.5 t allowance has no verified dose credit; mass may need to rise |
| Tow/feed hardware | Integrated tension members and deployable services | Multi-meganewton loads and vibration require sizing |
| Main engine | Higher demonstrated specific power, optimized thrust history | Already assumes 5 GW/kg source-specific power before allowance |
| Hot radiators | Reduce absorbed source heat; improve radiator temperature and areal mass | Already assumes 2000 K and tiny intercepted heat fraction |
| Ordinary tanks | More staging or lighter qualified tanks | Current 1% tank fraction before allowance is already optimistic |
| AM containment | Better containment mass, subdivided redundant storage | Current 0.5 kg/kg before allowance is hypothetical |
| Hardware allowance | Reduce 25% to 15% or 10% as explicit lean planning cases | Changes bookkeeping headroom, not the underlying design |

At fixed S2 profiles, doubling engine specific power saves 328.27 t fleet departure
and 5.77 t AM. Halving AM containment mass saves 149.11 t and 2.76 t AM. Halving
ordinary tank fraction saves 182.97 t and 1.44 t AM. These are independent optimistic
technology sensitivities, not additive, validated or adopted improvements.

Primary energy retains the prior definition: loaded-AM manufacturing at 50%
efficiency plus nominal fusion energy release. Fuel acquisition, construction and
ongoing storage energy are unpriced. Antimatter energy is not counted twice.
