# Arrival, dry mass and separate radiation requirements: assumption audit

11 November 2026. Planning only. No viewer or active design changes.
Reproduce diagnostic numbers with `python -m calculations.arrival_radiation_audit`.
Output: [arrival-radiation-audit.json](../reports/arrival-radiation-audit.json).

## Corrections to carry forward

1. The 159 t hydrogen load came from an assumed 6 km/s terminal propulsion
   allowance. It is not a requirement established by an arrival trajectory.
2. The project already contains a conditional main-engine-through-arrival study
   in ENGINE_REUSE_OPTIONS.md, with about 9 t hydrogen in an older 0.4 km/s
   handover case. The later family-fleet accounting reintroduced 6 km/s without
   demonstrating it necessary. The earlier handover is also not qualified.
3. The 88 t extra-water variant exists only to maintain a chosen 20 g/cm2 column
   after consuming the entire main reaction reserve. It is not established
   life-support demand, a universal shielding requirement or part of the nominal
   integrated candidate. Do not add it twice or convert it into a mandate.
4. Twenty g/cm2 was a comparison column motivated by solar-particle shelter
   guidance. It does NOT establish adequate 40-year GCR protection. Material
   columns cannot replace exposure requirements and particle transport.
5. The 614 t dry result is the output of provisional mass coefficients, not a
   minimum or a validated engineered estimate. The engine/shadow-shield thermal
   and dose requirements remain unclosed.

The earlier 51-58 t antimatter totals remain sensitivity examples for their
assumptions, not a converged minimum-mass mission. Do not create another firm
fleet total until arrival trajectory and radiation allocations are reconciled.

## What the hydrogen does

The main interstellar model accelerates ordinary reaction material to relativistic
exhaust speeds using annihilation energy. The terminal engine is a separate
high-thrust mode/system: antimatter heats hydrogen, which expands through a
nozzle. Hydrogen is reaction mass, not the primary energy source. The assumed
1,800 s Isp is hypothetical, not a demonstrated engine capability.

The earlier 159 t calculation uses 344.4 t landed mass excluding terminal tanks,
6 km/s delta-v, 10% propellant reserve and tanks at 8% of loaded propellant:

    f = 1.1 * [exp(delta_v/(Isp*g0)) - 1]
    propellant = f * landed_without_tanks / (1 - 0.08*f)

Holding that lander fixed purely to isolate the delta-v effect:

| Terminal delta-v | Hydrogen at 1,800 s | Associated tanks |
| --- | ---: | ---: |
| 6.0 km/s | 159.0 t | 12.72 t |
| 2.0 km/s | 45.9 t | 3.67 t |
| 1.0 km/s | 22.2 t | 1.78 t |
| 0.5 km/s | 10.9 t | 0.87 t |
| 0.2 km/s | 4.3 t | 0.35 t |

These are conditional propellant amounts, not achieved atmospheric trajectories.
The final allowance includes gravity, steering, divert and landing losses; it
is not merely the velocity at a chosen altitude. At 450 s, a 0.5 km/s allowance
instead needs 45.9 t combined chemical propellant, and 1 km/s needs 98.6 t.

## Main propulsion before entry

With the reference massive-exhaust model, an isolated low-speed 6 km/s burn
ending with 1,000 t consumes approximately 2.16 kg antimatter plus equal ordinary
annihilation matter and 91.5 kg ordinary reaction material. At 12 km/s these
become 4.33 kg antimatter and 183 kg reaction material. This supports the user's
point: low-speed arrival maneuvers can cost very little main-engine fuel.

These figures exclude gravity losses, orbital trajectory, thrust limits and
staging. The reference main engine's initial peak thrust is only about 1.23 MN.
A 350 t lander weighs about 4.08 MN at the example local gravity 11.67 m/s2;
the attached propulsion stack weighs more. Therefore the existing main-engine
sizing cannot hover or support the full vehicle in a vertical descent. It can
still perform suitable orbital/high-altitude braking where hover is unnecessary.

Slowing at high altitude does not prevent gravity re-accelerating the vehicle.
Optimise a complete arrival path, not an instantaneous stop followed by free fall.
Do not silently increase the engine's thrust without increasing its power,
hardware, shielding and cooling allocations. Engine exhaust interacting with
atmosphere/surface and disposal of the separated stage also need a safe geometry.

## Mars-like atmosphere and reusable forward shield

Treat a Mars-like atmosphere as a conditional planning case, not a confirmed
property of Proxima b. The screen assumes 600 Pa CO2, 210 K, surface density
about 0.0151 kg/m3, g=11.67 m/s2 and drag coefficient 1.5. At this gravity the
vertical atmospheric mass column is only 51.4 kg/m2. Matching Mars surface
pressure does not match Mars atmospheric column when gravity differs.

