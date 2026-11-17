> Historical S2 snapshot. Current specification: [S3](INTEGRATED_DESIGN_SPECIFICATION.md). Frozen inputs: `data/integrated_specification_s2.json`; frozen report: `reports/integrated-specification-s2.json`. Commands and current-input links in the original text below are historical.

# S2 — integrated conditional mission specification

**Disposition: concept specification complete for review; final health-constrained
optimal design NOT established.** S2 supersedes S1's 300 t core shortcut for fleet
budgeting. It is not a declaration that optimistic engine ratings, radiation protection
or a Proxima landing have been engineered successfully.

Authoritative inputs: `data/mission_architecture.json` and
`data/integrated_specification.json`. Reproduce with
`python -m calculations.integrated_specification`. Full component and phase ledgers:
`reports/integrated-specification.json`. Viewer figures derive from this calculation.

## 1. Mission objective and fixed decisions

Deliver 24 adults physically and mentally capable of establishing a protected settlement
and having children, minimizing total primary energy and industrial burden. Retain the
20-year crew flight and cargo departure 20 years before crew. Both arrive together.
No planned pregnancies or children in transit. Carry two separated reproductive banks.
Torpor is optional and receives no age-arrest or intrinsic radioprotection credit.

Use fully onboard staged fusion–antimatter propulsion. Drop only emptied acceleration
storage and separation hardware. Keep the engine, braking stores and all reserve fuel
through interstellar braking. Core survival and initial exploration do not depend on
successful cargo arrival. Heavy expansion and industry fly on cargo.

The objective is constrained by health, survival and reproduction. A mathematical
minimum among unqualified engines cannot be promoted to the mission optimum while
these constraints are unverified. No numerical fuel-production cost model yet covers
isotope acquisition, construction or storage operation; the reported energy optimum
is only the modeled nuclear-plus-antimatter-production term.

## 2. Geometry and habitation interfaces

Preserve the current two gravity-module envelopes: 9.5 m nominal radius, 4.5 m axial
depth, floor radii 8.5 and 5.4 m, 12 adults per module. Eight three-person convertible
berth bays provide 24 places. Keep private retreat, medical, exercise, dining, workshop
and life-support functions. Usable-space allocation remains 750 m³; this is not a
verified net usable floor-plan volume or a psychological minimum.

Use the displayed forward silhouette, 19.54 × 15.6 m, for shield mass allocation:
100 kg/m² plus 3 t supports, before 25% hardware allowance. This costs 33.4824 t
before allowance. The old 14 m circular-shield allocation did not match this envelope.
The areal mass is not an erosion/secondary-radiation solution. Final fuel-tank envelopes
and their shadow clearance still require dimensions and a trajectory-dependent layout.

Main source standoff target remains 2 km. Two source-shadow assemblies are allocated
42.8 t before margin; source distance to shadow 50 m and radius 0.8 m are heat-screen
inputs, not validated attenuation or plume-clearance geometry. Do not draw a fictional
active GCR shield: a 30 t equipment allowance remains explicitly without dose credit.

44 t total retained working/protection water is included exactly once, with plumbing
separately charged. Any shielding arrangement must map this inventory and fuel depletion
over time. Full all-direction protection is not inferred from forward or engine shields.

## 3. Component budget and optimistic propulsion assumptions

The machine-readable manifest lists 18 crew hardware allocations and seven inventories.
All hardware receives 25% allowance; inventories do not. Crew fixed dry hardware including
chemical descent tanks is 434.63 t; nonpropellant inventories 66.92 t; chemical landing
fuel 105.30 t. Thus the non-main-propulsion core is **606.85 t**, not 300 t.
These are explicit allocations, not detailed stress, reliability or closed food-loop designs.

Cargo fixed dry hardware including chemical tanks is 182.27 t, inventory 25 t, chemical
fuel 47.66 t, giving core 254.92 t. Surface cargo includes industry 30 t, exploration 10 t,
expansion 15 t, food/life-support backup 15 t and power/services 15 t before allowance.

Retain S1's optimistic 80% fusion and 80% supplementary annihilation coupling, 50%
AM manufacturing efficiency, 5 GW/kg engine, 1% ordinary tank mass and 0.5 kg/kg AM
containment before margin. Five percent nominal main-propellant expenditure is carried
as reserve in dedicated retained stores. Fusion is a complete-burn D–He3 model.

Source heat now includes a geometric shadow interception term. Assuming 20% isotropically
escaping source energy and complete deposition of the intercepted portion gives
0.2*0.8²/(4*50²)=1.28e−5, added to intrinsic 1e−5. Total modeled hot-hardware interception
is **2.28e−5**. Real scattering and absorption remain unknown; this is not transport.
The high coupling and low hardware interception must be demonstrated together.

