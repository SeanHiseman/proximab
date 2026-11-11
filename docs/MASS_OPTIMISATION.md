# Historical mass audit: the ISS comparison and lighter alternatives

The compact lightweight option has now been selected and refined. See MASS_BUDGET.md
and selected_mass_budget.py for the current quantities. The historical table below
uses its original 16-year transfer and shield assumptions for a controlled comparison.

The 6,111 t reference estimate is not a demonstrated minimum. It combines a very
large enclosure, conservative stocks, a complete carried surface starter plant,
explicit hardware allowances and interstellar propellant. My earlier conclusion
was too definite: unknown engine and containment masses cannot support a precise
minimum spacecraft mass.

NASA lists the ISS at 419,725 kg, with 1,005 m3 pressurised volume and 388 m3
habitable volume. Its total mass includes truss, solar power, laboratories and
other equipment; it is not a bare pressure-hull mass. The 30 m disc reference uses
an upper gross-volume approximation of 25,447 m3: about 25 times the ISS pressure
volume. This comparison uses gross pressurised volumes, not ISS habitable volume
against our gross volume. Neither number establishes our actual usable interior.
[NASA ISS facts](https://www.nasa.gov/international-space-station/space-station-facts-and-figures/)

Inflatable construction can provide deployed volume with a relatively compact
launch package. NASA lists BEAM at about 1.4 t and 16 m3 living volume. It is a
small technology-demonstration module, not a self-contained, fully equipped
36-person spacecraft. It does not provide a scaling law for a spinning, folding,
multi-deck disc that also lands. Pressure restraint, floor loads, joints, shielding,
equipment and supplies must still be carried.
[NASA BEAM](https://www.nasa.gov/international-space-station/bigelow-expandable-activity-module-beam/)

## Recalculated alternatives

All quantities are tonnes, rounded. Hardware includes 25% development margin.
Retained mass additionally includes people, stocks and unburned propulsion reserve.
Departure includes the fuel burned during flight and landing. The reserve is
already included in retained mass and loaded-fuel quantities; do not add it twice.

| Alternative | Hardware + margin | Retained | Departure |
|---|---:|---:|---:|
| Current 30 m discs, reference allowances | 1,520 | 1,991 | 6,111 |
| 20 m discs, same equipment assumptions | 1,319 | 1,754 | 5,385 |
| Compact plus 2 MWe bootstrap power | 1,181 | 1,600 | 4,913 |
| Compact bootstrap plus bulk food packaging | 1,178 | 1,559 | 4,786 |
| 30 m discs, lightweight equipment targets | 699 | 1,010 | 3,100 |
| 30 m lightweight discs plus cruise agriculture | 709 | 869 | 2,668 |
| 20 m discs, lightweight equipment targets | 586 | 871 | 2,674 |
| Compact lightweight plus hypothetical reduced torpor nutrition | 579 | 766 | 2,351 |

These are controlled sensitivities, not equally credible flight designs. The last
four rows require optimistic hardware targets. The final row additionally assumes
20% nutrition demand during torpor, which has not been established for a safe
human 21-day regimen. It is not included in other rows.

The calculation holds 1.2g acceleration, 0.5c effective exhaust, 25% hardware margin,
5% direct-fuel reserve, 12 km/s direct arrival allowance, 1.025 km/s thermal touchdown,
1,800 s thermal Isp, baseline 10^-7 engine heat interception and baseline radiator
specific mass unchanged. This prevents a lighter scenario quietly gaining a better
engine, smaller reserve or reduced engineering margin. Fuel-dependent tanks and
hot radiators are recalculated with each mass reduction.

## Where the reductions come from

### 1. Reduce enclosure size without removing private cabins or shared rooms

Two 20 m-radius discs with floor radii 18/14/10/6 m provide approximately 1,810 m2
gross floor, or 1,176 m2 net at the same provisional 65% factor. The conceptual
programme allocates 587 m2 per disc, including nine 12 m2 double cabins, dining,
quiet/social rooms, rehabilitation, clinical, work, plant, stores and circulation.
This is a preliminary area fit, not a bay-by-bay pressure/egress layout.

Membrane area falls from approximately 13,006 to 6,158 m2. Outer-envelope area is
not an upper bound on actual compartmentalised membrane area: internal pressure
walls and ties require a separate design. Gas volume falls to 11,310 m3.

The shield can shrink from 66 x 20 m to 46 x 20 m only because the existing
radiators are 44 m high. A 40 m habitat diameter alone does not justify a 40 m
shield. Dust protection at either areal mass is unvalidated.

At 0.5g on the 18 m outer floor, rotation rises to 4.98 rpm. Human adaptation,
movement-induced forces and repeated wake/recovery transitions need research;
this is not an assured comfort level. NASA experiments examined performance up
to 6 rpm and found adverse effects that medication did not simply eliminate.
[NASA rotation-performance study](https://ntrs.nasa.gov/citations/19730003384)

### 2. Manufacture the expanded surface power plant after arrival

Carry a 2 MWe starter rather than the entire 10 MWe surface installation. Retain
the 1 kg antimatter energy bank. Power hardware is assigned 30% of the reference
mass, allowing fixed overhead; service radiator area/mass scales to 20% at the
same assumed temperatures and efficiencies. The factory starter and farm remain
carried. Later power conversion and radiators are manufactured locally.

This depends on the accepted advanced-fabrication assumption and a detailed load
schedule proving that the starter can commission the factory, food and life
support systems. Fuel energy alone does not establish generator output. This
change does not reduce hot main-engine radiator requirements independently of
its reduction in departure mass.

### 3. Use bulk packaging and target lighter equipment explicitly

Full-metabolism food plus packaging is 190 t in the reference. Reducing packaging
from 0.26 to 0.10 kg/person/day, while keeping dry food at 0.617 kg/person/day,
reduces this to approximately 156 t. Long shelf life and sanitary bulk handling
remain to be demonstrated.

Lightweight-equipment scenarios use the existing low component allowances,
including 6 kg/m2 membrane and 10 kg/m2 floor targets, 35 t engine hardware and
40 t main antimatter containment hardware. The last two are especially uncertain:
there is no demonstrated tonnes-scale storage system or justified mass-capacity
law. They are engineering targets, not measured technology specifications.

### 4. Operate the carried farm during cruise

The full-size lightweight case can be reduced to approximately 2,668 t departure
by operating its already-carried farm during the journey, replacing 16.5 years
of stored food with two years of full-crew reserve. An additional 15 t hardware
allowance covers hydroponic conversion and startup; no surface regolith is
carried. The original farm hardware and factory remain counted.

At least 833 m2 is needed for three tiers of 2,000 m2 crop canopy with a 25%
access factor; real crop mix and maintenance may need more. This requires
repurposing inner storage decks in the full-size discs. It has not been fitted
into the compact-disc accommodation programme, so those savings are not combined.
Complete-diet yields, nutrient closure, disease control, crop renewal, startup
stock and reserve sufficiency all need calculation. Crop area alone does not
prove food independence. Active farming also needs continuous supervision while
crew are in the 7/21 roster.

## What a 500 t limit means

At the unchanged trajectory and exhaust assumptions, departure mass is about
3.07 times retained landing mass. A 500 t departure limit permits only about
163 t retained, including all hardware, people, stocks and unused reserve.
Bulk-packaged full-metabolism food alone is about 156 t, demonstrating why that
particular supply architecture cannot approach 500 t departure.

A 500 t hardware target is a different proposition from 500 t departure. It can
be investigated as an aggressive design target, but reducing the numerical
allowances does not validate the engine, storage, shielding or factory. No
physical minimum is established here. The sensible next design choice is between
compact accommodation with carried food and full-size accommodation using the
farm in cruise, followed by actual subsystem inventories and load calculations.

## Files and verification

`mass_optimisation.py` produces `mass-optimisation.json` without changing the
selected spacecraft geometry or reference ledger. Four tests verify reproduction
of the reference case, component balance, unchanged propulsion/margin assumptions,
compact area allocation and explicit nutrition/farming assumptions.
