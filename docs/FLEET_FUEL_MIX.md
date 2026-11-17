# S6 comparative fleet fuel mixtures

Comparative study only; the selected S6 design is unchanged. Reproduce with `python -m calculations.fleet_fuel_mix` (requires NumPy and SciPy). Machine-readable results: `reports/fleet-fuel-mix.json`.

Crew transfer 19.9 years plus 0.1 year arrival operations; cargo 39.9 plus 0.1. Both retain the S6 nonpropulsion core. Capture/approach fuel and added fuel-shield layout hardware are still excluded. No shielding compliance is implied.

## Model

Eight tank drops per burn; 10% hardware allowance; ordinary tank fraction 1%; antimatter containment 0.5 kg/kg before allowance. Main-engine specific power 5 GW/kg, 2000 K hot radiators and absorbed heat fraction 2.28e-5 remain optimistic. Engine and radiator mass feed back into fuel and power sizing. No main reserve.

Fusion and annihilation directed-energy couplings are each assumed 80%. Fusion-only uses electrical ignition; nonzero-antimatter mixtures pay ignition energy before supplemental heating. Mixed designs can dilute fusion feed with inert reaction mass independently in each burn. Antimatter-only means zero fusion, not zero ordinary matter. An equal annihilation reactant mass is always included.

Primary energy = fusion fuel × 0.00392 c² + 2 × antimatter × c² / manufacturing efficiency. Tables assume 50% pair-production efficiency, not current capability. Annihilation energy is not counted again. Fuel acquisition, construction and storage energy are unpriced. Search minimizes this energy under each AM cap, not departure mass. Caps are upper bounds: unused AM need not be manufactured. Differential-evolution search varies burn duration and mixtures; results are numerical candidates, not proofs of global optimality or infeasibility.

## Crew

| AM cap / endpoint | AM t | Fusion t | Inert feed t | Staged tanks t | Retained mass t | Departure t | Primary ZJ |
|---|---:|---:|---:|---:|---:|---:|---:|
| 0 | No closed candidate found | — | — | — | — | — | — |
| 0.005 | No closed candidate found | — | — | — | — | — | — |
| 0.01 | No closed candidate found | — | — | — | — | — | — |
| 0.02 | No closed candidate found | — | — | — | — | — | — |
| 0.03 | No closed candidate found | — | — | — | — | — | — |
| 0.05 | No closed candidate found | — | — | — | — | — | — |
| 0.075 | No closed candidate found | — | — | — | — | — | — |
| 0.1 | No closed candidate found | — | — | — | — | — | — |
| 0.25 | No closed candidate found | — | — | — | — | — | — |
| 0.5 | No closed candidate found | — | — | — | — | — | — |
| 1 | No closed candidate found | — | — | — | — | — | — |
| 2 | No closed candidate found | — | — | — | — | — | — |
| 3 | No closed candidate found | — | — | — | — | — | — |
| 5 | No closed candidate found | — | — | — | — | — | — |
| 10 | No closed candidate found | — | — | — | — | — | — |
| 15 | No closed candidate found | — | — | — | — | — | — |
| 17 | No closed candidate found | — | — | — | — | — | — |
| 18 | 18.000 | 38,815.009 | 0.000 | 438.823 | 637.275 | 39,927.108 | 20.146 |
| 19 | 19.000 | 29,963.563 | 0.000 | 342.018 | 604.926 | 30,948.507 | 17.387 |
| 19.5 | 19.500 | 27,818.395 | 0.000 | 318.702 | 597.043 | 28,773.140 | 16.811 |
| 19.75 | 19.750 | 26,957.224 | 0.000 | 309.369 | 593.888 | 27,899.980 | 16.598 |
| 19.9 | 19.900 | 26,490.306 | 0.000 | 304.317 | 592.155 | 27,426.578 | 16.487 |
| 19.925 | 19.925 | 26,415.688 | 0.000 | 303.510 | 591.890 | 27,350.938 | 16.470 |
| 19.95 | 19.950 | 26,341.931 | 0.000 | 302.713 | 591.600 | 27,276.145 | 16.453 |
| 19.97 | 19.970 | 26,283.541 | 0.000 | 302.082 | 591.397 | 27,216.960 | 16.439 |
| 19.98 | 19.980 | 26,254.542 | 0.000 | 301.769 | 591.292 | 27,187.562 | 16.433 |
| 19.99 | 19.990 | 26,225.679 | 0.000 | 301.457 | 591.187 | 27,158.303 | 16.426 |
| 19.995 | 19.995 | 26,211.295 | 0.000 | 301.301 | 591.111 | 27,143.698 | 16.423 |
| 20 | 20.000 | 26,196.946 | 0.000 | 301.146 | 591.061 | 27,129.153 | 16.420 |
| 25 | 25.000 | 18,471.347 | 0.000 | 218.970 | 562.724 | 19,303.041 | 15.495 |
| 30 | 30.000 | 12,046.215 | 0.000 | 151.098 | 537.324 | 12,794.637 | 15.029 |
| 50 | 35.201 | 5,521.223 | 0.000 | 82.241 | 506.916 | 6,180.781 | 14.600 |
| 100 | 35.201 | 5,521.311 | 0.000 | 82.242 | 506.915 | 6,180.869 | 14.600 |
| hybrid unrestricted | 35.201 | 5,521.265 | 0.000 | 82.241 | 506.918 | 6,180.826 | 14.600 |
| mixed unrestricted | 35.201 | 5,521.374 | 0.000 | 82.243 | 506.918 | 6,180.936 | 14.600 |
| antimatter unrestricted | 44.646 | 0.000 | 3,249.512 | 62.551 | 494.479 | 3,895.834 | 16.050 |
| photon unrestricted | 267.909 | 0.000 | 0.000 | 152.057 | 557.764 | 1,245.638 | 96.314 |

