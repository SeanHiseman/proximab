# S2 protection decision and redesign requirements

The current 20-year crew / 40-year cargo concept remains a conditional propulsion
and mass baseline. The protection review does not establish a healthy-arrival
design. In particular, do not turn the existing GCR equipment allowance into a
validated magnetic shield in the visual model.

Reproduce the arithmetic with `python -m calculations.protection_requirements`.
Inputs are the S2 specification and its generated report. Results are in
`reports/protection-requirements.json`. Regenerate the integrated report first if
changing S2. This calculation is not a particle-transport simulation.

## Decision

Continue with concentrated, multifunctional protection around occupied rooms,
using retained water and suitable inventories. Do not add a uniform water jacket
around the whole 750 m3 habitat. Investigate a magnet only as part of a combined
system; its reduction cannot be multiplied by a passive-shield reduction without
transporting the altered spectrum and secondary particles through both systems.

The protected rooms should support awake living, sleep and medical care. Protection
depends on location, not consciousness. Torpor has no intrinsic radiation credit;
spending ordinary sleeping hours inside a refuge has the same location benefit.
Very small protected volumes create a habitability tradeoff, not free protection.

## Required performance

S2 has 19.523 onboard years including arrival, or 7,130.8 days. The allocated
600 mSv transit GCR budget requires a mean effective dose of **0.08414 mSv/day**
(30.73 mSv/year). Allocating the entire 1.2 Sv lifetime allowance to transit would
double that rate but leave nothing for the other explicitly budgeted exposures.

NASA's adult reference at 20 g/cm2 polyethylene is 1.04 mSv/day, integrating to
7.416 Sv here. This is a heliospheric solar-minimum screening reference, not an
interstellar dose prediction, and is not automatically a water-shield rate.
Source: [NASA/TM-20220002905, Table 8.4-1, printed p.142](https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf).

For outside-room fraction f, the requirement is
`days * (f * outside_rate + (1-f) * protected_rate) <= 600 mSv`.
The calculation calls f the awake fraction to compare the earlier torpor proposal;
physically it is the fraction outside the better-protected room.

| Outside fraction | Outside rate, mSv/day | Dose outside alone, mSv | Maximum protected-room rate, mSv/day |
|---|---:|---:|---:|
| 25% | 1.04 reference proxy | 1,854 | Impossible even at zero inside |
| 10% | 1.04 reference proxy | 742 | Impossible even at zero inside |
| 5% | 1.04 reference proxy | 371 | 0.03383 |
| 25% | 0.52 hypothetical | 927 | Impossible even at zero inside |
| 10% | 0.52 hypothetical | 371 | 0.03571 |
| 5% | 0.52 hypothetical | 185 | 0.06120 |

The 0.52 cases are arbitrary half-rate sensitivities, not demonstrated magnetic
performance. Even an ideal zero-dose refuge permits only 8.09% outside occupancy
at the reference rate. A 95%-inside plan still needs the inside rate about 31 times
below that reference. This is not achieved merely by assigning 20 cm of water.

## Published magnetic results do not close this gap

