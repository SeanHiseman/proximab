# Minimum antimatter with bounded fusion feed

Objective: minimize antimatter, with fusion plus inert reaction feed no greater than the specified ceiling per ship. This supersedes the energy objective for this study; the selected S6 ship is not silently replaced.

Reproduce: `python -m calculations.minimum_antimatter`. Results: `reports/minimum-antimatter.json`. Reuses S6 core, eight tank drops per burn, 10% hardware allowance, zero main reserve, 80% coupling, optimistic engine/radiator/tank coefficients. Crew transfer 19.9 years plus 0.1 arrival; cargo 39.9 plus 0.1. Capture fuel and transport-qualified radiation protection remain unresolved.

## Crew trade

| Fusion plus inert ceiling t | Selected fusion t | AM t | Departure t |
|---|---:|---:|---:|
| 10,000 | 10,000.0 | 31.5421 | 10,721.0 |
| 20,000 | 20,000.0 | 23.7599 | 20,851.0 |
| 30,000 | 30,000.0 | 18.9928 | 30,985.5 |
| 50,000 | 48,033.9 | 17.7848 | 49,280.1 |
| 100,000 | 48,034.2 | 17.7848 | 49,280.4 |

All selected points use zero inert feed. Matching ordinary annihilation reactant equals AM mass and is included in departure totals. The ceiling is stronger than a fusion-only ceiling, preventing arbitrarily large inert feed from evading the mass constraint.

## Selected numerical minimum under 100,000 t

Three independent hybrid seeds and three diluted-feed seeds converge near 17.7848 t crew AM and 48,034 t fusion. Electrical-first-burn alternatives require about 18.0164 t AM. These checks support a numerical minimum within the existing architecture, not a universal propulsion lower bound. The optimum is interior to the fuel ceiling: extra fuel increases engine/radiator burden and does not reduce AM indefinitely.

Crew: 49,280.4 t departure, 670.6 t retained after braking, 179.7 t engine, 62.7 t hot radiators, 540.1 t staged storage/separation. Burns 2.085 years each; peak speed 0.2376c.

Cargo: zero antimatter, 4,067.2 t fusion, 4,373.4 t departure. Fusion-only result minimizes fusion among zero-AM cases. Fleet: 17.7848 t AM, 52,101.4 t fusion and 53,653.8 t departure.

## Fuel identity and economics

The modeled Q=0.00392 corresponds to ideal D-He3 fusion, approximately 40% deuterium and 60% helium-3 by mass, not ordinary hydrogen. The reaction releases about 18.35 MeV in charged products. Side reactions and incomplete burn are not fully engineered in the model. At the selected crew fuel quantity this means approximately 19,214 t D and 28,821 t He3. Cargo adds approximately 1,627 t D and 2,440 t He3.

Deuterium can be extracted from water. Helium-3 is scarce: DOE currently recovers it from tritium decay and supplies thousands of liters annually. A mission at this scale requires a new He3 production/extraction industry; future delivered prices are unknown. Nuclear breeding from deuterium is a possible route, not an industrial solution already available.

Fusion energy released aboard is not the same as factory energy required to acquire fuel. A minimum-total-energy optimum cannot be used as a minimum-procurement-cost optimum. The new objective deliberately treats fuel mass as a constraint and AM as the quantity to minimize.

Sources:
- NASA D-He3 reaction and lunar extraction study: https://ntrs.nasa.gov/api/citations/20210022802/downloads/2021-ASCEND-Olson_211018.pdf
- DOE He3 supply: https://www.isotopes.gov/Supply-and-Demand-of-Helium-3
- IAEA deuterium supply and fusion fuels: https://www-pub.iaea.org/MTCD/Publications/PDF/FusionOutlook2023_web.pdf
- UKAEA reaction channels: https://github.com/ukaea/PROCESS/blob/main/documentation/source/physics-models/fusion_reactions/plasma_reactions.md
- CERN antimatter production: https://home.cern/science/physics/antimatter/
