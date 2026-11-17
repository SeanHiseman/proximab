# Zero-reserve transfer: 10 versus 20 tonnes antimatter

This comparison applies the requested zero unused main-propulsion fuel policy and
drops emptied tank modules during both burns. It replaces the reserve premise for
this trade; it does not select an AM budget or declare a qualified replacement for
the S3 vehicle. Reproduce with `python -m calculations.depleted_staged_tanks`.
Full per-module mass ledgers: `reports/depleted-staged-tanks.json`.

## Common basis and mass definitions

- 500 t retained ship after braking and the final empty-tank drop. This is an
  assumed retained dry/payload mass, not a detailed 24-person component design.
  Its engine and radiators must fit within 500 t. Additional carried supplies or
  landing propellant must be added to this mass if not already represented.
- 4.24 light years, 1.25 Earth years acceleration, 17.4 years coast, 1.25 years
  braking and .1 year arrival allowance. Peak ship speed .22714c, acceleration
  approximately .181g. Capture/approach maneuver fuel is not added in this transfer
  calculation; it must be incorporated into a final planned braking trajectory,
  not supplied by a reserve that this comparison no longer carries.
- Fusion and supplementary annihilation directed-energy coupling 80%; fusion
  mass-energy release fraction .00392. These remain optimistic assumptions.
- Ordinary tanks 1% stored mass; AM containment .5 kg/kg AM; 10% hardware allowance.
- Eight tank modules per burn, each covering an equal rapidity increment, emptied
  and discarded immediately. Sizes are unequal. Each drop includes .1 t nominal
  separation/services hardware (.11 t with allowance). All main fuel is consumed.
- The retained 500 t excludes these disposable tanks. Therefore departure dry
  hardware is NOT 500 t once explicit tank masses are included.

## Main comparison: eight modules per burn

| Quantity | 10 t AM | 20 t AM |
|---|---:|---:|
| Fusion fuel loaded and consumed | 42601.4 t | 17017.5 t |
| Matching ordinary annihilation reactant | 10 t | 20 t |
| Tank/containment/separation hardware, all dropped | 476.0 t | 200.2 t |
| Retained dry/payload allocation | 500 t | 500 t |
| Departure dry/payload plus empty tank hardware | 976.0 t | 700.2 t |
| Departure mass | 43597.4 t | 17757.7 t |
| Final retained mass | 500 t | 500 t |
| Unused main propulsion fuel | 0 | 0 |
| Massive exhaust, acceleration / braking | .07916c / .15640c | .08126c / .35520c |
| Fusion energy plus loaded-AM manufacturing energy | 18.604 ZJ | 13.186 ZJ |

The additional 10 t AM saves about 25,584 t fusion fuel (60.1%) and 25,840 t
departure mass. The model holds each phase mixture constant and searches it to
minimize fusion fuel under the AM cap. It does not globally optimize burn times,
variable mixtures or module sizes.

The earlier fixed-mass, no-explicit-tank comparison gives 39,128 t fusion for 10 t
AM and 15,882 t for 20 t AM. Those figures omit additional tank weight and do not
earn a mass credit for staged tanks; they are not detailed tank-sized vehicles.

## Staging sensitivity

| Modules per burn | Fusion at 10 t AM | Fusion at 20 t AM |
|---|---:|---:|
| 1 | 56416 t | 20824 t |
| 4 | 43303 t | 17204 t |
| 8 | 42601 t | 17018 t |
| 16 | 42380 t | 16969 t |

Four or eight modules capture most of the savings in this simplified model.
Sixteen offers small additional savings and more interfaces. The per-drop mass
is an allocation, not a completed separation, valve or containment design.

Each segment closes the relativistic rocket equation before its empty tank drops:
`R = exp(delta_rapidity / effective_exhaust_c)`;
`spent = (R-1)*(mass_after_drop + kit)/(1 - tank_fraction*(R-1))`.
Mass after the drop includes every later stage and all its fuel. No empty tank is
discarded before its contents are consumed; no fuel is deleted in staging.

