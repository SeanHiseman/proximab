# Cosmic-ray exposure and concentrated torpor shielding

12 November 2026. Applies to concept v1. This is a published-rate screening
calculation and shielding inventory audit, not a particle-transport solution.
Reproduce: `python -m calculations.cosmic_ray_exposure`.
Results: [cosmic-ray-exposure.json](../reports/cosmic-ray-exposure.json).

## Conclusion

Concentrating shielding around torpor occupants is the correct mass-saving
direction. It does not by itself close the cumulative cosmic-ray requirement.
The illustrative adult schedule accumulates about 17.7 Sv with a published
20 g/cm2 hydrogen-rich shielding proxy during torpor and no added protection
credited while awake. Even perfect protection during torpor leaves 8.3 Sv in
the same awake-field proxy. The current adult flight target is 0.4 Sv total,
with at most 0.3 Sv assigned jointly to GCR and service power.

These figures are NOT predictions of actual interstellar or child dose. They
establish a serious design shortfall under a transparent benchmark. Actual
ship dose and validated protection fraction remain unknown, not zero.

## Rate benchmark and limitations

[NASA/TM-20220002905, Table 8.4-1, printed p.142](https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf)
provides adult-reference effective-dose rates for a 2009 solar-minimum model:

| Reference shielding | mSv/day |
| --- | ---: |
| None | 1.52 |
| 20 g/cm2 polyethylene | 1.04 |
| 40 g/cm2 polyethylene | 1.03 |

These are not water-wall or child-phantom results. They illustrate diminishing
benefit of additional passive material. No percentage is transferred directly
to the proposed spacecraft. Higher columns are not extrapolated exponentially.

