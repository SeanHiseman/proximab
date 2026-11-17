# Selected 20 t AM target: efficiency calculation and research audit

The selected fleet budget is **20 t antimatter**, zero unused main-propulsion fuel,
and eight empty-tank drops per burn. The crew transfer retains the 500 t allocation,
20-year elapsed time and 1.25-year main burns. The optional 40-year electrically
ignited fusion cargo uses no AM. These are selected requirements, not demonstrated
hardware. The optimistic 80% annihilation coupling remains a target only.

Reproduce with `python -m calculations.fusion_efficiency`. Results and stage ledgers
are in `reports/fusion-efficiency.json`. The architecture and viewer now identify
the 20 t choice and the unresolved coupling. S3 is a previous component reference,
not a completed 500 t component design.

## What efficiency means

Three different quantities must not be conflated:

1. Source-to-directed-exhaust conversion: what fraction of released nuclear energy
   becomes useful exhaust energy. The previous model ASSUMED 80% for both fusion
   and supplementary annihilation; it did not calculate an improvement to fusion.
2. Propellant economy: momentum obtained per unit expelled mass. Added energy can
   raise effective exhaust velocity and reduce the rocket-equation fuel burden.
3. Mission primary energy: fusion release plus AM manufacturing, counted once.
   This differs from both source conversion and minimum departing mass.

The electrically ignited comparator assumes fusion gain 1000, driver efficiency
20%, generator efficiency 40%, fusion directed-energy coefficient 80%, and
recirculation deducted from jet energy. Its net source-to-jet coefficient is
78.75%. All are model assumptions; the comparison is not against an existing engine.

## Exact model comparison, not exact physical performance

| Quantity | Electrical fusion only | Selected 20 t AM, 80% coupling target |
|---|---:|---:|
| Massive exhaust during acceleration | .078547c | .081265c |
| Massive exhaust during braking | .078547c | .355198c |
| Fusion fuel | 193219.5 t | 17017.5 t |
| AM | 0 | 20 t |
| Matching ordinary annihilation matter | 0 | 20 t |
| Departure mass, including staged tanks | 195846.7 t | 17757.7 t |
| Fusion plus AM manufacturing energy | 68.074 ZJ | 13.186 ZJ |

Thus the assumed hybrid uses 91.19% less fusion fuel (11.35 times less), and 80.63%
less accounted primary energy. Massive-exhaust speed is 3.46% higher during
acceleration and 4.52 times as high during braking. The effective momentum-exhaust
speed also counts annihilated mass and isotropically lost source energy: selected
values are .081197c and .349500c. It is not identical to the massive-particle speed.

The fusion-only engine/hot-radiator estimate is 1542.8 t, which cannot fit in its
fixed 500 t retained allocation. The hybrid estimate is 142.6 t, leaving 357.4 t
for other systems. Therefore this is a matched fixed-retained-mass rocket comparison,
not two component-closed spacecraft. Both cases exclude extra arrival maneuver
fuel beyond the modeled interstellar burns and remain radiation-unqualified.

## Energy accounting for the optimistic selected case

- Fusion release: 5.9955 ZJ.
- Annihilation release: 3.5950 ZJ from 20 t AM plus 20 t ordinary matter.
- AM manufacture: 7.1900 ZJ at the assumed 50% pair-production efficiency.
- Accounted primary input: 13.1855 ZJ, NOT input plus annihilation release again.
- Summed local directed-exhaust energy: 7.6676 ZJ, after deducting the assumed
  ignition allocation. This is bookkeeping across instantaneous ship frames,
  not a single-frame final spacecraft kinetic energy or payload efficiency.
- Source-to-jet ratio: 79.95%; accounted primary-to-local-jet ratio: 58.15%.

Compared with fusion-only's assumed 78.75%, the model's source conversion improves
only 1.20 percentage points. The large mission benefit instead comes from higher
braking exhaust speed and not having to accelerate so much braking fuel.

