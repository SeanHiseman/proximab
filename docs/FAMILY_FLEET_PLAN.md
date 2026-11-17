# Family fleet: planning handoff, not implemented

**Selected concept specification (12 November):** [REDESIGN_SPECIFICATION.md](REDESIGN_SPECIFICATION.md)
and [machine-readable parameters](specs/redesign_v1.json) now define the next
visual proposal. Earlier studies below are history/sensitivities. The selected
concept remains unqualified, particularly for lifelong radiation protection.

**Latest correction:** [ARRIVAL_AND_RADIATION_AUDIT.md](ARRIVAL_AND_RADIATION_AUDIT.md)
prioritises main-engine approach braking, conditional atmospheric assistance,
short terminal burns and source-specific radiation requirements. Do not bake
159 t landing hydrogen, 88 t extra water, or a claimed minimum dry mass into the
viewer. Investigate shared dust-shield/aeroshell structure, including landing
load and a possible arrival-only deployable skirt.

**Latest investigation:** [INTEGRATED_SHIELD_MASS_STUDY.md](INTEGRATED_SHIELD_MASS_STUDY.md)
records minimum-added-shielding priorities: reuse ordinary fuel/water, investigate
compact accommodation and distributed landing-hydrogen protection, and verify
late-braking coverage. The old separate shield allocation is not a design mandate.
This remains a planning candidate; no viewer geometry has been implemented.

11 November 2026. User-requested planning only. This document does not change
the active ship geometry, input data, mass ledger or viewer. Do not interpret
the numerical propulsion examples as a completed spacecraft design.

Follow-up: [FAMILY_FLEET_BUDGET.md](FAMILY_FLEET_BUDGET.md) supersedes the
illustrative 200 t crew / 100 t cargo mass example with a conditional mass ledger,
finite burns and hardware feedback. The user clarified that births are flexible:
target approximately 20 years of childhood before arrival, with births around
crew years 20, 10 and departure for 40-, 30- and 20-year flights respectively.
The user further specified a fixed 20-year cargo departure lead in every case:
cargo/crew flight durations are 60/40, 50/30 and 40/20 years. Cargo departs fleet
year 0 and crew departs year 20 in every case; shared arrival is fleet year 60,
50 or 40 respectively. The original 40-year baseline below remains the main
visual planning case.

## Accepted changes for a future implementation

| Topic | Planned requirement |
| --- | --- |
| Objective | Minimise total antimatter across both ships, including braking, landing, power, reserves and storage losses; departure mass is a secondary constraint |
| Cargo | Uncrewed, 60-year flight; departs at fleet year 0 |
| Crew | 40-year flight; departs at fleet year 20; both arrive at fleet year 60 |
| Initial crew | 32 adults, approximately age 20 at crew departure |
| Family phase | Up to 32 births around crew mission year 20, using embryos fertilised before departure; allow a gestation/recovery window rather than a single birth instant |
| Arrival population | Up to 64: original adults approximately 60 and children approximately 20; these are approximate elapsed-age figures, not a claim that torpor halts aging |
| Gravity/pregnancy | Accept adequate gravity exposure and possible pregnancy as user-specified planning assumptions; do not reopen these as blockers |
| Children | Gravity habitats support childhood through 20 years; do not assume child torpor to meet minimum capacity |
| Torpor | Retain quarter-time-awake adult rotation as a starting assumption, with pregnancy, parenting and recovery exceptions; older children may optionally enter torpor, with no fixed eligibility age assumed |
| Habitation | Gravity habitats plus spacious expandable common accommodation; expandable modules may also rotate |
| Cargo geometry | Narrow axial arrangement within a small forward dust-shield footprint; minimise total mass rather than diameter without limit |
| Landing/exploration | Retain landable crew refuge/habitat and useful initial exploration; shift suitable heavy surface equipment to cargo |

Mission years are initially reference-frame scheduling labels. At these speeds
proper-time differences are small but must be included when assigning exact
ages, pregnancies and burn timelines. Torpor is not an aging credit.

## Visual handoff: conspicuous changes to show later