For a 350 t entry vehicle:

| Shield diameter | Ballistic coefficient | Local surface-density terminal-speed screen |
| --- | ---: | ---: |
| 17.5 m | 970 kg/m2 | 1.22 km/s |
| 30 m | 330 kg/m2 | 0.71 km/s |
| 50 m | 119 kg/m2 | 0.43 km/s |

These are local drag/weight balance values, not simulated touchdown velocities.
They show why a thin atmosphere cannot be assumed to stop hundreds of tonnes
behind a 17.5 m shield. Lift, entry angle, atmospheric profile and active braking
matter. A large deployable aeroshell used only at arrival is a promising trade:
it need not enlarge the cruise dust shield or be deployed during interstellar
flight. Its real mass and survivability must be charged.

Dust shielding and thermal protection are different functions. Reuse of the
backing structure or core is worth studying, but do not assume the same exposed
face works unchanged. Arrival needs aerodynamic shape/stability, thermal
insulation or ablator, pressure/load paths, attachment and landing interfaces.
The interstellar-facing surface may be damaged or eroded. A fresh TPS layer,
reversible panel or deployable skirt could share structure without treating the
entire aeroshell as massless. Preserve or add the shield's mass in the landing
ledger if it remains attached; previous studies discarded it before descent.

Candidate sequence: main-engine orbital/approach braking; controlled separation
of nonlanding hardware; aero-assisted entry where the atmosphere permits; a
high-thrust short terminal burn. Compare 0.5-2 km/s terminal allowances before
selecting one. Do not implement a 0.2-0.5 km/s allowance as demonstrated.

## Reduced landing hydrogen must not drive a circular shielding budget

It is sensible to reduce landing fuel to the trajectory requirement. Do not
carry 159 t of otherwise unnecessary hydrogen merely because the shielding
model learned to use it. Conversely, removing that hydrogen removes its
protection credit and the cryogenic tank arrangement must be redesigned.

The previous 159 t shell contributed about 123.6 t of inner-area column credit.
If the SAME 20 g/cm2 full-envelope target is retained, much of that credit must
be provided elsewhere, partly cancelling the launch-mass saving. That is a
consequence of the assumed target, not evidence that the hydrogen is necessary.

The proper next step is to derive distinct dose/protection requirements and
map the required working inventory/fuel against them. Keep extra retained water
as an explicit sensitivity; do not assume 88 t is either mandatory or safely
removable before this analysis. The existing approximately 88 t unspent main
reaction reserve and the optional approximately 88 t extra water are different
ledger items that happened to have similar values.

## Dry mass: what has a basis and what does not

Current 614.3 t crew dry accounting, including allowances:

| Component | t | Basis |
| --- | ---: | --- |
| Fixed habitat/service/landing/forward-protection hardware | 327.8 | Provisional component allocations and simple area scaling |
| Landing hydrogen tanks | 12.7 | Assumed 8% of terminal propellant |
| Scalable main engine | 99.8 | Assumed 1 GW/kg annihilation power handling, plus allowance |
| Main ordinary-reaction tanks | 116.1 | Assumed 5% tank coefficient, plus allowance |
| Scalable antimatter containment | 54.8 | Assumed 1 kg/kg antimatter, plus allowance |
| Main hot radiators | 3.1 | Radiation-law calculation with speculative absorbed fraction/material data |

The fixed 327.8 t is not all living space. Basic envelope/floors, spin equipment
and furnishings total about 103 t after allowance. Pressure envelope/floors
alone contribute about 60.6 t of that. Medical, food production, life support,
refuge, power, distribution, cryogenics and other equipment make up the remainder.

No whole-ship minimum can be justified from these coefficients. Tank structure,
engine specific power and antimatter containment might be lighter, but might
also be much heavier or infeasible. Reducing the allowance is not an engineering
mass saving. Use component load cases, material allowables, lifetime and thermal
design rather than declare a new 200/300 t minimum.

For perspective, an ideal spherical restraint membrane has:

    mass = 3*rho*pressure*volume/(2*allowable_stress)

For 2,400 m3, 100 kPa, material density 1,500 kg/m3, and effective allowable
stress 100-500 MPa, this gives 5.4-1.08 t. This is only a best-case pressure-load
restraint screen. It excludes non-spherical geometry, floors, bladder, insulation,
MMOD layers, seams, penetrations, reinforcement, redundancy, fatigue/creep,
rotation, deployment, fire protection and entry/landing loads. It shows that
pressure containment alone does not require 48 t, not that a complete habitat
can weigh one tonne.

