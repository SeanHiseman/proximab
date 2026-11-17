> S3 component reference. The newly selected 20 t, zero-main-reserve target is documented in [the efficiency research](FUSION_EFFICIENCY_RESEARCH.md); its 500 t retained allocation is not yet component-closed.

# S3 - lean cargo-first integrated specification

Selected conditional architecture, not a qualified healthy-arrival optimum. This supersedes S2 for current budgeting. S2 inputs, results and specification are preserved with `_s2` / `-s2` / `_S2` suffixes; historical fuel and protection comparisons remain pinned to S2.

## Selected decisions

- 24 adults, 20-year crew flight, 40-year cargo flight launched 20 years earlier; births after settlement.
- 10% hardware allowance applies consistently to fixed components, main engines, radiators, tanks, containment and staging equipment.
- Main propulsion fuel reserve is 2% of nominal consumption, with retained reserve storage. Chemical landing reserve remains 10% of nominal chemical burn, as in the accepted lean comparison.
- Cargo carries the entire formerly crew-carried 8 t base surface exploration/repair package (8.8 t with allowance). All other separately budgeted heavy industry, expansion and surface-support payload was already on cargo.
- The crew forward collision shield stays in orbit after braking. Its 33.4824 t base mass is still carried throughout transit; it no longer increases chemical landing fuel. Fresh atmospheric TPS remains on the lander.
- The same transit habitat lands with the crew. Food production, service power, medical facilities, gravity machinery, transit spares and working inventories remain necessary onboard.
- No unsupported mass reduction is credited for inflatable pressure envelopes, narrower frontal area, fewer bearings, new tank materials or improved engine performance. These are sizing tasks, not completed hardware improvements.

## Current mass ledger

All masses below are tonnes. Fixed hardware includes 10% allowance. Flags designate landing package versus retained orbital equipment.

### Crew ship

| Fixed component | Mass with allowance | Disposition |
|---|---:|---|
| Pressure envelopes, floors and frames | 55.000 | Lands |
| Spin, bearings and transfers | 13.200 | Lands |
| Adult furnishings and exercise | 8.800 | Lands |
| Life support and two food-production trains | 24.200 | Lands |
| Medical, 24 berths and two reproductive banks | 11.000 | Lands |
| Two service fission-electric units | 33.000 | Lands |
| Service thermal management and distribution | 11.000 | Lands |
| Avionics, communication and autonomy | 4.400 | Lands |
| Landing cradle and chemical engines | 19.800 | Lands |
| Deployable aeroshell and fresh TPS | 13.200 | Lands |
| Arrival separation and power transfer | 8.800 | Lands |
| Water storage and plumbing | 6.600 | Lands |
| Forward shield face and supports | 36.831 | Orbit |
| Remote engine tow assembly | 29.700 | Orbit |
| Fixed main-feed and deployment services | 8.800 | Orbit |
| Engine shadow shields and neutron-layer allowance | 47.080 | Orbit |
| Unresolved GCR equipment allowance, no dose credit | 33.000 | Orbit |

| Departure category | Mass |
|---|---:|
| All dry hardware, including propulsion and tanks | 528.909 |
| Inventories / people | 66.920 |
| Chemical landing propellant | 81.260 |
| Fusion fuel including reserve | 3472.233 |
| Antimatter including reserve | 58.804 |
| Matching ordinary annihilation reactant | 58.804 |
| **Departure total** | **4266.931** |

Entry package 364.331 t; nominal touchdown 290.458 t. Landing reserve included; ablation and inventory depletion not resolved.

### Cargo ship

| Fixed component | Mass with allowance | Disposition |
|---|---:|---|
| Industry and resource processing | 33.000 | Lands |
| Heavy exploration | 11.000 | Lands |
| Surface habitat expansion | 16.500 | Lands |
| Food and life-support backup | 16.500 | Lands |
| Surface power and services | 16.500 | Lands |
| Landing structure, engines and aeroshell | 26.400 | Lands |
| Spine, autonomy and maintenance equipment | 11.000 | Orbit |
| Forward shield and support | 5.500 | Orbit |
| Remote propulsion support | 11.000 | Orbit |
| Feed, electronics and source protection | 8.800 | Orbit |
| Transferred initial surface exploration and repair | 8.800 | Lands |

