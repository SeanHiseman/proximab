# Staged surface delivery: settlement essentials only

Current selection: 32 people in 16 shared cabins, 20 years onboard, two inflatable
19.5 m-radius three-deck discs, 1 t edible spare food and a compact 10 t complete-diet
food-factory target. Staging, propulsion, containment and torpor remain unvalidated.

The 31 t dust shield is required during cruise but does not descend. Flight-only
hardware remains aboard through both interstellar burns, then separates in a
controlled destination orbit. The independent lander carries settlement essentials
and the equipment required to deliver them. It never launches again.

## Closed mass comparison

| Quantity | Previous whole-ship landing | Staged delivery |
|---|---:|---:|
| Departure including fuel | 1,363.96 t | 1,330.83 t |
| All mission hardware including 25% allowance | 522.21 t | 512.27 t |
| After touchdown | 567.29 t | 386.39 t |
| Touchdown hydrogen | 13.00 t | 8.86 t |
| Loaded propulsion antimatter | 392.03 t | 382.50 t |
| Landed hardware including 25% allowance | ? | 342.11 t |
| At hydrogen ignition | 580.29 t | 395.24 t |
| Released / left off lander | ? | 170.96 t |

Matching ordinary matter equals the listed propulsion antimatter. The separate
1 kg surface antimatter bank and equal matter remain with the settlement. Transit
power has its own 20-year/2 MWe fuel allowance at 40% electrical conversion.

Departure savings are modest because discarded equipment still travels to Proxima.
The substantial saving is in delivered surface mass and its touchdown hydrogen.
The staged design adds 2 t separation/interface hardware before 25% margin.

## Surface-delivery audit

| Item left off lander | Mass | Reason |
|---|---:|---|
| Hubs, bearings, spin motors and balance equipment | 12.000 t | Surface habitats do not rotate |
| Forward dust/gas shield stack and supports | 40.000 t | Interstellar dust protection is finished before descent |
| Cruise engine standoff and support frame | 20.000 t | Cruise engine standoff has no settlement role |
| Interstellar magnetic nozzle and cruise engine | 25.000 t | Independent descent engine replaces cruise propulsion |
| Bulk cruise antimatter containment and cryogenics | 38.000 t | Bulk cruise fuel has been consumed; unused reserve stays here |
| Space scouts, microlanders and their support allocations | 0.420 t | Released to their remote exploration trajectories |
| Detachable cruise-only hot radiator extensions | 10.509 t | Cruise-only excess above required descent hot cooling |
| Flight-only hardware development allowance | 36.377 t | 25% allowance associated with hardware that does not descend |
| Unused correction propellant, matter plus antimatter | 0.385 t | Unused correction stock; no settlement propulsion requirement |

The 450 kg remote exploration allowance is unchanged: 30 kg of surface micro-rovers
lands with the colony; the other 420 kg covers space scouts, microlanders and their
support/uncertainty. Their individual fuel and deployment feasibility remain open.

All cabins, floors, deployment frames and pressure/service hubs remain. The 12 t
spin-bearing allowance is removed from descent, not the pressure/deployment core.
The food factory, 60 m2 garden, medical and embryo systems, ECLSS, water, atmosphere,
fabrication/chemistry seed, repair stock, communications, rover and surface power
remain. The rigid crew refuge becomes an emergency/service module. Service radiators
remain necessary on an airless world. Large greenhouses are manufactured locally.

## Mandatory descent hardware

The earlier combined engine allowance is split into 25 t orbital cruise engine
and a 10 t independent direct/thermal descent engine. The former 40 t containment
allowance is split into 38 t bulk orbital storage and a 2 t local descent store.
The 30 t frame allowance splits into 20 t cruise standoff and 10 t delivery/services.
These are explicit allocations, not demonstrated mass estimates. Splitting existing
allowances does not establish that either independent vehicle can be built.

Descent hot radiators are independently sized at 1.7876 Earth g proper acceleration,
including direct-arrival fuel, at the same optimistic 1e-7 heat interception and
1,500 K/0.9 emissivity/5 kg per emitting m2 targets. Cruise hot panels provide the
additional area needed for peak interstellar thrust and remain in orbit. No free
heat sink, cooling shutdown or massless descent thruster is assumed.

Landing engines, hydrogen tanks, restraints, supports and separation interfaces
must descend to deliver and commission the habitat even though propulsion is not
needed afterward. Suitable tanks/frames serve storage or settlement services. No
extra flight hardware is carried merely as potential raw material.

## Staging and fuel accounting