1. Show two independently selectable vehicles, labelled CREW / 40 YEARS and
   CARGO / 60 YEARS. Add one fleet timeline with departures at 0 and 20 and
   shared arrival at 60. No confirmed-cargo-arrival-before-crew-launch claim.
2. Cargo silhouette: small forward shield, long axial spine, serial packed
   surface modules and tanks, aft propulsion and standoff. No crew wheel or
   crew living enclosure. Show radiators separately, with protection/retraction
   unresolved rather than silently hiding their exposure.
3. Crew silhouette: retained gravity accommodation, child/family gravity space,
   expandable common areas within the forward shield projection, and a rigid
   emergency/descent refuge. Dimensions and number of wheels are not selected.
4. Provide phase labels: adult-only cruise; pregnancy/infant transition; growing
   families; arrival/landing. Population rises from 32 to at most 64. Show adult
   awake, adult torpid, children awake and optional child torpor separately.
5. Gravity rooms must support children continuously if required, including
   sleeping, education, play, hygiene, care and medical access. Eight awake
   adults is not the maximum family-phase occupancy: 32 awake children plus
   eight awake adults already means 40 awake, before extra caregivers.
6. Size emergency refuge, life support and descent restraints for all 64.
   Include all-awake contingencies and a 64-person surface food/power load.
   Do not simply double the whole ship: distinguish fixed and population loads.
7. Colour-code crew-retained, cargo-delivered and discarded/orbital hardware.
   Avoid duplicate credits for equipment already staged in existing studies.
8. Clearly mark speculative propulsion and unclosed mass allocations in the
   visual legend. The old 297.473 t dry allocation is not a valid new fleet total.

## Propulsion comparison and reproducible equations

Assume distance 4.24 light-years, brief burns, coast then full stop, no staging,
constant exhaust speed, and arrival mass M including everything retained after
interstellar braking (not merely dry hardware). Finite burns, landing stocks,
reserve, storage losses and equipment sizing are excluded from the numbers.

Let beta = 4.24 / flight_years and A = 2 atanh(beta).

For equal-mass annihilation fuel with no added reaction mass and effective
exhaust u*c: R = exp(A/u); antimatter/M = (R - 1)/2.

| Propulsion assumption | Crew kg antimatter/t arrival | Cargo kg antimatter/t arrival |
| --- | ---: | ---: |
| Existing 0.5c effective exhaust | 265.253 | 163.645 |
| Hypothetical 0.7c effective exhaust | 177.634 | 112.072 |
| Ideal directed photon exhaust, 1c | 118.568 | 76.040 |
| Ideal annihilation-powered ordinary reaction mass, optimised constant speed | 17.559 | 7.752 |

The last row is a different engine/fuel accounting model. Assume annihilation
energy converts perfectly into a collimated massive exhaust, without waste heat
or escaping unusable radiation. For exhaust speed u*c and gamma_e =
1/sqrt(1-u*u), total ship rest-mass loss is gamma_e times expelled ordinary
exhaust rest mass. Annihilated matter-plus-antimatter supplies the difference.
Thus:

    R = exp(A/u)
    antimatter/M = 0.5 * (1 - sqrt(1-u*u)) * (R - 1)
    matching annihilated matter = antimatter
    ordinary reaction mass/M = (R - 1) * sqrt(1-u*u)

Minimising this expression numerically for 0 < u < 1 gives:

| Quantity | Crew 40 years | Cargo 60 years |
| --- | ---: | ---: |
| Cruise speed/c | 0.106000 | 0.070667 |
| Optimal constant exhaust speed/c | 0.13254 | 0.08854 |
| Departure/arrival mass | 4.98059 | 4.94774 |
| Antimatter/arrival mass | 0.0175591 | 0.00775213 |

These are minima only within this ideal constant-exhaust model, not a universal
physical bound or an engineered engine. Variable exhaust, staging and external
propulsion are separate trades. This is not a conventional thermal hydrogen
engine: exhaust at roughly 0.09-0.13c needs a speculative high-energy conversion
and acceleration system. Nonideal losses change both effective exhaust and
mass ratio; dividing the ideal antimatter by an efficiency alone is not a
self-consistent rocket solution.