The SR2S project reports approximately factor-two potential dose reduction for
its non-axial toroid concept, with secondary production and structural material
included in its assessment. It does not qualify the S2 allowance or geometry.
[SR2S final project report](https://cordis.europa.eu/project/id/313224/reporting).

A 2025 updated solenoidal analysis reports 240 mSv/year volume-average dose
equivalent for a 20 m tall, 3 T by 5 m example. Even a 10 T by 10 m example gives
188 mSv/year at its reference point; stronger fields have diminishing returns.
The paper revises overly optimistic earlier estimates. These are dose-equivalent
results in its own phantom/environment, not S2 NASA effective doses: do not combine
them numerically with our budget or extrapolate them into an S2 mass claim.
[Hesse-Withbroe and Arquilla, sections 4.3-4.4](https://arxiv.org/html/2509.09051v1).

Neither study establishes the required S2 protection. This is a limitation of the
reviewed candidates, not proof that every possible magnetic configuration fails.

## Reusing the existing 44 t water

Geometry-only comparison, water density 1 t/m3, full coverage including ends:

| Ideal protected geometry | 20 cm water | 40 cm water | 1 m water |
|---|---:|---:|---:|
| Two spheres, 64 m3 clear volume each | 33.5 t | 72.4 t | 225.5 t |
| One sphere, 750 m3 clear volume | 82.7 t | 171.3 t | 474.2 t |

Spheres provide compact geometric benchmarks, not fitted rooms in the existing
gravity discs. Two 4 m clear cubes need 42.368 t at 20 cm. All 44 t allows 20.70 cm;
retaining 8 t elsewhere for working inventory leaves 36 t and only 17.22 cm.
The 8 t split is a sensitivity, not a sized life-support requirement. Walls, tanks,
access and containment are additional; existing allocations require verification.
Each 64 m3 room would serve 12 people: 5.33 m3 per person before equipment.

Implementation rule: account for each kilogram once. Water in an operating loop
cannot simultaneously count as continuous wall coverage. Route circulation through
shield cells where practical, with isolation and minimum-fill requirements. Food,
waste and stores can supplement coverage only at their minimum retained inventory.
Fuel around a room may help while present, but evaluate depletion and the final
braking phase. The current fusion fuel is not interchangeable with a water shell.
Do not put antimatter containment beside the crew to obtain shielding credit.
Forward dust protection and engine shadow shielding remain separate directional
requirements; they do not provide all-sky GCR coverage.

## Cost of additional protection

Hold the selected trajectory, exhaust mixtures and optimistic coefficients fixed.
Add retained orbital protection mass including its own margin; resize propulsion,
reserves, tanks, engine and radiator through the existing mass feedback model.
Cargo is unchanged. No extra cryogenic/service power or landing capacity is charged:
these are mass-only sensitivities, not completed shield designs or new optima.

| Extra crew protection mass | Crew departure | Fleet antimatter | Fleet primary energy |
|---|---:|---:|---:|
| 0 t | 3,932 t | 92.34 t | 35.02 ZJ |
| 50 t | 4,254 t | 99.64 t | 37.73 ZJ |
| 100 t | 4,576 t | 106.94 t | 40.43 ZJ |
| 200 t | 5,220 t | 121.55 t | 45.85 ZJ |
| 500 t | 7,153 t | 165.37 t | 62.09 ZJ |

Each additional tonne costs about 6.44 t departure mass and 146 kg antimatter in
this fixed-profile model. The baseline already includes the unresolved 30 t GCR
hardware allowance with 25% margin, i.e. 37.5 t: replacement shields should charge
their net increment over that allowance, not add their full mass twice. No row
asserts a corresponding dose reduction.

## Concrete acceptance work package

1. Model both gravity modules, occupied locations, access paths and actual material
   composition in a coupled field/particle transport solver (e.g. Geant4). Include
   structural metal, coil material, tanks, water and body phantoms.
2. Use local interstellar spectra with protons, helium and heavier nuclei; transform
   incident energies and directions into the moving ship frame along the trajectory.
   Include particle secondaries. A heliospheric solar-minimum proxy is insufficient.
3. Evaluate start, coast and depleted arrival inventories; both engine orientations;
   nominal coils, failed coils and field-off. Calculate source-specific exposures
   separately and sum consistently using the stated adult effective-dose convention.
   Report organ doses and reproductive-bank absorbed doses separately.
4. Return position-dependent rates and uncertainty for occupied rooms. Use individual
   occupancy histories, including maintenance and emergencies, to check the budget.
   A central-point minimum is not a whole-habitat result.
5. Size coil supports, cryocoolers, power, quench containment, water cells and thermal
   equipment. Reinsert their mass and power in the fleet ledger; only then compare
   energy against other qualified protection architectures.

Until this work returns a compliant candidate, freeze propulsion as the **S2
conditional baseline**, keep actual dose null, and keep the healthy-arrival optimum
unset. The useful next design step is transport-verified occupied-room protection,
not selecting a smaller unsupported shield mass.
