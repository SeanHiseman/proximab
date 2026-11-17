# Awake habitat shielding trade — planning only

No viewer, selected ship specification or fleet mass ledger is changed. Reproduce with
`python -m calculations.awake_habitat_trade`; output is `reports/awake-habitat-trade.json`.

## Decision and assumptions

There is no feasible solution to the proposed 1.2 Sv adult lifetime constraint among
the passive shielding cases examined. A minimum-mass compliant arrangement therefore
cannot yet be specified. This does not establish impossibility for every conceivable
passive or active shield. A particle-transport model is needed before selecting one.

Use the selected 40-year flight (39.764 onboard years). For an optimistic feasibility
screen, allocate the entire 1.2 Sv to transit GCR: no prior dose, engine dose, stellar
events or surface exposure. These other exposures need allocations in a final budget.
Reserving 0.6 Sv for other exposures halves the allowed transit average from 0.08262
to 0.04131 mSv/day. This is a proposed adult planning tolerance, not a medical finding.
Children remain awake in this baseline; child torpor is an unresolved alternative.
No biological radiation protection from torpor itself is assumed.

## Dose and occupancy calculation

NASA/TM-20220002905 Table 8.4-1 gives adult-reference solar-minimum rates of 1.14,
1.04, 1.03 and 1.07 mSv/day for polyethylene columns of 10, 20, 40 and 60 g/cm².
These heliospheric rates are screening proxies, not actual interstellar predictions;
water shells cannot automatically inherit polyethylene performance.

Dose in Sv = days × [awake fraction × awake rate + (1 − awake fraction) × torpor rate] / 1000.

| Average adult awake fraction | Average awake adults | 20 g/cm² awake, 40 g/cm² torpor, Sv | Perfect zero-dose torpor, same awake shield, Sv |
|---|---:|---:|---:|
| 50% | 16 | 15.032 | 7.552 |
| 25% | 8 | 14.996 | 3.776 |
| 12.5% | 4 | 14.978 | 1.888 |
| 6.25% | 2 | 14.969 | 0.944 |

With a perfect torpor shield, adult awake time must be below 7.94% (3.16 years)
even when the entire lifetime allowance is spent in transit. At 6.25% awake, the
torpor rate must be at most 0.01880 mSv/day. The studied 40 g/cm² rate is 1.03:
about 55 times too high. Negative allowable torpor rates in the report mean awake
exposure alone exhausts the budget, not that negative radiation is physical.

Schedules apply per person, not just as a fleet average. They do not establish that
two or four adults can operate the ship and parent 32 children. Parenting shifts,
pregnancy, maintenance and emergency readiness require separate staffing validation.
If each adult needs five awake parenting years, even zero other awake time and
perfect torpor gives 1.899 Sv at the 20 g/cm² reference rate.

Twenty years continuously in the 20 g/cm² reference field gives 7.597 Sv using
adult conversion factors. This is only a duration comparison, not child dosimetry.
The adult 1.2 Sv allowance does not establish fetal or child acceptability. Reduced
adult wakefulness cannot resolve the children's exposure or remove their living space.

## Conditional geometry for a future visual redesign

Concentrate protected residence inside the two rotating modules. Each protected
cluster should combine 16 adult convertible sleep/torpor berths, 16 child sleeping
places, caregiving, hygiene and everyday activities. Share an outer shielding layer
between these functions instead of surrounding every room separately. Reserve
additional local shielding around torpor berths only if transport demonstrates useful
incremental protection. The large common volume can remain an optional, limited-time
destination; its occupancy still counts in each person's dose ledger.

Spherical water shells illustrate the geometric lower bound at fixed enclosed
volume (water density 1 t/m³). Tanks, supports, doors, penetrations and internal
floors are additional. Off-axis gravity, access and fit are not validated.

| Protected volumes | 10 cm water, t | 20 cm water, t | 40 cm water, t |
|---|---:|---:|---:|
| One 400 m³ room | 26.8 | 54.8 | 114.5 |
| Two 200 m³ clusters | 34.0 | 69.9 | 147.4 |
| Two 300 m³ clusters | 44.4 | 90.9 | 190.6 |
| Both full 800 m³ gravity modules | 84.8 | 172.6 | 357.1 |

Calculation: r = (3V/4π)^(1/3); water mass = n × 4π/3 × [(r+t)^3 − r^3].
One room saves area but does not preserve the current two-module gravity architecture.
Two 200 m³ clusters provide only 6.25 m³/person at 64-person occupancy, before
equipment; two 300 m³ clusters provide 9.375 m³/person. Neither is a validated
long-duration habitability minimum. Reducing awake adults from 16 to four changes
daytime occupancy with 32 awake children from 48 to 36, only 25%; it does not remove
berths, medical access or emergency capacity for the others.

Carry two 300 m³ clusters with a nominal 20 g/cm² hydrogen-rich column as a
conditional layout study, not an approved radiation solution or proven optimum.
Its exact 20 cm water-shell equivalent is 90.9 t, versus 172.6 t around both full
gravity modules. Reallocating the existing 44 t of water leaves 46.9 t of additional
water-equivalent shielding to supply. The old central refuge then loses that water;
do not retain its former shielding credit. This mass is inventory, not automatically
dry hardware. No fleet antimatter saving is claimed until its net mass and plumbing
are entered into the propulsion calculation.

Place retained water, food, waste and hydrogen-rich equipment around occupied
zones, without counting the same inventory twice. Required column must persist at
arrival, after food consumption and braking fuel depletion; credit fuel only with
a tank geometry and depletion history. Low-density hydrogen needs large tank volume
for a specified column. Thickness alone is not a material-independent dose predictor.

The 20 g/cm² case is a useful trade-study starting point because published improvement
from 20 to 40 is small; it is not a demonstrated universal optimum. For two 300 m³
water shells, doubling thickness adds 99.7 t. Do not assign that water the polyethylene
dose reduction without transport, or use exponential extrapolation to infer a compliant
thickness. Further reduction in occupied volume trades shielding mass against
habitability; without a minimum usable volume there is no unique geometric optimum.

## Requirements before selecting shielding

Use an interstellar spectrum transformed into the ship frame, material-resolved
geometry and secondary-particle transport. Track adult and age-specific child organ
doses by location, occupancy and mission phase. Model engine and forward-collision
radiation separately. No benefit is credited to the existing 30 t active-shield
placeholder until a field, structure, power system and transport result are specified.

Sources:
- https://www.nasa.gov/reference/4-0-human-performance/ (600 mSv career standard)
- https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf (Table 8.4-1)
