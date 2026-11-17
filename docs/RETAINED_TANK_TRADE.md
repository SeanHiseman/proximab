# Hybrid fuel, retained tanks and optional staging

Reproduce with `python -m calculations.retained_tank_trade`.
Results: `reports/retained-tank-trade.json`. No selected vehicle or viewer changes.

## Scope and assumptions

This study closes fuel/tank/containment mass algebraically. It does not close engine,
radiator, shielding, landing or manufacturing infrastructure mass. The fixed 300 t
core includes an assumed allowance for fixed systems, not demonstrated hardware.
Unlike the earlier 300 t *total retained* normalization, variable storage hardware
is now additional to the 300 t core. Earlier fuel-only results cannot be substituted.

Mission: 19.9 Earth years transfer plus 0.1 years arrival operations. Two symmetric
one-year coordinate-time burns at constant proper acceleration, separated by coast,
reach 4.24 ly. Peak speed 0.224186 c, acceleration 0.22284 Earth g. This replaces
the earlier instantaneous-burn 0.212 c screen. Constant acceleration is an assumed
thrust profile, not engine qualification. Arrival propulsion inventory is not newly
sized here. No propellant reserve or boil-off loss is included.

Fuel model retained from the prior study: fully burned D–He3 energy release q=0.00392,
80% fusion jet coupling, 50% additional annihilation jet coupling; ignition gain 1,000.
Electrical driver/generator efficiencies are 20%/40%. Waste energy is isotropic.
Electrical and AM ignition gains have different definitions and are unproven.

Ordinary storage hardware is 3% of loaded fusion fuel plus ordinary annihilation
reactant. Antimatter containment is separately 1 kg hardware per kg antimatter.
These fractions are hypothetical all-in storage allocations, not measured tank or
antimatter storage performance. Sensitivities span ordinary storage 1–10% and
antimatter containment 0.1–10 kg/kg. Cryogenic operating power is not calculated.

Primary energy counts nuclear energy released aboard plus electricity manufacturing
antimatter. Annihilation energy is not counted twice. Fuel acquisition/processing,
hardware manufacturing and continuing storage power remain unpriced. AM efficiency
means eventual annihilation energy divided by production electricity, not engine
efficiency. 100% is an ideal accounting limit, not an industrial forecast.

## Retention and staging accounting

Let a be total annihilated ordinary-plus-antimatter mass per unit fusion fuel, w
effective exhaust/c and k storage hardware per unit spent mass:

    k = [tank_fraction*(1+a/2) + containment_fraction*a/2] / (1+a).

For equal mixtures and full retention, R=exp(2*atanh(beta)/w), spent mass P satisfies
P=(R−1)*(B+kP). Thus P=(R−1)*B/[1−k(R−1)]. A non-positive denominator means no
finite solution within these coefficients; it does not mean all possible engines
or tanks are physically impossible. For electrical fusion in this trajectory the
maximum ordinary tank fraction before this runaway is about 0.3001%. At 3%, fully
retained pure fusion and ignition-only fusion have no finite mass solution.

The solver allows independent mixtures during acceleration and braking. With
r1=exp(atanh(beta)/w1), r2=exp(atanh(beta)/w2), and final mass F:

    P2=(r2−1)*F; P1=(r1−1)*r2*F
    F=B/[1−k1*(r1−1)*r2−k2*(r2−1)].

Optional staging drops only emptied acceleration tanks/containment plus a 5 t
separation kit after acceleration. The engine/core and all braking storage arrive:

    F=B/[1−k2*(r2−1)]
    P2=(r2−1)*F
    P1=(r1−1)*(r2*F+5)/[1−k1*(r1−1)]
    discarded = k1*P1+5.

All discarded material is charged to launch mass and acceleration energy. It is
not credited at Proxima. Tank contents are expended; tank hardware is never treated
as reaction mass. Coast jettison is not safe disposal by itself; trajectories need
separation analysis. Retained tanks reach the destination after braking, not
automatically the surface. Their descent and repurposing need separate engineering.

Optimization spans electrical ignition and hybrid mixtures from ignition-only
through a=2, then locally refines the best pair. These are numerical minima within
two constant-mixture burns and the stated fractions, not global propulsion optima.

## Minimum modeled energy with all storage retained

| AM manufacture efficiency | Fusion fuel t | AM t | Retained storage t | Arrival t | Departure t | Primary energy ZJ |
|---|---:|---:|---:|---:|---:|---:|
| 1% | 2,810 | 53.55 | 139.5 | 439.5 | 3,357 | 963.58 |
| 3% | 2,787 | 53.55 | 138.8 | 438.8 | 3,333 | 321.85 |
| 10% | 2,714 | 53.56 | 136.6 | 436.6 | 3,258 | 97.23 |
| 30% | 2,526 | 53.63 | 131.0 | 431.0 | 3,064 | 33.03 |
| 50% | 2,377 | 53.75 | 126.7 | 426.7 | 2,911 | 20.16 |
| 80% | 2,201 | 53.97 | 121.6 | 421.6 | 2,730 | 12.90 |
| 100% | 2,107 | 54.14 | 119.0 | 419.0 | 2,634 | 10.47 |

1 ZJ = 10^21 J. Equal ordinary annihilation reactant is additionally carried and
included in departure mass. Manufacturing improvements reduce energy expenditure,
but the optimum AM quantity changes little because the storage/mass trade selects
a substantial annihilation contribution even at low manufacturing efficiencies.

Optimum AM-to-fusion *mass* ratios differ by phase (not energy fractions):

