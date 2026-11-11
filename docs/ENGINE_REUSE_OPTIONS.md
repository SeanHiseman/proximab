# Reuse the cruise engine through descent: conditional comparison

The earlier independent direct/thermal descent engine was introduced because the
cruise engine was left in orbit. That duplication is an architecture choice.
A reuse option keeps the main direct-exhaust engine attached through arrival and
most descent, then releases it when hydrogen-heated thrust takes over.

The small retained touchdown system is still antimatter-powered: it heats hydrogen
rather than producing direct particle exhaust. It requires its own heater, chamber,
nozzles, feed controls and local fuel isolation. The distinction is between direct
and hydrogen-heated operating hardware, not between antimatter and another fuel.

## Mass comparison at the conditional 1 km switch

| Quantity | Earlier independent descent engine | Reuse / late main-engine release |
|---|---:|---:|
| After touchdown | 386.39 t | 376.30 t |
| Touchdown hydrogen | 8.86 t | 8.62 t |
| At hydrogen ignition, after release | 395.24 t | 384.93 t |
| Departure including all propellant | 1,330.83 t | 1,330.20 t |

The full existing 10 t touchdown-engine and 2 t local-containment allowances are
retained conservatively, now assigned to hydrogen-heater/nozzles, feed systems,
isolation and thermal control. No numerical saving from removing duplicated direct
nozzle hardware has yet been credited. A lighter thermal-only unit might save more,
but needs a mass estimate. These targets remain unvalidated, not hardware designs.

The approximately 10.1 t extra surface saving is the former retained direct-engine
hot radiator system and its 25% allowance, which now leave with the cruise engine.
The previous architecture already left the main cruise engine off the lander;
its entire stage mass is therefore not an additional saving against that baseline.

## Sequence to develop

1. Use the main direct-exhaust engine for interstellar braking and arrival.
2. Release the dust shield, spin bearings and remote scouts before descent.
   The cruise engine, bulk containment, support frame and shared hot radiators remain.
3. Follow continuous direct braking toward the thermal handover point.
4. Establish controlled hydrogen-heated thrust and isolate/disconnect the direct
   propulsion stage. Coordinate thrust with the sudden reduction in accelerated mass.
5. The released stage follows a controlled divert/disposal trajectory; the habitat
   continues its short thermal descent. No main propulsion hardware is landed merely
   to provide stock material.

In the 1 km case about 126.8 t is released at handover, including hardware margin
and unused correction fuel. The independent stage needs control, power, actuators,
cooling and a separation/divert plan. The existing 2 t interface allocation does
not establish that this all fits. No autonomous-stage hardware reduction or free
safe-disposal maneuver is credited.

The mass balance is closed at release: departure includes early-release equipment,
late-release propulsion equipment, all consumed fuel and the settlement. Disposal
fuel would come from released stock; the actual maneuver is not calculated here.
The main engine and its cooling remain charged to every phase where they operate.

## Why simply dropping it is unsuitable

| Handover height | Hydrogen budget | Hydrogen | After touchdown | Unpowered stage impact time |
|---|---:|---:|---:|---:|
| 10 km | 1.025 km/s | 22.62 t | 378.40 t | 21.40 s |
| 5 km | 0.800 km/s | 17.51 t | 377.63 t | 15.14 s |
| 1 km | 0.400 km/s | 8.62 t | 376.30 t | 6.77 s |

At the 1 km handover, downward speed is approximately 108 m/s. With no propulsion,
a constant-local-gravity point-mass calculation puts stage impact at 6.77 seconds,
while the ideal thermal touchdown segment lasts 18.50 seconds. An instantaneous
lateral impulse of approximately 148 m/s would produce only 1 km crossrange by
that impact time; this is not a feasible-divert calculation or a safe-distance claim.
A powered stage can alter its fall, but must avoid the habitat and its landing site
with its thrust, exhaust, impact and ejecta. Clearance must be designed before this
becomes the active architecture.

The compact thermal system also requires qualified regenerative/pulse cooling.
Discarding direct-engine radiators does not eliminate heater wall heat; the 10 t
allowance includes thermal control as a target, but no wall-flux model establishes it.

The terminal model assumes airless Proxima b, 1.44 Earth masses and 1.10 Earth
radii, constant 1.7876 Earth g proper acceleration and a 0.400 km/s thermal allowance
at 1,800 s Isp. It uses the same optimistic 0.5c direct effective exhaust and 1e-7
heat-interception model as the active design. Hot radiators support the larger of
cruise and direct-descent heat loads. The 12 km/s total direct-arrival allowance,
2 km/s pre-descent capture allocation and 0.1-year arrival time are not an integrated
orbit/terrain trajectory. Radiation and plume suitability down to 1 km are unqualified.

`engine_reuse_options.py` and `engine-reuse-options.json` hold the comparison.
The frontend now previews this **conditional engine-reuse concept**, including its
376.3 t settled mass, 8.62 t hydrogen, retained thermal hardware and release ledger.
The earlier independent-engine calculation remains in `mass-budget.json` as a
comparison; the downloaded viewer data explicitly includes both and identifies
`viewer_design` as the displayed study. Handover and disposal remain unresolved.
This preview does not qualify an operational staging altitude or vehicle design.
