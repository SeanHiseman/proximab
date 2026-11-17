# Selected staged design baseline S1

Historical baseline: S2 in `INTEGRATED_DESIGN_SPECIFICATION.md` supersedes these
budget figures with an explicit component ledger, landing fuel and cargo vehicle.
S1 is retained to show the effect of its earlier 300 t core allocation.

Decision: freeze a fully onboard, two-burn fusion–antimatter concept with one empty-
storage staging event after acceleration. This replaces external launch as the
selected architecture. It is a concrete optimistic baseline, not flight qualification.
Reproduce with `python -m calculations.staged_baseline`; results are in
`reports/staged-baseline.json`. The viewer mission panel uses this calculation;
existing 3D engine/tank dimensions remain reference geometry pending layout work.

## Mission and retained requirements

24 adults, no births during transit, two reproductive-bank locations, 750 m³ usable
habitat allocation and two gravity modules. Crew flight 20 Earth years; cargo leaves
20 years earlier for a 40-year flight and arrives together. Cargo propulsion has not
been resized by this crew-vehicle calculation. Births follow a protected settlement.
The adult lifetime planning allowance remains 1.2 Sv with 0.6 Sv allocated to transit
GCR; actual dose is unresolved. Torpor provides no assumed slowed ageing or biological
radiation protection. The 300 t nonpropulsion allocation is not a completed mass ledger.

## Frozen optimistic inputs

| Input | Selected value |
|---|---:|
| Fusion release / fuel rest energy | 0.00392, complete-burn D–He3 model |
| Fusion energy coupled to directed massive exhaust | 80% |
| Additional annihilation energy coupled to directed massive exhaust | 80% |
| AM manufacturing efficiency | 50% |
| Ordinary tank mass / ordinary fuel mass | 1% before hardware allowance |
| AM containment hardware / AM mass | 0.5 kg/kg before hardware allowance |
| Engine specific source power | 5 GW/kg |
| Source power deposited as modeled hot-system heat | 0.001% (10 ppm) |
| Hot radiator temperature / emissivity | 2,000 K / 0.9 |
| Two-sided radiator areal mass | 5 kg/m² planform |
| Propulsion hardware development allowance | 25% |
| Fuel reserve | 5% of nominal expenditure, all retained |
| Separation assembly | 5 t before allowance |
| Nonpropulsion allocation | 300 t, including living systems, protection and arrival inventory |

These are hypothetical target capabilities, not current performance or independently
validated compatible assumptions. In particular 80% annihilation coupling plus only
10 ppm hardware heating requires a mechanism that directs/converts energy into exhaust
while avoiding structural gamma/neutron heating. That mechanism is not demonstrated.
The heat fraction must eventually include engine shielding and all intercepted radiation;
it cannot simply omit them. Rejected conversion energy otherwise leaves the model
isotropically. Service heat, cryogenic power and low-temperature radiators are not
derived from the 2,000 K hot-system radiator calculation.

No perfect engine, zero tank mass, instantaneous acceleration or discarded reserve
fuel is assumed. Tanks and containment are included with allowance, so the effective
ordinary-storage fraction is 1.25% and AM containment ratio 0.625 kg/kg.

## Flight sequence

- Crew year 0–1.25: accelerate at 0.181 Earth g to 0.22714 c.
- At year 1.25: discard 28.34 t empty acceleration storage plus 6.25 t separation
  hardware. Retain the propulsion plant, braking storage and dedicated reserve stores.
- Year 1.25–18.65: coast for 17.4 years.
- Year 18.65–19.9: brake at the same proper acceleration.
- Year 19.9–20: arrival-operations allowance; capture, descent and surface delivery
  require a separately closed trajectory/inventory budget.

Onboard elapsed transfer time is 19.423 years, before arrival operations. Exhaust
speed is 0.24 c during acceleration and 0.47 c during braking; corresponding effective
exhaust speeds including waste mass-energy are 0.23826 c and 0.45660 c. These are
fuel-mixture outputs of the energy model, not independent free performance gains.
AM/fusion mass ratio is 1.679% for acceleration, 8.080% for braking; equal ordinary
annihilation matter is supplied separately.

The initial grid varied each burn duration from 0.5–5 years and each exhaust speed
from 0.08–0.56 c, then refined locally. Inputs are rounded to 1.25 years, 0.24 c and
0.47 c, with all masses recalculated; the energy penalty versus the sampled numerical
minimum is about 0.025%. This is not a global optimum over arbitrary thrust histories,
staging counts or propulsion technologies.

## Fuel and hardware budget