Antimatter spent on ignition is 33.35 kg at assumed gain 1000. The other 19.9666 t
is supplementary energy, not ignition catalyst. Antimatter is consumed, and it
does not increase the energy yield of each successful fusion reaction.

## Research findings and their limits

**Plasma energy transfer:** LaPointe's magnetically confined hydrogen-plasma study
calculates less than 2% transfer under its moderate-density magnetic-mirror cases;
higher density raises transfer but causes radiation losses. Coil shielding can
also dominate engine mass. This is a specific modeled architecture, not a universal
2% ceiling on every fusion/annihilation system.
[NASA-CR-185131, primary study abstract](https://ntrs.nasa.gov/citations/19890018329).

**Independent context from the same researcher:** NASA's later overview likewise
lists 1-2% transfer for plasma-core hydrogen and distinguishes it from direct
charged-particle exhaust. It identifies about 40% of initial proton-antiproton
annihilation energy as charged-pion kinetic energy. That is not 80% usable heating
of fusion exhaust, nor is it a universal bound on every energy-recovery scheme.
[LaPointe, Antimatter Propulsion, slides 8 and 16-17](https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf).

**High nozzle performance is a different quantity:** Keane and Zhang's Geant4
beamed-core simulations report approximately .69c effective speed for charged
pions. They direct annihilation products rather than demonstrate 80% transfer
into a separate fusion exhaust stream. The result cannot be inserted as the
coupling coefficient in this model.
[Keane and Zhang (2012)](https://arxiv.org/abs/1205.2281).

**High quoted hybrid efficiency does not settle the booster question:** the NASA
Schmidt et al. review describes fusion-driven ignition concepts and quotes an
84% efficiency for an AIM D-He3 concept. Its propulsive energy is predominantly
fusion-derived; the figure is not evidence for 84% annihilation-energy deposition
in an exhaust booster. Heating a solid efficiently is also not equivalent to
producing relativistic exhaust, because of its temperature limit.
[Schmidt et al., sections on propulsion concepts](https://ntrs.nasa.gov/api/citations/19990110316/downloads/19990110316.pdf).

No reviewed source establishes the 80% coefficient for the selected exhaust-
boosting mechanism. The physics of annihilation is established; the required
engineering performance is not. An exact physical gain cannot be claimed.

## Coupling sensitivity at the selected 20 t cap

Reoptimize the acceleration/braking mixtures at each coupling, while retaining the
same trajectory, staging and fusion assumptions. Lower-coupling rows retain the
same optimistic hardware-heating coefficient solely to isolate this sensitivity.

| Supplementary AM-to-directed-exhaust coupling | Fusion fuel | Reduction versus electrical fusion | Primary energy | Engine/radiator fits inside 500 t? |
|---|---:|---:|---:|---|
| 80% target | 17018 t | 91.2% | 13.19 ZJ | Yes, before other systems |
| 50% hypothetical | 29495 t | 84.7% | 17.58 ZJ | Yes, before other systems |
| 20% hypothetical | 110573 t | 42.8% | 46.15 ZJ | No |
| 2% sensitivity | 179857 t | 6.9% | 70.56 ZJ | No |

The 2% row is a sensitivity motivated by plasma-transfer literature, not a validated
prediction for this engine. At that coupling the assumed hybrid uses 3.65% MORE
accounted primary energy than electrical fusion, despite saving some propellant.
It also fails the 500 t hardware allocation. None of the rows is a flight-qualified
ship; the unmodeled shielding and thermal consequences can worsen them.

## Required next engineering result

Keep 20 t as the budget, but do not promote the optimistic fuel figure to a final
design. Specify whether energy reaches exhaust by plasma stopping, absorption and
reradiation, or direct charged-product thrust. Calculate particle transport,
deposition before decay, neutral/charged energy partitions, angular distribution,
neutrino escape, nozzle momentum and hardware heating in one coupled model.
Direct-product thrust needs a separate exhaust component in the rocket equations,
not an arbitrary improvement to the existing heating coefficient. Feed the resulting
mass, momentum and thermal terms back into the vehicle before choosing a final engine.