For crew arrival mass C tonnes and cargo arrival mass K tonnes, the ideal
reaction-mass benchmark is:

    total antimatter tonnes = 0.0175591*C + 0.00775213*K

Illustration only: C=200 t, K=100 t gives 4.287 t antimatter, equal matching
annihilation matter, and about 1,491 t combined departure mass. The same split
uses 69.415 t antimatter with the existing 0.5c pure-annihilation convention,
or 31.318 t with ideal photon exhaust. None of these establishes that a family
ship for 64 people fits 200 t or that cargo hardware fits 100 t.

Moving one retained tonne from crew to cargo saves 9.807 kg antimatter in the
ideal reaction-mass comparison, before duplicated hardware. Each extra cargo
tonne costs 7.752 kg; each extra crew tonne costs 17.559 kg. A 100 t transfer
saves 0.981 t antimatter, paying for at most about 126.5 t extra cargo retained
hardware if no extra crew mass is added. Recalculate after hardware scaling.

## Narrow cargo trade

For a circular forward shield of diameter D and areal mass sigma,
M_shield = sigma*pi*D^2/4. Halving diameter quarters this area-dependent mass,
but does not quarter edge/support mass or prove a suitable shielding column.
Long tanks/spines, buckling, bending, attitude control, radiator exposure,
engine geometry and landing interfaces place limits on narrowing.

The reaction-mass option carries roughly four tonnes of expended mass per tonne
retained, mostly ordinary propellant. Tank volume and shielding may therefore
dominate the narrow-cargo trade. Include propellant choice, tank/insulation mass,
60-year retention and acceleration loads before selecting diameter. Protect
against relevant off-axis incidence; a geometrical shadow is not complete
radiation protection. Resolve braking orientation and shield exposure explicitly.

## How to seek the lowest fleet total

1. Retain both improved direct-annihilation and reaction-mass candidates until
   engine, tanks, radiators and containment have masses. Optimise each ship
   separately; fixed 0.5c exhaust is no longer the default optimum.
2. Build family population/awake schedules and consumable flows first. Include
   infant care, growth, pregnancy, higher caregiver staffing, education, spares
   and maintenance over 40 years. Count new body mass through the material loop,
   not as matter appearing at birth. Require up to 64 protected occupants.
3. Allocate surface industry and heavy exploration cargo to the precursor, but
   keep independent crew survival, descent, initial surface power, food and
   useful exploration aboard the crew vessel. Simultaneous arrival does not
   guarantee a functioning cargo lander or pre-deployed settlement.
4. Iterate diameter, shielding, propellant volume, structural mass, thermal
   rejection, burn duration and antimatter together. Report all omitted terms.
5. Minimise fleet antimatter including main burns, correction/landing reserves,
   transit/surface power and containment losses. Also report departure mass,
   production energy, peak power and hardware assumptions so savings are real.
6. Compare external departure propulsion and antimatter-catalysed nuclear
   propulsion as optional architecture branches. If unrestricted non-antimatter
   energy sources are admitted, antimatter's theoretical minimum is zero;
   feasibility at the required transit times must then be established separately.

No defensible numerical global minimum exists yet: family-habitat mass,
propulsion hardware and allowed alternative energy infrastructure are unclosed.
The 4.287 t illustration is a useful hypothetical target, not a fuel budget.

## Sources and evidence limits

- Relativistic rocket equations: https://math.ucr.edu/home/baez/physics/Relativity/SR/Rocket/rocket.html
- CERN on difficulty using annihilation products: https://home.web.cern.ch/science/physics/antimatter/
- Beam-core engine optimisation research: https://arxiv.org/abs/1205.2281
- Expandable habitat demonstration: https://www.nasa.gov/international-space-station/bigelow-expandable-activity-module-beam/
- Existing local budget: MISSION_300_TRADE.md (baseline only; not updated here).

New numerical results above are analytical accounting calculations, not claims
of demonstrated propulsion, medical capability or achievable hardware mass.