## Cargo

| AM cap / endpoint | AM t | Fusion t | Inert feed t | Staged tanks t | Retained mass t | Departure t | Primary ZJ |
|---|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.000 | 4,067.228 | 0.000 | 46.500 | 259.674 | 4,373.401 | 1.433 |
| 0.005 | 0.000 | 4,067.228 | 0.000 | 46.500 | 259.674 | 4,373.401 | 1.433 |
| 0.01 | 0.010 | 3,944.122 | 570.030 | 51.421 | 259.935 | 4,825.529 | 1.393 |
| 0.02 | 0.020 | 3,923.571 | 567.808 | 51.176 | 259.850 | 4,802.446 | 1.390 |
| 0.03 | 0.030 | 3,903.067 | 565.533 | 50.931 | 259.757 | 4,779.348 | 1.386 |
| 0.05 | 0.050 | 3,862.203 | 559.880 | 50.431 | 259.601 | 4,732.215 | 1.379 |
| 0.075 | 0.075 | 3,811.398 | 552.757 | 49.808 | 259.374 | 4,673.487 | 1.370 |
| 0.1 | 0.100 | 3,760.910 | 544.934 | 49.180 | 259.160 | 4,614.384 | 1.361 |
| 0.25 | 0.250 | 3,465.219 | 505.195 | 45.575 | 257.895 | 4,274.383 | 1.311 |
| 0.5 | 0.500 | 3,005.297 | 444.601 | 39.989 | 255.948 | 3,746.835 | 1.239 |
| 1 | 1.000 | 2,250.523 | 356.119 | 30.994 | 252.778 | 2,892.414 | 1.152 |
| 2 | 1.224 | 1,995.437 | 329.266 | 28.019 | 251.743 | 2,606.913 | 1.143 |
| 3 | 1.224 | 1,995.639 | 330.794 | 28.038 | 251.739 | 2,608.658 | 1.143 |
| 5 | 1.224 | 1,995.947 | 330.035 | 28.032 | 251.734 | 2,608.196 | 1.143 |
| 10 | 1.224 | 1,995.504 | 329.919 | 28.027 | 251.735 | 2,607.633 | 1.143 |
| 15 | 1.225 | 1,995.192 | 330.429 | 28.029 | 251.738 | 2,607.837 | 1.143 |
| 17 | 1.225 | 1,995.192 | 330.429 | 28.029 | 251.738 | 2,607.837 | 1.143 |
| 18 | 1.224 | 1,995.703 | 329.612 | 28.025 | 251.732 | 2,607.521 | 1.143 |
| 19 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.5 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.75 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.9 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.925 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.95 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.97 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.98 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.99 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 19.995 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 20 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 25 | 1.224 | 1,995.846 | 330.021 | 28.031 | 251.740 | 2,608.087 | 1.143 |
| 30 | 1.224 | 1,995.473 | 330.175 | 28.029 | 251.726 | 2,607.852 | 1.143 |
| 50 | 1.224 | 1,995.473 | 330.175 | 28.029 | 251.726 | 2,607.852 | 1.143 |
| 100 | 1.224 | 1,995.473 | 330.175 | 28.029 | 251.726 | 2,607.852 | 1.143 |
| hybrid unrestricted | 1.226 | 2,002.400 | 0.000 | 24.474 | 251.295 | 2,280.621 | 1.146 |
| mixed unrestricted | 1.224 | 1,995.473 | 330.175 | 28.029 | 251.726 | 2,607.852 | 1.143 |
| antimatter unrestricted | 4.846 | 0.000 | 1,800.596 | 24.285 | 249.852 | 2,084.424 | 1.742 |
| photon unrestricted | 44.422 | 0.000 | 0.000 | 26.681 | 258.646 | 374.172 | 15.970 |

