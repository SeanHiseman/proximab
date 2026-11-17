# Adult-settler architecture and propulsion investigation

## Implementation

`data/mission_architecture.json` selects 24 adults, no children during transit,
20 Earth years for crew and 40 Earth years for cargo, departing 20 years earlier.
Births follow establishment of protected surface accommodation. Two separated
reproductive-bank locations are represented in the viewer. Their illustrated cases
are placement envelopes, not a validated cryogenic or radiation design.

The viewer now has 24 convertible berths in eight three-person bays and 24 descent
seats. It preserves the existing two-module rooms, circulation and machinery space.
The 750 m³ usable-space allocation (600–900 sensitivity) is not a measured net
usable volume or a reduction of the pressure envelope. No arbitrary proportional
mass reduction is credited. The historical reference's four-bunk bay becomes a
three-bunk bay with additional clearance; two of the freed upper positions hold
the separately located reproductive-bank cases.

All-awake capacity remains available. Torpor, an awake roster and reduced ageing
are not mandatory assumptions. The adult lifetime planning allowance is 1.2 Sv;
the study allocates 0.6 Sv to transit GCR. Neither is a demonstrated achieved dose.

The original propulsion, tanks, surface and landing geometry remains explicitly
labeled reference equipment. Its old numerical ledgers have not been relabeled as
a solved hybrid spacecraft. The new complete dry mass and fleet antimatter entries
are null until shielding, propulsion hardware and landing requirements close.
The historical `data/mission_config.json` still supports the old engineering studies;
`data/mission_architecture.json` is authoritative for the new mission. The sync step
overlays selected population/capacity requirements for the viewer and preserves the
legacy configuration separately. A new mission panel exposes this distinction.

## What 'efficient' means

Minimum antimatter, minimum supplied energy, minimum ship mass and minimum external
infrastructure are different objectives. Fusion or an entirely externally powered
system can use zero antimatter in principle, so there is no unique universal winner.
For this mission, external launch power plus onboard antimatter-powered reaction-mass
braking is the leading candidate to study for a large antimatter reduction without
the extreme mass ratios of lower-exhaust-speed rockets. This is not a demonstrated
technology or a global optimum.

## Equal-speed rocket comparison

Run `python -m calculations.propulsion_architecture_trade`.
Normalize to 100 t remaining after braking, including all retained equipment and
inventory. Use distance 4.24 ly, instantaneous burns and no reserve. Real finite-power
trajectories must reach a higher peak speed for the same arrival time. The 20-year
case therefore uses a benchmark minimum cruise speed of 0.212 c.

For a massive exhaust speed u (in units of c), conversion efficiency eta and Lorentz
factor gamma, annihilated mass per unit massive exhaust is a=(gamma−1)/eta. Effective
exhaust speed is w=gamma*u/(1+a). Isotropic waste energy carries no net thrust.
Rocket ratio R=exp(n*atanh(beta)/w), with n=2 for onboard acceleration and braking
or n=1 for externally accelerated, onboard-braked flight. Antimatter is half the
annihilated mass; equal ordinary annihilation reactant is carried separately.
Exhaust speed is numerically optimized for minimum antimatter at eta=0.5.

| Flight | Full onboard AM, t | External launch / onboard braking AM, t |
|---|---:|---:|
| 15 y | 28.76 | 6.68 |
| 20 y | 15.11 | 3.63 |
| 25 y | 9.37 | 2.28 |
| 30 y | 6.40 | 1.57 |
| 40 y | 3.54 | 0.88 |

At 20 years, hybrid reaction mass is 403.39 t, ordinary annihilation reactant 3.63 t,
and mass presented to the launcher 510.64 t per 100 t after braking. The hybrid
optimum exhaust speed is 0.1332 c versus 0.2563 c for the full onboard case. Lower
required rocket delta-v allows a lower-energy exhaust; this explains why removing
onboard acceleration cuts antimatter by 76%, rather than simply 50%.

For an illustrative 300 t retained crew vehicle, multiply by three: 10.88 t AM,
10.88 t ordinary annihilation reactant and 1,210.17 t reaction mass. Launcher payload
is 1,531.93 t. This is not a complete 300 t ship allocation. Any additional carried
sail, radiator, shield or tank mass increases the result; staging changes accounting.
Cargo must be evaluated separately at its 40-year duration and actual retained mass.

## External energy is large