## Does the engine fit inside the retained 500 t?

With the existing optimistic 5 GW/kg source-specific-power and hot-radiator
assumptions, including 10% allowance:

| Allocation | 10 t AM | 20 t AM |
|---|---:|---:|
| Main engine | 252.8 t | 105.7 t |
| Hot radiators | 88.2 t | 36.9 t |
| Remaining within 500 t for everything else | 158.9 t | 357.4 t |

These are sizing checks INSIDE the 500 t, not added again. Neither row demonstrates
that all S3 habitat, shielding, service and landing requirements fit. The existing
S3 crew nonpropulsion package alone is 519.7 t. The fixed-500-t calculation is a
conditional transfer comparison, not a claim to have closed the existing habitat.

## Optional fleet interpretation

To avoid allocating another unspecified amount of AM to cargo, the report also
computes a 40-year electrically ignited fusion-only cargo vehicle with the S3
239.249 t nonpropulsion core, zero main reserve and eight modules per burn. Its
main engine/radiators are resized self-consistently. It uses 4093.6 t fusion fuel,
zero AM and departs at 4406.7 t. Its retained mass is 266.3 t and departure dry/core
plus tank hardware is 313.1 t; the core includes S3 supplies and chemical fuel.

Adding this illustrative cargo gives fleet departure approximately 48004 t or
22164 t and fleet fusion approximately 46695 t or 21111 t, while AM remains
10 or 20 t. This cargo is not the previous energy-optimized hybrid. Destination
capture and autonomous deployment still need a complete operational design.

## What the antimatter actually does

There are two distinct functions:

1. **Ignition assistance:** annihilation deposits energy that helps initiate the
   fusion pulse. Fusion then provides most of the pulse energy. Some studied
   concepts use an intermediate fission process; others examine different heating
   arrangements. Antimatter is consumed, despite the conventional word catalyst.
2. **Supplementary exhaust energy:** additional antimatter annihilates with matching
   ordinary matter. A usable fraction of its energy is transferred to the exhaust
   or directed charged products, increasing exhaust speed. This does not increase
   the nuclear energy released by each successful fusion reaction.

[NASA's conceptual comparison](https://ntrs.nasa.gov/api/citations/19990110316/downloads/19990110316.pdf)
distinguishes ignition-driven fusion from annihilation-powered propulsion. It does
not validate our selected coupling, storage, gain or interstellar engine.

Our model assumes fusion-energy/ignition-annihilation-energy gain 1000. Thus
`AM_ignition = .00392 * fusion_mass / (2*1000)`. For the eight-module cases, only
83.5 kg of the 10 t AM and 33.4 kg of the 20 t AM are assigned to ignition. The
remaining approximately 9.9165 t and 19.9666 t supply supplementary energy. Those
ignition amounts are model assumptions, not experimentally established needs.

At the same coupling, 1 kg AM plus 1 kg ordinary matter releases as much source
energy as about 510 kg of our assumed fusion fuel. Rocket fuel savings are not
linear because fuel must itself be accelerated and later decelerated.

Physical implementation is unresolved: a magnetic nozzle directs charged particles,
but does not directly capture gamma rays or neutrinos. Energy deposition, particle
decay, radiation escape and heat interception must be calculated together. The
model's 80% directed annihilation coupling is a hypothetical coefficient, not a
specified or demonstrated mechanism. This design should be described as an
annihilation-boosted fusion rocket, not merely an antimatter-ignited fusion engine.

Primary energy uses 50% pair-production manufacturing efficiency and counts
fusion release once. Annihilation energy is not added again. Fuel acquisition,
construction and storage energy remain unpriced. More AM doubles the factory
energy from 3.595 to 7.190 ZJ, while reduced fusion consumption lowers the total
accounted energy in these two cases.