## Twenty-tonne fleet allocation

| Crew AM cap t | Cargo AM cap t | Actual fleet AM t | Fusion t | Inert feed t | Departure t | Primary ZJ |
|---|---:|---:|---:|---:|---:|---:|
| 20 | 0 | 20.000 | 30,264.173 | 0.000 | 31,502.554 | 17.852 |
| 19.995 | 0.005 | 19.995 | 30,278.523 | 0.000 | 31,517.098 | 17.856 |
| 19.99 | 0.01 | 20.000 | 30,169.800 | 570.030 | 31,983.831 | 17.819 |
| 19.98 | 0.02 | 20.000 | 30,178.113 | 567.808 | 31,990.008 | 17.822 |
| 19.97 | 0.03 | 20.000 | 30,186.608 | 565.533 | 31,996.308 | 17.825 |
| 19.95 | 0.05 | 20.000 | 30,204.134 | 559.880 | 32,008.360 | 17.831 |
| 19.925 | 0.075 | 20.000 | 30,227.086 | 552.757 | 32,024.426 | 17.839 |
| 19.9 | 0.1 | 20.000 | 30,251.216 | 544.934 | 32,040.962 | 17.848 |
| 19.75 | 0.25 | 20.000 | 30,422.442 | 505.195 | 32,174.363 | 17.908 |
| 19.5 | 0.5 | 20.000 | 30,823.692 | 444.601 | 32,519.975 | 18.050 |
| 19 | 1 | 20.000 | 32,214.087 | 356.119 | 33,840.922 | 18.539 |
| 18 | 2 | 19.224 | 40,810.446 | 329.266 | 42,534.021 | 21.289 |

A lean comparator allocates 19.99 t AM to crew and 0.01 t to cargo, with fusion feed only and no additional inert reaction mass. Fleet fusion 30,183.772 t; departure 31,420.970 t; primary energy 17.824147 ZJ. It avoids roughly 570 t of inert feed for only about 0.03% more primary energy than the best sampled allocation. This is a comparison, not an adopted change to S6.

## Manufacturing efficiency sensitivity

Mixtures reoptimized without the 20 t cap. These efficiencies are assumptions, not industrial capabilities.

| Manufacturing efficiency | Fleet AM t | Fusion t | Inert feed t | Departure t | Primary ZJ |
|---|---:|---:|---:|---:|---:|
| 10% | 18.989 | 34,008.860 | 572.546 | 35,879.206 | 46.114 |
| 50% | 36.425 | 7,516.847 | 330.175 | 8,788.788 | 15.743 |
| 100% | 40.082 | 4,771.815 | 295.047 | 5,973.044 | 8.886 |

## Endpoint and research qualifications

The photon endpoint assumes 80% of all annihilation energy becomes directed photons, with no massive reaction feed. It is an idealized bound, not a demonstrated antiproton beamed-core engine. The same hardware coefficients are imposed for comparison; no photon-conversion hardware design supports them.

NASA reports roughly 1–2% transfer into hydrogen for studied plasma concepts, not the 80% assumed here: https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf

The original plasma study describes the coupling and radiation-loss limitations: https://ntrs.nasa.gov/citations/19890018329

Beamed-core magnetic-nozzle momentum collimation is a different metric from whole-engine energy efficiency: https://arxiv.org/abs/1205.2281