For a perfect reflecting sail accelerated from rest to beta, the intercepted photon
energy is E=0.5*M*c²*[exp(atanh(beta))−1]. This includes the diminishing momentum
coupling to a receding sail. It excludes source inefficiency and missed photons.

The 20-year hybrid case needs 5.51e21 J intercepted per 100 t retained. Supplying
that over one year corresponds to 175 TW average intercepted power. This duration
is only an energy/power illustration, not a solved finite-burn trajectory. For the
illustrative 300 t retained case, the values are 1.65e22 J and 524 TW.

The full onboard case consumes about 2.72e21 J annihilation energy per 100 t retained;
hybrid annihilation plus ideal photon launch consumes about 6.16e21 J, before beam
generation losses. Thus photon assistance saves scarce antimatter while increasing
total supplied energy in this comparison. Antimatter production costs are not included
in either figure, so these are not cradle-to-launch energy totals.

Major unresolved items: source electrical generation, diffraction and pointing over
interstellar launch distances, a massive payload's sail/receiver area and temperature,
deployment and release, sustained thrust, protection and arrival braking. A beam from
behind does not passively brake a reflecting sail. Do not silently assume destination
infrastructure. Pellet/particle-beam launch may offer better energy coupling, but needs
its own interception, momentum-transfer and infrastructure model before comparison.

## Why fusion is not automatically the answer

For effective exhaust speeds of 0.03, 0.05 and 0.08 c, the 20-year benchmark gives:

| Assumed effective exhaust | Onboard acceleration + braking mass ratio | External launch + fusion braking mass ratio |
|---|---:|---:|
| 0.03 c | 1,708,232 | 1,307 |
| 0.05 c | 5,489 | 74.1 |
| 0.08 c | 217 | 14.7 |

These are deliberately broad effective-exhaust sensitivities, not rated engines.
At the optimistic 0.08 c, even braking only needs 1,474 t launched per 100 t retained,
before demonstrating reactor, tank and thermal mass feasibility. At lower exhaust
speeds the fuel burden rises rapidly. Staging can change retained hardware burdens,
but does not provide free exhaust energy or remove the integrated velocity requirement.

Fusion can still be preferable if zero antimatter is a hard constraint and much
greater nuclear fuel and launch infrastructure are acceptable. Antimatter-catalyzed
fusion is a different energy-source model: savings depend on ignition energy, nuclear
gain, burnup and exhaust coupling. No kilogram-scale catalyst claim is justified yet.

## Other options and efficiency sensitivity

For the fully onboard 20-year benchmark, raising conversion efficiency from 50% to
80% reduces AM from 15.11 to 9.19 t per 100 t retained; ideal 100% gives 7.29 t.
Efficiency improvements are useful, but cannot produce orders-of-magnitude savings
within this model. Thermalized water/hydrogen nuclear rockets at planetary exhaust
speeds are unsuitable for the main interstellar delta-v; they remain landing candidates.

Magnetic/electric sails avoid carrying deceleration propellant, but a published 8,250 kg
example takes about 29 years to slow from 0.05 c. That is not a bound for every sail,
but it does not support a free, rapid stop from 0.21 c for a much larger ship. Study
them first for uncrewed cargo, with braking included in the full 40-year schedule.

## Conclusion and next engineering gates

Select the externally launched / onboard-antimatter-braked architecture for the next
detailed propulsion study, retaining the full onboard case as the comparison. Do not
select a particular power plant for the external launcher yet: solar and nuclear source
sizing is a separate infrastructure trade, not resolved by the rocket calculation.

Before claiming a ship mass or mission feasibility: close interstellar radiation
transport and occupied geometry; solve finite-thrust launch/braking within 20 years;
size launch receiver/sail, tanks, engine, containment and heat rejection; then optimize
crew 16/24/32 and durations 15/20/25 with the same health and reliability requirements.
Surface reconnaissance, landing and independent survival remain part of success.

Primary research sources (accessed 2026-11-12):
- NASA interstellar propulsion assessment: https://ntrs.nasa.gov/api/citations/20200000759/downloads/20200000759.pdf
- NASA directed-energy study: https://www.nasa.gov/general/directed-energy-interstellar-study/
- NASA positron-catalyzed fusion concept: https://www.nasa.gov/general/radioisotope-positron-propulsion/
- Perakis & Hein, magnetic/electric sail deceleration: https://arxiv.org/abs/1603.03015

All numerical tables above are project calculations, not performance promised by these sources.