The relativistic interstellar mass ratio is exp(2*rapidity/exhaust_fraction), with
proper acceleration 1.2g and peak speed approximately 0.2104c. The total 12 km/s
direct-arrival allowance now splits into 2 km/s before separation and 10 km/s
for the independent descent vehicle. This is a conditional allocation, not an
integrated capture/orbit/terrain trajectory. The 0.1-year arrival allowance remains.
Bound orbit acquisition, assembly release, control, safe disposal and radiological
separation must be established. No flight module is simply abandoned at low altitude.

The unused correction stock supports an ideal 100 km/s before separation; it is
left with bulk containment. No post-settlement propulsion stock is retained.
Hardware development allowance remains 25%, and follows each component to its
actual destination. Antimatter and matching matter are accounted separately.

Mass conservation is:

    departure = landed + released + direct propellant consumed
                + hydrogen consumed + heater antimatter and matching matter

The component ledger sums to landed plus released mass. Only rows marked
surface_delivery=true sum to settled mass. The staged solver sizes descent tanks,
retained hot radiators, orbital hot extensions and fuel together. Departure fuel
still accelerates and brakes the orbital components. Phase masses expose separation.

## Short hydrogen touchdown

The selected 0.400 km/s hydrogen allowance at an unproven 1,800 s Isp and 50% heater
efficiency corresponds to a conditional switch at 1 km. The vertical model requires
0.3243 km/s ideal thrust integral over 18.50 seconds at constant 1.7876 Earth g
proper acceleration. The remaining 0.0757 km/s is a planning allowance, not proven
transition, navigation or engine-out coverage. No hover is required.

| Switch height | Budgeted thermal delta-v | Hydrogen | At hydrogen ignition | After touchdown |
|---|---:|---:|---:|---:|
| 10 km | 1.025 km/s | 23.26 t | 412.23 t | 388.98 t |
| 5 km | 0.800 km/s | 17.99 t | 406.02 t | 388.03 t |
| 1 km | 0.400 km/s | 8.86 t | 395.24 t | 386.39 t |

Direct exhaust reaches the surface until switching. Radiation, backscatter, plume
interaction, terrain and transition reliability are unqualified. A 1 km cutoff is
a conditional design input, not an acceptable operational altitude established here.
Airless Proxima b is the requested scenario; mass 1.44 Earth and radius 1.10 Earth
are conditional design values. Neither atmosphere nor radius is established here.

## Other retained assumptions

Exactly 1,000 kg edible food plus 20 kg bulk packaging is carried: 50.65 full-crew
days at 0.617 kg/person/day, with no torpor nutrition discount. A separate 1 t
circulating chemical/process inventory is not edible reserve. The complete-diet
food plant operates throughout burns and coast. Two isolated trains, protected
cultures and a credible restart process are required; integrated output and
reserve adequacy are unproven. Universal fabrication and eventual material recovery
remain scenario assumptions; 15 t repair/feedstock and 12 t process/medical buffers
are retained rather than assuming equipment lasts 20 years without maintenance.

Sixteen couples start 42 hours apart: eight people are in their awake week. Ordinary
sleep/recovery and three qualified watchkeepers still require an operational roster.
Assuming all awake during burns/arrival gives about 5.33 years awake and 14.67 in
torpor. Twenty chronological years elapse; torpor does not automatically stop aging.

The optimistic 0.5c effective exhaust is thrust per total rest-mass-loss rate,
including escaping radiation/particles. It is not just charged exhaust speed.
Zero storage losses and zero hydrogen boiloff are assumed with mass allowances.
Earth launch, fuel-production and assembly infrastructure are excluded.

## Sensitivities

| Whole-engine effective exhaust | Departure | Propulsion antimatter |
|---|---:|---:|
| 0.3c | 2,563.3 t | 973.5 t |
| 0.5c | 1,330.8 t | 382.5 t |

| Food-factory hardware target | Departure | Surface retained |
|---|---:|---:|
| 10 t | 1,330.8 t | 386.4 t |
| 20 t | 1,362.3 t | 399.3 t |
| 30 t | 1,393.8 t | 412.1 t |

Sources and component assumptions remain in `mass-budget.json`; `mission_config.json`
contains current policy inputs. `landing_mass_options.py` regenerates switch cases.

## Cruise-engine reuse comparison (unselected)

[ENGINE_REUSE_OPTIONS.md](ENGINE_REUSE_OPTIONS.md) compares keeping the cruise engine
through direct descent, then releasing it at hydrogen handover. Conservatively
retaining the current 10 t thermal-engine and 2 t local-store allowances gives
376.3 t after touchdown and 8.62 t hydrogen at the conditional 1 km switch.
The approximately 126.8 t released stage must divert away; without thrust it
impacts in about 6.77 seconds, before the ideal 18.50-second thermal burn ends.
Separation, stage autonomy, disposal, thermal cooling and plume clearance are
unresolved. This study does not replace the selected architecture reported above.