| Manufacturing efficiency | Acceleration AM / fusion | Braking AM / fusion | Exhaust c, acceleration / braking |
|---|---:|---:|---:|
| 10% | 1.13% | 7.86% | 0.169 / 0.382 |
| 30% | 1.23% | 8.06% | 0.174 / 0.386 |
| 50% | 1.33% | 8.24% | 0.179 / 0.390 |
| 80% | 1.46% | 8.47% | 0.186 / 0.394 |
| 100% | 1.54% | 8.63% | 0.190 / 0.398 |

Higher-energy braking exhaust reduces braking fuel that must also be accelerated.
The assumed engine can operate across this range; no nozzle or thermal design yet
establishes that capability. At 10% manufacturing efficiency, fixed equal mixtures
of 1.5% AM/fusion give 161.6 ZJ and 5% give 119.95 ZJ, versus 97.23 ZJ with separate
phase mixtures. Fractions 0, ignition-only, 0.05%, 0.15% and 0.5% have no retained
solution under the nominal storage coefficients. Full sweep examples are in JSON.

## Staging: credit the lost destination material

Two comparisons are supplied. Same core means both deliver the same 300 t core but
different storage masses. Material-matched means the staged design also delivers
enough additional inert reusable material that total arrival mass is at least the
all-retained optimum's arrival mass. That replacement mass is accelerated/braked
normally; it is not free. This is a mass-equivalence credit, not a claim of identical
usable tanks, material quality or landing cost.

| AM efficiency | Retained energy ZJ | Staged, same core ZJ | Staged, material-matched ZJ | Material-matched saving |
|---|---:|---:|---:|---:|
| 1% | 963.58 | 141.27 | 141.27 | 85.3% |
| 3% | 321.85 | 82.14 | 98.73 | 69.3% |
| 10% | 97.23 | 35.36 | 46.24 | 52.4% |
| 30% | 33.03 | 18.73 | 24.59 | 25.5% |
| 50% | 20.16 | 14.71 | 19.13 | 5.1% |
| 80% | 12.90 | 10.23 | 13.14 | −1.8% |
| 100% | 10.47 | 8.45 | 10.78 | −2.9% |

Large staging savings require reoptimizing the fuel mixture: a fusion-heavy launch
burn becomes possible because its bulky empty storage is not braked. At identical
phase mixtures and matched destination mass, staging actually adds about 7% energy
in these cases. The benefit is the alternate mixture/vehicle it enables, not free
energy from throwing material away.

Material-matched 10% case: 50,345 t fusion fuel, 15.86 t AM, 1,527 t total storage,
52,299 t departure, 436.6 t arrival. Discarded hardware including kit is 1,486 t.
At arrival about 45.4 t is braking storage, 91.2 t is replacement useful material,
and 300 t is the original core. Acceleration is ignition-only fusion, followed by
a braking mixture around 1.62% AM/fusion. The retained alternative departs at only
3,258 t, so minimizing primary energy does not minimize industrial construction mass.

Material-matched 30% staging departs at 36,225 t versus retained 3,064 t; at 50%,
31,802 t versus 2,911 t. The modest 50% energy advantage is not sufficient to select
staging without fuel-processing and manufacturing costs. At 80–100% retention wins
the destination-material-matched comparison even before those unpriced costs.

The 1% staged optimum is extreme: roughly 412,263 t departure and 11,696 t discarded,
arriving with 607 t (already more than the retained alternative). This is not a
recommendation to build such a ship.

## Storage and engine sensitivity

At 10% AM manufacture efficiency, reoptimizing independently:

| Ordinary storage fraction | AM containment kg/kg | Retained energy ZJ | Staged same-core energy ZJ |
|---|---:|---:|---:|
| 1% | 1 | 54.57 | 28.08 |
| 3% | 1 | 97.23 | 35.36 |
| 5% | 1 | 113.43 | 59.05 |
| 10% | 1 | 149.60 | 97.27 |
| 3% | 0.1 | 83.77 | 34.07 |
| 3% | 10 | No solution in scan | 54.71 |

Reducing fusion coupling from 80% to 60% raises the nominal retained result to
101.65 ZJ and staged same-core result to 66.50 ZJ at 10% manufacturing efficiency.
These storage coefficients have no demonstrated tonnes-scale AM-storage basis.

The finite burn assumption exposes the fixed-hardware limitation: at 10% AM
manufacturing efficiency the retained optimum requires about 333 TW peak released
nuclear-plus-annihilation power; same-core staged about 1,206 TW; material-matched
staged about 1,700 TW. These are propulsion-source powers, not AM-factory electricity.
Even an assumed 1 GW/kg engine would weigh 333, 1,206 or 1,700 t respectively,
before thermal protection, tanks or habitation. Therefore 300 t is a normalization,
not an achievable fixed-mass claim. Full engine scaling can change the ranking.

## Decision

Keep retention as the baseline. Investigate staging seriously at 10–30% AM production
efficiency, where material-matched modeled savings are substantial. At 50% the 5%
gain is small relative to increased fuel and construction burdens; at 80–100%, retain
all storage under this destination-material comparison. Do not change the selected
vehicle or declare a final mass until source power, heat rejection, storage and
manufacturing energy are closed together.

Source context (coefficients and results above are our assumptions/calculations):
- NASA long-duration cryogenic systems include both tanks and thermal management:
  https://ntrs.nasa.gov/api/citations/20180008495/downloads/20180008495.pdf
- CERN antimatter storage remains at microscopic scale:
  https://home.cern/science/physics/antimatter/