| Departure category | Mass |
|---|---:|
| All dry hardware, including propulsion and tanks | 213.798 |
| Inventories / people | 25.000 |
| Chemical landing propellant | 45.266 |
| Fusion fuel including reserve | 2126.232 |
| Antimatter including reserve | 1.905 |
| Matching ordinary annihilation reactant | 1.905 |
| **Departure total** | **2414.106** |

Entry package 202.949 t; nominal touchdown 161.798 t. Landing reserve included; ablation and inventory depletion not resolved.

## Optimization choice

The original profiles with S3 equipment and allowances yield 4,881.48 t fleet departure, 64.934 t antimatter and 24.663 ZJ accounted primary energy. Reoptimizing for primary energy gives **6,681.04 t, 60.709 t antimatter and 23.759 ZJ**. The selected heavier fleet uses more fusion reaction mass to reduce antimatter production energy. This saves about 3.7% accounted energy over the lighter alternative; construction and fuel-acquisition energy remain unpriced, so this is not a global industrial optimum.

Crew: 1.25-year burns, .22714c peak ship speed, massive-exhaust speeds .19c acceleration and .43c braking. Cargo: .75-year burns, .10830c peak ship speed, .08c/.16c exhaust. Main transfer durations remain 19.9/39.9 years plus .1 year arrival operations.

## Cargo-first arrival operations

1. Both vehicles reach the system within the shared arrival window; the 20-year launch lead is unchanged.
2. Cargo executes descent first and confirms power, supplies, landing-site conditions and required surface services locally.
3. The crew stays aboard its independently powered transit habitat until those conditions are confirmed, then separates the habitat landing package and descends.
4. If cargo fails, crew descent is held for assessment. Neither indefinite orbital survival nor return to Earth is claimed. Simultaneous system arrival does not verify cargo success before crew departure.

The .1-year arrival allowance is retained, not an established commissioning schedule. A timed cargo deployment and recovery plan is still required. Cargo robotics and surface power allocations must be sized for autonomous setup.

## Engineering changes and limits

The fixed base hardware total is conserved by the transfer. The reduction comes from lower allowances, changed fuel reserves, removing the collision shield from the landed package, and optimizing the resulting propulsion mixture. No component is silently deleted. General transit maintenance remains in the crew spares inventory; transferred repair equipment is the separately labeled surface package.

Two reproductive banks remain in their separated transit locations because their current medical allocation has no supported transferable component breakdown. Moving them requires dedicated cargo cryogenic, service-power and radiation sizing for a 40-year flight; no arbitrary mass credit is assigned.

Further design work: integrate pressure shell/floors and landing load paths; optimize spin interfaces; develop a service-load inventory; route retained water/stores around occupied rooms; size the forward shield to a physically fitting geometry; optimize engine shadow geometry and radiator heat interception. Validate each change before reducing its allocation.

## Acceptance and reproduction

Run `python -m calculations.integrated_specification`, then `python mission-viewer/sync_data.py` and `python mission-viewer/pack_standalone.py`. Current inputs: `data/integrated_specification.json`; output: `reports/integrated-specification.json`.

Tests cover ledger closure, transferred mass, allowance propagation, retained braking reserves and simple landing thrust screens. They do not qualify structural sizing or technology. The viewer displays S3 numerical budgets; existing 3D engine/tank/landing geometry is still labeled historical reference, not a new dimensioned S3 assembly.

Radiation remains unresolved: the required GCR mean is 0.08414 mSv/day, actual dose is null, and the GCR equipment allowance has no verified protection credit. The previous protection review remains a historical S2 requirements study. Atmospheric entry, 80% propulsion coupling, very low heat interception, tonnes-scale antimatter containment, food-loop reliability and component masses also remain conditional.