Hot radiators use 2,000 K, emissivity 0.9, two-sided radiation and 5 kg/m² planform before
allowance. Separate service thermal management has a 10 t allocation. Cold cryogenic
heat rejection cannot be credited to the 2,000 K radiator. Two service fission-electric
units retain a combined 30 t allocation; power/lifetime and food-loop demands are unqualified.

## 4. Flight and mass specification

| Quantity | Crew | Cargo |
|---|---:|---:|
| Total Earth-frame duration | 20 y | 40 y |
| Main transfer duration | 19.9 y | 39.9 y |
| Each powered burn | 1.25 y | 0.75 y |
| Main coast | 17.4 y | 38.4 y |
| Peak speed | 0.22714 c | 0.10830 c |
| Massive exhaust, acceleration / braking | 0.25 / 0.48 c | 0.08 / 0.20 c |
| Departure dry hardware | 646.19 t | 241.81 t |
| Loaded main fusion fuel | 2,935.51 t | 2,508.61 t |
| Loaded AM | 88.97 t | 3.36 t |
| Matching ordinary annihilation matter | 88.97 t | 3.36 t |
| Chemical descent fuel | 105.30 t | 47.66 t |
| Other inventory | 66.92 t | 25.00 t |
| **Departure total** | **3,931.87 t** | **2,829.79 t** |
| Discarded empty acceleration storage/kit | 62.04 t | 32.60 t |
| Mass after interstellar braking | 904.63 t | 401.64 t |
| Conditional entry mass | 472.10 t | 213.67 t |
| Conditional touchdown mass | 376.38 t | 170.35 t |

Loaded main fuels include reserve. Dry mass now explicitly excludes both inventory and
chemical fuel, fixing the ambiguous S1 'dry plus nonpropulsion allocation' label.
Interstellar arrival mass includes the engine, reserves and retained stores; only the
listed landing package descends. Retained orbital hardware remains available in principle
but its descent, recovery and conversion to surface structures are not funded by this budget.

Fleet totals: **6,761.66 t departure**, **888.00 t dry hardware**, **5,444.12 t main fusion
fuel**, **92.34 t AM** and equal ordinary annihilation matter. Combined primary energy
is **35.02 ZJ**, of which **33.19 ZJ** is electricity manufacturing loaded AM. This is
equivalent to 52.6 TW over 20 years, not an actual factory timeline: cargo fuel must exist
before cargo departure, and crew-fuel production/storage must be separately scheduled.

Crew engine peak source power is 331.77 TW and initial thrust 6.97 MN. Engine mass with
allowance is 82.94 t; hot radiators 28.95 t, 4,632 m² planform, rejecting 7.56 GW.
Cargo source peak is 58.68 TW, engine 14.67 t with allowance, hot radiators 5.12 t,
819 m² planform and 1.34 GW heat. No full nozzle, support or cryogenic design establishes
these power densities. The 2 km assembly's structural allocation needs load verification.

## 5. Arrival and landing conditions

Baseline assumes an atmosphere capable of the proposed aerodynamic deceleration.
Proxima b's atmospheric state is not established; it must not be silently assumed
from the planet being in a habitable zone. Crew aeroshell allocation: 50 m diameter;
cargo: 35 m. Both are unqualified deployment/entry targets.

Main propulsion receives a 12 km/s capture/approach allowance from retained braking
reserve. Ideal required main propellant is only 0.078 t crew and 0.081 t cargo versus
29.1 t and 14.6 t braking reserves; this establishes fuel sufficiency, not a capture orbit.
Perform controlled orbital separation before atmospheric entry; no low-altitude main
engine disposal. A source-free chemical lander avoids an operating annihilation source
under the occupied landing vehicle.

Chemical terminal system: hydrolox, 450 s Isp, 1 km/s nominal delta-v, reserve equal to
10% of nominal burned fuel, tanks 8% of loaded fuel before 25% hardware allowance.
Unlike earlier approximate screens, retained reserve and tank mass are solved inside
the rocket equation. Crew loaded propellant splits into 90.25 t oxygen and 15.04 t
hydrogen. Cargo has 40.85 t oxygen and 6.81 t hydrogen. This is not 105 t of hydrogen.

