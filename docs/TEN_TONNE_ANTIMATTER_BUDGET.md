# Ten-tonne fleet antimatter cap: S3 what-if study

The cap applies to both ships together, including retained 2% main-fuel reserves.
It is not an adopted architecture change. Hardware allowance remains 10%; cargo
launches 20 Earth years before crew. Slowing cargo therefore changes its flight
duration to crew duration plus 20 years, not an independently chosen duration.

## Result

A 20-year crew flight does not fit the cap in the searched onboard propulsion
family. The sampled minimum is approximately 58.4 t fleet AM, even with increased
fusion loading. The selected 20-year energy optimum uses about 60.7 t. These are
conditional numerical results, not a universal bound on all propulsion concepts.

The 30-year/50-year pair can fit: a near-cap, minimum-energy search returns 9.990 t
AM, 14,090 t fusion, 15,126 t departure and 8.458 ZJ primary energy. This keeps the
S3 nonpropulsion core unchanged: additional life-extension hardware/inventories
are NOT included in that row. A minimum-AM search also finds a 29.5/49.5-year
candidate under the cap, but at roughly 26,000 t departure. Do not interpret that
single sample as the exact fastest feasible mission or a recommended design.

The lower-mass, lower-energy region is approximately 32-35 years crew flight:

| Crew / cargo Earth years | Loaded fleet AM | Loaded fusion | Fleet departure | Accounted primary energy |
|---|---:|---:|---:|---:|
| 32 / 52 | 9.773 t | 9058 t | 10022 t | 6.642 ZJ |
| 33 / 53 | 8.724 t | 8499 t | 9451 t | 6.072 ZJ |
| 35 / 55 | 7.034 t | 7609 t | 8542 t | 5.157 ZJ |

These three rows include a limited sensitivity: scale the existing 12 t crew
makeup/spares inventory and 1 t service-reactor fuel with Earth flight duration,
then resize landing propellant and main propulsion. This is NOT a demonstrated
loss rate, reactor lifetime or complete long-duration allowance. Cargo lifetime,
shielding, cryogenic reliability, food-production longevity and replacement
hardware remain unsized. Near-term comparison: 33/53 years provides some headroom
under the cap; 32/52 leaves only 0.227 t AM headroom after this simple adjustment.

## Example: 33-year crew and 53-year cargo

- Crew: 7697.6 t departure, 7016.3 t fusion, 8.211 t AM.
- Cargo: 1753.3 t departure, 1482.9 t fusion, 0.514 t AM.
- Matching ordinary annihilation matter equals AM mass and is included in departure.
- Crew peak speed .13259c, each main burn .925 Earth years, massive exhaust
  .07916c acceleration / .217c braking.
- Cargo peak speed .08130c, each burn .75 years, exhaust .07916c / .1055c.
- Acceleration is now almost ignition-only fusion; braking uses the stronger
  AM supplement. Low acceleration-phase exhaust consumes considerably more fuel.
- Crew elapsed onboard time including arrival is approximately 32.72 years.
  A 20-year-old departure passenger would be about 52.7 at arrival if no ageing
  reduction is credited. Frozen embryos do not prevent passenger ageing.
- Keeping the same 600 mSv transit GCR allocation requires approximately
  .05020 mSv/day instead of .08414 for S3's 20-year journey. Actual dose remains
  unknown; the extra exposure may require additional protection mass.

## Energy interpretation

At the existing hypothetical 50% manufacturing efficiency, producing 10 t AM
requires `2 * m_AM * c^2 / 0.5 = 3.595 ZJ`. This is about 5.70 TW averaged over
20 years. The factor two includes pair production; annihilation energy is not
counted a second time. Cargo fuel must be produced before its earlier departure.
Primary energy adds nominal fusion energy release, but acquisition, construction
and long-term storage power remain unpriced. A cap on AM mass is not a cap on
total energy or departure mass.

## Numerical scope and reproduction

`python -m calculations.antimatter_cap` regenerates the fixed-core duration sweep
in `reports/antimatter-cap.json`. `fleet(baseline, years, objective)` evaluates a
specified duration. `constrained(baseline,30,10)` searches the 30-year cap case by
varying the AM penalty in the energy objective. Results are in
`reports/antimatter-cap-30-constrained.json`; the limited life-extension sensitivity
is in `reports/antimatter-cap-life-sensitivity.json`, with its assumptions embedded.

The search covers symmetric burn durations .25-9 years initially and massive
exhaust from the fusion-ignition endpoint to .70c, with local refinement. Pure
electrically ignited fusion for each entire ship is also compared. It does not
exhaust arbitrary staging, thrust histories, phase-specific ignition technology
or objective nonconvexities. Lagrangian cap candidates are numerically feasible
samples, not a proof of the global constrained minimum.

S3 remains selected. Any adopted longer mission must update the habitat/service
lifetime, radiation budget, biological plan and cargo arrival operations together.