A primary-structure trade in a NASA-hosted Boeing paper found a composite
configuration lighter than its inflatable comparison for a fixed reference
mission. Do not assume inflatable is automatically minimum mass, or transfer
that study's percentage saving directly to this different ship. If assembly
volume is not the principal constraint, compare rigid composite and hybrid
pressure vessels against softgoods, including outfitting and landing loads.

## Three different radiation problems

| Source | Direction/time | Appropriate first strategy | Missing calculation |
| --- | --- | --- | --- |
| Galactic cosmic rays | Broad sky, entire flight | Useful hydrogen-rich mass around high-occupancy spaces; actual cumulative-dose design | Spectrum, transport, organ doses, occupancy and acceptable lifelong exposure |
| Incoming gas/dust and shield secondaries | Primarily forward at cruise | Sacrificial front layers, standoff, secondary-particle protection, geometry | Route gas/dust distribution, rare grain risk, stopping and secondary transport |
| Engine/power radiation | Known source regions, burns or continuous power | Separation and local shadow shielding, source control; thermal design | Source spectrum/extent, angular emissions, cascades, heat deposition and dose |

Solar/stellar particle events are a further separate shelter problem. Neither
the forward shield nor engine shadow shield surrounds the crew against GCR.
Conversely, an all-around water layer must not be assumed to stop the intense
engine gamma/neutron source. High-Z material can be useful in a local gamma
shield even though indiscriminate high-Z GCR shielding is unattractive.

GCR: NASA's adult astronaut career reference of 600 mSv would allow averages
of only 0.082, 0.055 and 0.041 mSv/day over 20, 30 and 40 years respectively,
before reserving dose for settlement or other sources. These are bookkeeping
averages, not established acceptable childhood/pregnancy limits. NASA's much
larger daily free-space GCR criterion cannot be applied for 40 years while
ignoring the career total. Modest passive columns do not establish the needed
multi-decade suppression; no safe mass minimum follows from the existing model.

Forward impacts: at the current approximately 0.113c cruise speed, hydrogen
arrives at about 6.04 MeV per proton. At the inherited assumed 0.2 H atoms/cm3,
fully stopped hydrogen alone deposits about 6.55 W/m2. This is not the full
heat/dose environment: helium, grains, route variations and secondaries are
excluded. Rare dust impacts can dominate damage despite a small average gas
heat flux. This protection should remain localised forward rather than be
charged as an omnidirectional 360 t blanket.

Engine: the reference candidate has approximately 80 TW initial annihilation
power. If 38% were isotropic prompt gamma power, a habitat radius 8.75 m at
100 m subtends enough source solid angle to intercept roughly 58 GW before
attenuation. At 1 km this is about 0.58 GW. These are geometric incident powers,
not absorbed powers or doses. A thermal-only point-source screen needs about
0.85 km separation to keep full deposition below a 10^-5 total-power budget.
It does NOT establish that 0.85 km is safe, determine shadow-shield mass, or
cover finite source size/scattering. The prior SHIELDING_ASSESSMENT.md already
documents why the compact engine/shadow-shield thermal budget is unclosed.

Engine radiation may dominate instantaneous protection during burns; GCR may
dominate cumulative exposure during decades of coast; forward impacts may
dominate catastrophic damage risk. There is no valid single percentage split
or common shield-thickness requirement without solving all three separately.

## Next planning direction

Treat main-engine approach braking plus atmosphere-assisted/short-terminal-burn
arrival as the candidate to study, with a vacuum fallback. Study shared dust
shield/aeroshell structure and a deployable arrival-only skirt. Recompute the
landed shield load, propulsion thrust and disposal trajectory. Establish
source-specific exposure targets before selecting retained protection water.
Replace habitat mass coefficients with pressure, rotation, floor, thermal,
deployment and landing load estimates. Keep the viewer unchanged during this audit.

Sources:

- [NASA LOFTID overview](https://www.nasa.gov/missions/tech-demonstration/loftid/low-earth-orbit-flight-test-of-an-inflatable-decelerator-loftid-overview/): deployable atmospheric decelerators, not qualification for this lander.
- [NASA Proxima b context](https://science.nasa.gov/exoplanets/big-questions/): atmosphere is a conditional property, not an established Mars-like profile.
- [NASA radiation requirements](https://www.nasa.gov/reference/4-0-human-performance/).
- [NASA GCR shielding assessment](https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf): GCR mitigation limits and cumulative exposure.
- [Habitat primary-structure comparison](https://ntrs.nasa.gov/api/citations/20240007484/downloads/Habitat_Primary_Structure_Comparison_ASCEND_R2.pdf): mission-specific rigid/composite/inflatable trade.
- [NASA antimatter overview](https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf): annihilation-energy channels; not validation of this engine.
