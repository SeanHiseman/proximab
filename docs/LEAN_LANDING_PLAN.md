# S6: fuel shielding and lean landing plan

Selected conditional plan. Supersedes S5 water disposition and crew descent budget; S5 remains a historical comparison. Reproduce with `python -m calculations.lean_landing_plan`. Inputs: `data/lean_landing_plan.json`; results: `reports/lean-landing-plan.json`.

## Adopted planning changes

- Remove 36 t dedicated shielding water at departure. Retain 8 t working water, all landed; adequacy remains unverified.
- Arrange existing D?He3 braking fuel around occupied/torpor compartments, consume surrounding tanks last and stage empty tanks. Final tank geometry, gaps, support and plumbing mass are unresolved; no radiation dose credit.
- Retain working water, landing propellant and suitable stores around occupied areas through final braking. Retain the existing 33 t GCR equipment allowance and engine/forward shielding; do not claim these meet the dose target.
- Select 450 s chemical crew landing at a conditional 500 m/s total powered delta-v, including losses. Target atmospheric handover at 300 m/s rather than 350 m/s. This is a trajectory requirement, not demonstrated atmospheric performance.
- Keep cargo landing at 1000 m/s. Keep 10% hardware allowance, 10% landing contingency, zero main reserve and eight tank drops per burn.
- Keep 900 s nuclear thermal landing at 1000 m/s as an alternative only. Its 30.2 t hydrogen loading assumes unchanged tank fraction; net added hardware must be below 33.8 t to beat S5. Reactor, tank and shielding masses are not sized; no saving stacked with atmospheric braking.

## Component mass breakdown

All masses tonnes. Fixed hardware rows include 10% allowance. Inventories and propellant do not.

| Crew fixed hardware | Mass | Disposition |
|---|---:|---|
| Pressure envelopes, floors and frames | 55.000 | Land |
| Spin, bearings and transfers | 13.200 | Land |
| Adult furnishings and exercise | 8.800 | Land |
| Life support and two food-production trains | 24.200 | Land |
| Medical, 24 berths and two reproductive banks | 11.000 | Land |
| Habitat service fission-electric unit | 16.500 | Land |
| Transit backup fission-electric unit retained in orbit | 16.500 | Orbital assembly |
| Service thermal management and distribution | 11.000 | Land |
| Avionics, communication and autonomy | 4.400 | Land |
| Landing cradle and chemical engines | 19.800 | Land |
| Deployable aeroshell and fresh TPS | 13.200 | Land |
| Arrival separation and power transfer | 8.800 | Land |
| Water storage and plumbing | 6.600 | Land |
| Forward shield face and supports | 36.831 | Orbital assembly |
| Remote engine tow assembly | 29.700 | Orbital assembly |
| Fixed main-feed and deployment services | 8.800 | Orbital assembly |
| Engine shadow shields and neutron-layer allowance | 47.080 | Orbital assembly |
| Unresolved GCR equipment allowance, no dose credit | 33.000 | Orbital assembly |

| Crew inventory | Mass |
|---|---:|
| Crew body mass | 1.920 |
| Habitat working and landing water | 8.000 |
| Cabin and reserve gases | 3.000 |
| Emergency food | 4.000 |
| Food-loop inventory | 1.000 |
| Twenty-year makeup supplies and replaceable spares | 12.000 |
| Service reactor fuel | 1.000 |

## Complete modeled vehicle totals

| Quantity | Crew | Cargo |
|---|---:|---:|
| Fixed hardware including landing tanks | 367.068 | 168.983 |
| Main engine | 115.838 | 20.031 |
| Main hot radiators | 40.432 | 6.991 |
| Retained dry hardware | 523.337 | 196.006 |
| Staged tanks, containment and separation | 301.835 | 46.790 |
| Departure dry hardware | 825.172 | 242.795 |
| Inventory including people | 30.920 | 25.000 |
| Landing propellant loaded | 30.197 | 45.266 |
| Fusion fuel | 26,259.564 | 4,093.599 |
| Antimatter | 20.000 | 0.000 |
| Ordinary annihilation reactant | 20.000 | 0.000 |
| Departure total | 27,185.853 | 4,406.660 |
| Retained after main braking | 584.454 | 266.271 |
| Landed dry hardware | 195.157 | 132.683 |
| Entry package | 256.274 | 202.949 |
| Touchdown including landing contingency | 228.823 | 161.798 |

Subtotal rows overlap: departure = departure dry + inventories + landing propellant + fusion + antimatter + matching ordinary matter. Retained after braking is not dry mass. No main propulsion fuel remains; the landing load is separate.

## Trajectory and limitations

Selected crew burns last 1.75 years each; coast 16.4 years; arrival operations 0.1 year. Peak speed 0.233294c. Exhaust speeds 0.079165c outbound and 0.311679c braking. Cargo departs 20 years earlier and takes 40 years. Selection minimizes primary energy among feasible sampled burn durations (1.25, 1.5, 1.75, 2, 2.075, 2.25, 2.5 years), using the existing exhaust search at a 20 t fleet cap. This is not a global optimum.

Fleet: 30,353.163 t fusion, 20 t AM, 20 t matching ordinary reactant; 31,592.513 t departure. Modeled primary energy 17.884 ZJ assumes 50% AM manufacturing efficiency and excludes construction, fuel acquisition and storage costs.

80% directed-exhaust coupling from supplementary annihilation remains hypothetical. The existing engine specific power, heat leakage and tank coefficients are optimistic. This is a conditional transfer mass estimate, not a complete validated surface-delivery fuel budget: the separately listed 12 km/s capture/approach allowance has not been integrated into the trajectory or charged to the fuel. There is no hidden reserve to pay it. Added fuel-shield layout hardware is not yet sized. Radiation dose, water sufficiency, entry trajectory and long-term system reliability remain unresolved.

The 3D viewer geometry remains historical; only the planning summary is updated.

## Research references

- NASA nuclear thermal propulsion briefing: https://www.nasa.gov/wp-content/uploads/2015/03/nac_april_2019_mitchell_ntp.pdf
- NASA propellant-shielding study, including loss of protection during final burn: https://ntrs.nasa.gov/api/citations/20190032344/downloads/20190032344.pdf
