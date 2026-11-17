# Requirements for 20-year crew flight and 10 t fleet antimatter

What-if study against S3, not an adopted design. Numerical results:
`reports/twenty-year-ten-tonne-requirements.json`. Cargo remains a 40-year flight
launched 20 years before the crew. Loaded AM includes main-burn reserves.

## Existing mass definitions

| Mass category, tonnes | Crew | Cargo |
|---|---:|---:|
| All dry hardware including propulsion, tanks and 10% allowance | 528.909 | 213.798 |
| Fixed dry hardware including chemical tanks, excluding main propulsion hardware | 371.562 | 168.983 |
| People / supplies / other inventories | 66.920 | 25.000 |
| Chemical landing propellant | 81.260 | 45.266 |
| Nonpropulsion core used to size the main engine | 519.742 | 239.249 |

The fixed-dry row is a subset of all dry hardware. The core is fixed dry plus
inventories plus chemical fuel; it does not contain main propulsion fuel, main
engine/radiators or main fuel storage. Main propulsion hardware is resized by the
mass-closure solver. Total fleet dry hardware is 742.707 t, not a 300 t payload.

## Required crew core at current propulsion coefficients

Reoptimize burn duration and exhaust mixtures for minimum loaded antimatter.
For each selected profile, solve its affine AM/core relationship for the target
core, then repeat optimization at that core (four iterations).

| AM assigned to crew | AM assigned to cargo | Maximum sampled crew core | Reduction from S3 |
|---|---|---:|---:|
| 10 t | 0 t, hypothetical fusion-only cargo comparator | 87.449 t | 83.2% |
| 8.095 t | Current S3 cargo 1.905 t | 70.444 t | 86.4% |

Fusion-only cargo can mathematically close at 40 years under S3 coefficients but
uses more fusion fuel and a heavier spacecraft. Its qualification is not established.
The first row is therefore the generous AM allocation to the crew, not a free
cargo ship. Each row preserves the current 5.5 t separation kit and rescales
propulsion hardware; it is not obtained by scaling a mass ratio alone.

These core thresholds are NOT allowable total dry masses. At 87.449 t core,
the model has 122.720 t combined dry hardware plus core inventories/chemical fuel,
882.588 t departure and 739.868 t fusion fuel. A real dry mass would subtract the
specified inventories and chemical fuel from 122.720 t.

Holding the existing 66.92 t inventory while deleting ALL fixed crew hardware
still leaves an 88.363 t core once chemical fuel and its tanks are included.
That deliberately nonphysical diagnostic exceeds the generous 87.449 t threshold.
Therefore trimming hardware alone cannot meet the cap with the current inventories
and landing assumptions. Actual habitat, protection and life-support hardware
cannot be zero; a viable package would need radically different requirements.

## Technology sensitivities with full S3 crew core

| Independently changed assumption | Minimum sampled crew AM |
|---|---:|
| Current coefficients | 58.426 t |
| Both fusion and annihilation coupling 100%, instead of 80% | 41.992 t |
| Tenfold engine source-specific power, 50 instead of 5 GW/kg | 50.395 t |
| No main propulsion fuel reserve | 25.362 t |
| Tenfold engine specific power plus half ordinary tank and AM containment coefficients; retain 2% fuel reserve | 48.481 t |

These numbers exclude cargo AM. No row is a technology forecast or hardware
qualification. They retain other coefficients, notably intercepted source heat.
Deleting the reserve gives approximately 66,924 t crew departure and 65,278 t
fusion fuel: it is not a proposed mission. The sensitivities are not additive.

The coupling sensitivity required correcting the search's lower exhaust endpoint
to follow its actual fusion-coupling input; otherwise a perfect-coupling search
would omit its ignition-only boundary. Existing 80% cases are unchanged.

## Interpretation

With current modeled technology, satisfying both targets means a radically smaller
mission: order 70-87 t for the entire crew core rather than 520 t. No such qualified
24-adult, 20-year, landed-habitat design has been established. The numbers do not
prove every imaginable onboard engine or staging architecture impossible; they
show that ordinary mass trimming or coupling improvements do not close this design.

If retaining the current habitat and population, meeting the cap would require
a new propulsion/staging architecture with substantially different demonstrated
performance, or relaxing the fully onboard requirement. External assistance must
still be charged to civilization-wide energy investment. Better AM manufacturing
efficiency reduces factory energy but does not change the grams of AM needed for
a fixed ship, trajectory and propulsion system.

Radiation hardware remains unqualified in S3 and could increase the core further.
The selected architecture and viewer are unchanged by this study.