Require powered handover at or below **350 m/s** and at or above **12 km altitude**.
Crew has four 3 MN engines, cargo four 1.5 MN engines. With one engine failed, the
constant-initial-mass vertical stopping screens require 8.28 km / 902 m/s for crew
and 6.52 km / 785 m/s for cargo, within the stated screen allocations. These are
neither an atmospheric-entry simulation nor full trajectory/terrain clearance checks.
The previous 400 m/s handover did not fit the enlarged crew lander's 1 km/s allowance.

A 6 km/s chemical vacuum-descent comparison increases crew core to about 3,674 t
and cargo core to 1,643 t before main propulsion. Existing engines/aeroshell budgets
would also need reconsideration; do not treat this as a ready airless alternative.

## 6. Radiation acceptance: the controlling open requirement

Adult lifetime planning allocation 1.2 Sv is divided into 600 mSv transit GCR,
20 mSv engine/service sources, 50 mSv forward secondaries, 30 mSv stellar events,
and 500 mSv surface/other exposure. These are design targets, not medical assurance.

With 19.523 onboard years including arrival allowance, GCR must average no more than
**0.08414 mSv/day**. The earlier NASA 20 g/cm² polyethylene reference rate of
1.04 mSv/day would integrate to **7.416 Sv**, or **12.36 times the allocation**.
This adult heliospheric reference is not a prediction or bound for the actual moving
interstellar ship. It nevertheless provides no basis to claim dose compliance.

The 30 t GCR equipment allowance and 44 t water inventory have no verified reduction
factor. Torpor occupancy cannot remove exposure unless the occupied bay actually
provides much lower dose. No active magnetic shield field, mass, power or validated
transport result exists in S2. Crew health and reproductive-bank integrity are therefore
NOT demonstrated. A specific transport-verified protection architecture is required
before any candidate enters the feasible set of the final optimization.

The follow-up [protection requirements review](PROTECTION_REQUIREMENTS.md) gives
occupancy limits, reuse-water geometry, published magnetic-shield findings and
the propulsion penalty of additional protection. It assigns no unverified dose credit.

## 7. Optimization checks and limitations

Reoptimized separate mixtures and symmetric burn durations for each vehicle after
adding the component ledger, exact landing reserves and source-shield heat. Rounded
crew inputs cost about 0.019% above the sampled minimum; cargo about 0.005%.
Retaining all acceleration storage instead gives 34.81 ZJ crew and 2.16 ZJ cargo,
versus 32.97 and 2.05 ZJ staged. This supports the selected staging within the current
objective, but does not value extra delivered metal or price extra manufacturing.

The engine/radiator mass feedback is piecewise affine because either burn can set
peak power. The solver now closes both peak-power branches, rather than fitting an
affine function across a possible branch switch. Tests verify mass closure and the
finite-burn rocket equation, not feasibility of the hardware coefficients.

The search does not optimize arbitrary thrust histories, multiple tank-drop events,
crew sociology, biological ageing, structural shape, fuel-production infrastructure
or transport-resolved shielding. It cannot establish a global optimum over those
unknowns. Crew count remains the selected 24, not a proven minimum viable population.

## 8. Acceptance register and next work

| Requirement | Current disposition | Evidence needed for acceptance |
|---|---|---|
| 20/40 y transfers and 20 y launch lead | Numerical trajectory checked | Navigation and control qualification |
| Fuel, tanks, engine and hot-radiator mass accounting | Closed under coefficients | Actual subsystem sizing and margins |
| Retained reserves and destination material | Explicitly accounted | Storage lifetime, separation and recovery plan |
| Healthy arrival / reproductive capability | **Unverified** | Interstellar transport, organ doses, health and reproductive validation |
| Atmosphere-assisted landing | **Conditional** | Destination atmosphere, entry/landing simulation and hardware qualification |
| 80% conversion with low hardware heating | **Hypothetical** | Coupled particle/thermal/nozzle analysis |
| 50% AM manufacture, tonnes-scale storage | **Hypothetical** | Factory and containment design with energy/loss budgets |
| Closed food loop and 20 y reliability | **Unqualified allocations** | Demonstrated yields, redundancy, maintenance and spares |
| Minimum total industrial energy | **Not established** | Fuel acquisition, storage and construction energy model |

Continue detailed work from S2 without representing these open requirements as passed.
Further numerical refinement of the engine mixture is not the limiting work: protection,
real source heat and landing conditions now control whether any final design exists.

Sources:
- NASA radiation reference: https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf
- NASA atmospheric uncertainty: https://science.nasa.gov/universe/exoplanets/eso-discovers-earth-size-planet-in-habitable-zone-of-nearest-star/
- NASA radiation transport context: https://pmc.ncbi.nlm.nih.gov/articles/PMC7236977/
