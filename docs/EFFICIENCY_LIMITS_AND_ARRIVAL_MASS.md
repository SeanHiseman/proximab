# Efficiency limits and the lightest arriving package

This is a research and mass-disposition audit, not an adopted component redesign.
The selected budget remains 20 t antimatter, zero unused main fuel and staged tanks.
Neither an 84% hybrid figure nor an 85% nozzle figure validates the selected 80%
annihilation-to-directed-exhaust coupling.

## Which maximum is being discussed?

- A quoted high conceptual **hybrid propulsive-energy utilization is about 84%**
  for an AIM D-He3 engine. The energy is predominantly fusion-derived, with AM
  initiating the reaction. This is a conceptual estimate, not a measured engine
  efficiency or a universal maximum across all possible hybrid mechanisms.
  [NASA propulsion comparison, AIM discussion](https://ntrs.nasa.gov/api/citations/19990110316/downloads/19990110316.pdf).
- Keane and Zhang obtain about **85% charged-particle momentum collimation** in
  their beamed-core magnetic-nozzle simulation. Their definition is axial momentum
  delivered divided by the sum of charged-product momentum magnitudes. Neutral
  products are a separate loss. It is not 85% of total annihilation energy entering
  a useful jet, and not a heating coefficient for fusion exhaust.
  [Primary paper, sections 4-6](https://arxiv.org/pdf/1205.2281).
- A magnetic-mirror hydrogen-plasma study finds **less than 2% annihilation-energy
  transfer** under its moderate-density conditions. This is architecture-specific,
  not a physical upper bound on future concepts.
  [LaPointe, NASA-CR-185131](https://ntrs.nasa.gov/citations/19890018329).

Therefore no defensible single research-based maximum can be assigned to the
selected annihilation-boosted fusion mechanism without specifying its transport
and nozzle physics. The published high hybrid and nozzle percentages do not
justify treating the earlier optimistic 80% coefficient as established. An ideal
100% energy-conservation limit is not an engineering forecast and ignores the
particular reaction channels and unavoidable losses of a specified mechanism.

A hypothetical design with fusion-derived energy fraction f and usable source
fractions eta_f and eta_a would have source-to-useful-energy coefficient
`eta = f*eta_f + (1-f)*eta_a`, before other losses. A fusion-dominated engine can
therefore have high overall efficiency despite poor utilization of AM energy.
That does not make additional tonnes of AM equally efficient.

## Arrival mass is not the same as landed mass

The selected 500 t is a retained main-transfer allocation, not a completed bill of
materials. The last component ledger, S3, has 209 t crew lander fixed dry hardware,
7.151 t chemical tanks, 66.92 t inventories and 7.387 t unused chemical reserve at
touchdown: **290.458 t** total. Atmospheric entry is **364.331 t**. The main engine,
hot radiators, forward collision shield and associated orbital hardware are not
in this landed package. Do not count their exclusion as a new saving.

Reducing mass reaching the stellar system requires deleting, relocating to the
other ship, or staging an item before arrival. Leaving it in orbit only reduces
the surface package and associated descent fuel; it still travels interstellar.
Cargo relocation reduces the fast ship's load but does not make fleet mass vanish.

## Concrete surface-disposition sensitivities

Calculated with the existing landing equation (450 s Isp, 1 km/s delta-v, chemical
burn reserve 10%, tanks .08 of loaded fuel plus 10% allowance). Numerical report:
`reports/surface-mass-minimization.json`.

| Case | Entry mass | Touchdown mass |
|---|---:|---:|
| S3 surface package reference | 364.3 t | 290.5 t |
| Leave one 16.5 t service-power unit in orbit | 342.5 t | 273.1 t |
| Leave 36 t of water in orbit, land 8 t working water | 316.8 t | 252.6 t |
| Both orbital transfers | 295.0 t | 235.2 t |
| Both plus a hypothetical 10 t genuine structural reduction | 281.8 t | 224.7 t |

These are gross savings. Reactor isolation, landing power interfaces and water
cells designed for separation have not been sized. Two existing units are assumed
equal in mass; keep both during transit and retain one on the landing habitat.
The 8 t water quantity is a sensitivity, not a demonstrated working-water minimum.
Cargo must verify usable water, surface power and protected accommodation before
crew descent. Transit protection and its water remain available until separation.

The combined case has approximately **198.3 t landed dry hardware**, 30.92 t
inventories and 5.98 t chemical reserve. Only about 17.9 t of its 55.3 t touchdown
reduction is dry hardware: water is inventory, not dry mass. No claim is made that
235 t is a proven minimum viable landed colony habitat.

## Further dry-mass work, in priority order

1. Integrate landing loads with habitat frames rather than maintaining separately
   oversized frames. Current allocations: pressure/floors/frames 55 t, landing
   cradle/engines 19.8 t, transfer equipment 8.8 t. A 10 t net reduction is a useful
   engineering sensitivity only; structural sizing must establish it.
2. Keep transit-only power hardware and its associated thermal components orbital
   when demonstrably separable. Do not strip power needed during descent.
3. Size service power from actual food-production, cryogenic and life-support loads.
   The current allocations are not a completed electrical or thermal load budget.
4. Make transit spin drives/bearings separable if feasible, retaining all pressure
   vessels, floors and landing load paths. The complete 13.2 t spin allocation
   cannot be credited as removable without a component breakdown.
5. Make aeroshell/TPS and landing supports discardable after their jobs if surface
   reuse has no value. That reduces post-landing retained mass, not entry mass.
   The 13.2 t aeroshell allocation is not all necessarily separable.
6. Move surface-only medical/reproductive storage, tools and expansion equipment
   to cargo only after separating them from transit-critical functions. No arbitrary
   savings are assigned to unsplit medical, avionics or spare-parts rows.
7. Use combined structural and shielding functions; do not simply lower protection
   allocation. Actual GCR compliance remains unknown and may increase required mass.

The habitat, food loop, medical capacity and protection must function for the whole
20-year transit. Inflatable volume alone does not remove floors, equipment or
shielding. No further reduction in crew count, safety criteria or habitat volume
has been silently adopted. The useful next target is a component-sized surface
package near the 235 t sensitivity, while separately closing the 500 t retained
main-transfer package and the engine's radiation/thermal mechanism.