The trip spends most of its duration beyond the heliosphere. Voyager measured
increased cosmic rays there; a heliospheric solar-minimum spectrum is not the
local interstellar spectrum. [NASA Voyager](https://science.nasa.gov/mission/voyager/interstellar-mission/)
The benchmark therefore is neither a calibrated forecast nor a rigorous upper
or lower bound. Exact analysis needs a local interstellar spectrum, transformation
into the approximately 0.1135c vehicle frame, material transport and dosimetry.
Do not use solar-maximum shielding by the Sun for decades in interstellar space.

The benchmark quantity is NASA adult-reference effective dose, not absorbed
dose in gray, measured personal organ dose, fetal dose, or a child cancer-risk
prediction. Chronic cumulative values must not be interpreted as acute exposures.
No biological radiation-protection credit is assigned to torpor itself.

## Exposure schedule and calculation

Main-transfer proper time is 39.664 years. Add the 0.1-year arrival allowance
approximately as onboard time: adult exposure interval 39.764 years. Use the
midpoint birth time of crew year 20; the representative child interval is
19.764 years. Exact birth windows and arrival clocks can be refined later.

The selected roster is 25% awake for the first twenty years and 50% awake in
the family phase. This is an average adult allocation, not a named-person
schedule: 14.882 awake years and 24.882 torpor years. The latter is only 62.6%
torpor, because parenting changed the original quarter-time-awake assumption.

    D_Sv = 365.25/1000 * (years_awake * rate_awake + years_torpor * rate_torpor)

Own calculations using the benchmark rates:

| Adult scenario | Cumulative adult-reference effective-dose proxy |
| --- | ---: |
| No added shielding credited throughout | 22.08 Sv |
| 20 g/cm2 proxy only during torpor | 17.71 Sv |
| 40 g/cm2 proxy only during torpor | 17.62 Sv |
| 20 g/cm2 proxy throughout all activities | 15.10 Sv |
| Perfect zero-dose torpor bay; awake field unchanged | 8.26 Sv |
| Perfect bay and original 25%-awake roster throughout | 5.52 Sv |

The 20 g torpor-only case saves about 19.8% of this no-shield reference exposure.
That is a scenario result, NOT the currently achieved protection of the water
bays. Geometry and water composition have not been transported.

Children receive no torpor credit in the selected specification. Applying the
same ADULT reference conversion only as an exposure-duration comparison:

- 19.764 years in the awake reference field: 10.97 Sv adult-reference proxy.
- Eight hours/day in a 20 g shield proxy, if protected sleeping places are built:
  9.82 Sv adult-reference proxy.
- All time in that shield proxy: about 7.51 Sv adult-reference proxy.

These are not actual child effective/organ doses; age-specific modelling is
required. Protected child sleep cannot be added without enough shielded places:
16 torpid adults plus 32 simultaneously sleeping children requires 48 places,
not the 32 places in the two-bay adult torpor screen below.

To keep GCR/service exposure below 0.3 Sv over the adult interval requires an
average no greater than about 0.0207 mSv/day. Against the no-shield reference,
that is 98.64% reduction. Even with a perfect bay, no more than about 1.36% of
time could be spent in the unchanged awake reference field. Normal awake living
therefore also needs a much stronger dose solution; torpor shielding alone is
not enough for the specified roster.

## What the current specification physically provides

1. **Central refuge:** 44 t allocated water around a cylinder 6.4 m diameter,
   7.5 m long. The previous mass/inner-area calculation gave 20.45 g/cm2. Correcting
   for finite shell/corner volume gives a uniform water thickness of **19.32 cm**,
   hence 19.32 g/cm2 along a normal path, before gaps/penetrations. A true uniform
   20 cm shell requires **45.63 t**, about 1.63 t more. This is a geometry correction,
   not a dose qualification. The refuge is not the location of normal torpor.
2. **Gravity-module torpor berths:** useful-mass cells are intended, but no final
   all-direction thickness distribution or local material manifest exists.
   A numerical dose reduction cannot yet be assigned to those berths.
3. **Envelope layers:** the 12 t provisional restraint/liner/thermal-impact layer
   allocation, spread over 1,250 m2, averages only about **0.96 g/cm2**. It is not
   homogeneous polyethylene. Floors, frames and machinery add highly directional
   shielding; dividing total ship mass by envelope area would overcredit them.
4. **Forward shield:** at the three module centres it covers approximately 3.08%,
   0.97% and 0.46% of the sky, respectively. Those are geometric solid angles,
   not dose-reduction percentages. It cannot block the whole GCR field.
5. **Engine shadow shields:** protect specific source directions, not the broad
   sky. Their potential secondary radiation belongs in a separate source budget.
6. **Active GCR system:** 30 t allowance only. No coil/current/transport solution
   exists, so no achieved dose-reduction percentage is credited.

The 44 t refuge inventory is counted once. It cannot simultaneously be claimed
as shielding in the central refuge and in two separated gravity-module bays.

## Ordinary fuel already available for shielding

The reference main reaction inventory is approximately:

| Phase | Ordinary reaction water |
| --- | ---: |
| Departure | 1,710 t |
| Coast / start of braking | 691 t |
| After nominal braking | 81.4 t reserve |

A complete 20 cm shell around the three pressure spheres would require about
259 t water; 25 cm requires about 326 t. Thus enough ordinary fuel exists to
fill such cells during coast, if the layout and structure support it. That is
available inventory, not verified placement. Near arrival, the reserve alone
would give only about 6.5 g/cm2 on a thin-layer full-envelope average, before
accounting for geometry and reserve consumption. Local concentration is valuable.

## Proposed torpor shielding priority

Use two protected adult torpor bays, one in each rotating module, with 16 places
each. A **4 m internal cube per bay** is a volume/mass screen only, not a selected
interior layout: combined volume 128 m3, four m3 per berth before hardware.
Medical access, curvature, gravity orientation, structural loading, transfer and
fire isolation still need layout validation. These replace existing berth spaces;
their volume is not additional accommodation.

For two such cubes, including water around edges/corners:

| Uniform water thickness | Total water mass, excluding tank hardware |
| --- | ---: |
| 20 cm | **42.37 t** |
| 40 cm | **93.18 t** |
| 1 m | 304 t |

Twenty centimetres around the two bays uses about one-sixth the water of the
full-habitat 20 cm shell. Reallocating the existing 44 t nearly covers it, but
removes the central refuge's independent water shield. Protecting all 64 in a
stellar event then needs a demonstrated alternate occupancy plan or separate
inventory. The hardware/plumbing mass must also be charged.

For a 40 cm pair, the extra water beyond that 44 t is about 49.2 t. In the
nominal reference inventory this could come from main reaction reserve, but
the same reserve cannot be both expendable contingency propellant and guaranteed
late-braking protection. This option does not imply a large dose benefit: the
benchmarked passive GCR response is nearly flat across the compared columns.

Adopt concentrated torpor/sleep protection as a design principle. Do not make
equal shielding of every room a requirement. Do not yet update the selected
refuge geometry or reduce mass/dose ledgers until coverage, capacity and reserve
use are reconciled. The current concept does not satisfy its radiation target.

## Required calculation to replace this screen

- Reconstruct a local interstellar GCR spectrum, including ions and relevant
  energies; distinguish it from incoming neutral gas/dust and engine emissions.
- Transform that spectrum into the ship frame along the trajectory.
- Define material/thickness maps around every occupied berth and awake zone,
  including tanks, gaps, floors, machinery and actual fuel depletion.
- Run validated radiation transport including secondary neutrons/fragments and
  compare independent codes/benchmarks where appropriate.
- Score adult and age-specific child/fetal organ doses; apply actual occupancy
  and protection schedules. Obtain appropriate dose/risk acceptance requirements.
- Include engine, forward-impact and stellar events separately; do not bury them
  inside the GCR rate or treat total flight dose as GCR alone.

The supplied code performs none of those transport steps. It verifies inventory,
geometry, clocks and weighted-dose arithmetic and labels the resulting proxies.