| Item | Tonnes |
|---|---:|
| Fusion fuel loaded, including reserve | 1,546.66 |
| Antimatter loaded, including reserve | 42.87 |
| Ordinary annihilation reactant loaded, including reserve | 42.87 |
| Nonpropulsion allocation | 300.00 |
| Engine hardware, including allowance | 41.11 |
| Hot radiators, including allowance | 6.29 |
| Nominal acceleration storage, including allowance | 28.34 |
| Nominal braking storage, including allowance | 16.11 |
| Retained dedicated reserve storage, including allowance | 2.22 |
| Separation assembly, including allowance | 6.25 |
| **Departure mass** | **2,032.73** |

Rounded rows may differ slightly from the total. The combined nonpropulsion allocation
plus dry propulsion/storage hardware is 400.32 t. This is not a certified dry mass:
the 300 t allocation contains unspecified consumables and arrival inventory.

Nominal acceleration consumes 1,221.37 t fusion fuel and 20.50 t each of AM and
ordinary annihilation reactant. Braking consumes 251.64 t fusion fuel and 20.33 t
each annihilation reactant. The retained reserve is 77.73 t: 73.65 t fusion fuel plus
2.04 t AM and 2.04 t matching matter. After braking, 443.47 t remains, including all
reserve fuel, braking/reserve stores, engine and radiators. This is destination mass,
not touchdown mass. No landing or controlled disposal credit is taken automatically.

## Power, thermal and industrial energy

Peak nuclear-plus-annihilation source power is 164.45 TW; initial thrust is about
3.60 MN. At 5 GW/kg this implies 32.89 t bare engine, or 41.11 t with allowance.
At the assumed heat interception fraction, the hot system rejects 1.645 GW through
1,007 m² two-sided radiator planform: 5.04 t bare, 6.29 t with allowance.

Manufacturing all loaded AM at 50% efficiency requires 15.414 ZJ of electricity.
Nominal onboard fusion releases 0.519 ZJ, giving 15.932 ZJ combined primary energy
before isotope acquisition, construction and continuing storage power. Manufacturing
over 20 years corresponds to about 24.4 TW average factory power for this crew ship.
Annihilation energy is not added again; it was purchased in the manufacturing term.
Reserve AM production is charged even though reserve fuel is not nominally burned.
The result excludes the separate cargo mission.

## Closure and sensitivity

The core carried through both burns includes power hardware, retained reserve fuel
and dedicated reserve storage. For each candidate mixture/trajectory, required core
mass is an affine function of carried core mass. Solve the fixed point analytically;
reject slope >=1. Nominal feedback slope is 0.2958. Nominal storage development
allowance stays with its tanks, while reserve stores are retained throughout.

At fixed selected trajectory and mixtures:

| Changed assumption | Departure t | Loaded AM t | Combined energy ZJ |
|---|---:|---:|---:|
| Selected baseline | 2,033 | 42.9 | 15.93 |
| Manufacture efficiency 30% | 2,033 | 42.9 | 26.21 |
| Manufacture efficiency 80% | 2,033 | 42.9 | 10.15 |
| Engine 2 GW/kg | 2,551 | 53.9 | 20.01 |
| Engine 1 GW/kg | 4,437 | 93.8 | 34.85 |
| Deposited source heat 0.01% | 2,499 | 52.7 | 19.60 |
| Deposited source heat 0.1% | No finite mass closure | — | — |
| Ordinary tanks 3% before allowance | 2,221 | 45.9 | 17.06 |
| Nonpropulsion allocation 450 t | 3,037 | 64.1 | 23.84 |
| Nonpropulsion allocation 600 t | 4,042 | 85.4 | 31.75 |

Failure at fixed coefficients/trajectory does not establish impossibility of all
alternative designs. It identifies which assumed capabilities the selected design
depends on. No energy benefit from repurposed tanks is subtracted from the production
budget; retained material is available for later use subject to landing/recovery.

## What is frozen and what remains open

Freeze mission, staging event, two mixtures, burn durations and optimistic coefficient
set as S1. Use approximately 2,030 t departure and 43 t loaded AM as the conditional
crew-ship baseline. Do not keep changing these silently in later visual work.

Before calling this a final healthy-colonist design, resolve:
1. Interstellar radiation transport and protection mass within or above the 300 t allocation.
2. Engine energy conversion, structure, source shielding and actual deposited heat.
3. AM containment and long-duration cryogenic operation; current storage is microscopic.
4. Complete fusion burn, ignition reliability and helium-3 acquisition.
5. Capture/landing and delivery or reuse of retained storage; independent surface survival.
6. Cargo propulsion and a fleet-wide industrial energy budget.

Source context: NASA's hybrid concepts remain research studies, not engines at these
ratings: https://www.nasa.gov/general/radioisotope-positron-propulsion/
Current antimatter context: https://home.cern/science/physics/antimatter/
