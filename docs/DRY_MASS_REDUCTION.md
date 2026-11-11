# Aggressive dry-mass reduction and shielding trade

Superseded for the current planning target by [MISSION_300_TRADE.md](MISSION_300_TRADE.md):
eight awake during departure/coast/arrival braking, 32 awake for descent;
15% planning allowance and an itemised food/avionics/relay calculation. This file
preserves the earlier 400 t comparison.

Research checked 10 November 2026. Metric tonnes throughout. This is an
unselected engineering trade, not an implemented viewer change or a qualified
mass/safety specification. Reproduce with `python -m calculations.dry_mass_trade`; itemised
outputs are `dry-mass-trade.json` and `dry-mass-trade.csv`.

## Boundary and result

Dry hardware includes structures, installed equipment, empty propulsion tanks,
shielding, radiators, payload hardware and a separate 25% development allowance.
Water, gases, food, process inventories, general consumables and people are
reported separately. Scout hardware is included in dry mass, retaining its
existing fixed payload allocation without a separate 25% allowance. All fuel is excluded, including electrical-power
fuel. No propellant saving or tank/radiator resizing is claimed. Existing
engine/tank/hot-radiator allocations are held to isolate the dry-mass trade.

| Quantity | Current | Aggressive target |
| --- | ---: | ---: |
| Hardware before development allowance | 409.782 t | 319.847 t |
| Scout hardware (fixed payload allocation) | 0.450 t | 0.450 t |
| Development allowance | 102.445 t | 79.962 t |
| Dry hardware including allowance | 512.677 t | 400.258 t |
| Supplies | 41.367 t | 15.020 t |
| Crew and personal effects | 2.880 t | 2.880 t |
| Total excluding every fuel | 556.925 t | 418.158 t |

Dry saving: **112.419 t / 21.93%**. Total non-fuel saving: **138.766 t / 24.92%**.
The target includes 40 t total polyethylene shielding provision, replacing the
old 11.165 t allowance rather than adding it twice. Engine/power shielding may
require additional mass not established in either baseline or target.

## A much smaller accommodation architecture

Replace complete pressure rings with two independently isolatable rounded
capsule pods on opposite ends of one balanced rotor. Maintain the outside radius
of 19.5 m: pod centres at 16.3 m, pod radius 3.2 m. Capsule cylindrical sections
are 18 m long, total length including hemispherical ends 24.4 m. The long axes
run parallel to the spin axis; they do not require enclosing a full circular disc.
This greatly reduces pressure area/volume, but the 24.4 m axial dimension is
larger than the current wheel stack. It is a dry-mass trade, not a demonstrated
minimum overall ship length.

The screen uses 252 m² gross floor, with 201.6 m² assumed available after a 20%
geometric/service deduction. Two deck strips per capsule are assumed 3 m and
4 m wide, at approximate spin radii 15.8 and 18.3 m. At the existing 0.5g/17.5 m
reference, spin is about 5.05 rpm and deck gravity about 0.45-0.52g. Long-duration
human adaptation, especially after torpor, remains unqualified. Floor curvature,
headroom, pressure barriers, access and local gravity direction need a real plan.
The more efficient 80% utilisation is a new layout target; the previous ring
study used a more conservative 65%. It is not an already demonstrated fit.

Each pod has 16 convertible medical/sleep berths: normally 12 torpid, four awake.
Use two-tier berth racks and privacy screens; delete dedicated private cabins.
Retain separate pressure isolation, hygiene, local controls, emergency services
and access to medical treatment. A common bearing failure can stop gravity in
both pods; it must not depressurise both. Spin booms and pressurised transfer
tunnels are explicitly added to the ledger, not assumed massless.

| Shipwide programme | m² |
| --- | ---: |
| 32 berths in two-tier racks | 40 |
| Galley, dining and flexible common rooms | 24 |
| Exercise and rehabilitation | 12 |
| Medical/recovery working space | 12 |
| Hygiene | 8 |
| Control, communications, clean work bench | 8 |
| Life-support/electrical bays | 22 |
| Two airlocks and suit service | 12 |
| Accessible stores | 12 |
| Circulation/berth transfer | 28 |
| Total | 178 |

The remaining 23.6 m² is fit tolerance, not permission to obstruct equipment or
doorways. This programme needs medical-transfer and emergency-egress verification;
stacked medical berths may need more clearance and hardware than assumed.

All 32 people still wake for the two approximately 63-day burns under the current
mission policy. They use convertible berths, stagger meals/exercise and endure
cramped conditions. Do not quietly assume burns have only eight awake people.
During coast, eight awake people include off-duty/sleeping people; eight is not
a continuously available watch team. No metabolic discount is assumed.

Carry a 4 t, approximately 60-80 m² initial surface-expansion kit target including
shells, floors, connectors and deployment equipment. This is a smaller starter
than the previous 6 t proposal, not a full settlement. Further space relies on
verified local fabrication. Gas and thermal/life-support capacity remain real
requirements. The 15 t industrial seed target must demonstrate that capability.

## Materials to use, and where

| Application | Candidate | Design implication |
| --- | --- | --- |
| Rounded pressure pods/tunnels | Vectran or aramid restraint; redundant compatible gas bladders; MLI and local debris layers | Tensile pressure restraint instead of a full rigid disc; seams, creep, fire and long-life permeability need qualification |
| Floors and ordinary-temperature booms/frames | Carbon-fibre sandwich panels/tubes with local metal inserts | Put material in load paths; metal remains around joints, hinges, impact and concentrated loads |
| Rigid refuge, airlocks and service vessels | Aluminium-lithium or lined CFRP where appropriate; titanium locally | Select by pressure, leakage, thermal cycle, oxygen compatibility, fatigue and repair requirements, not density alone |
| Noncritical liners, stowage and shield blocks | HDPE/UHMWPE | Useful hydrogen-rich shielding and furnishings; creep, temperature and fire behaviour limit structural use |
| Hot radiators/engine-adjacent thermal members | Carbon-carbon/graphite systems with compatible working-fluid liners | Ordinary epoxy CFRP is not a 1,500 K material; heat-pipe/fluid/coating life still determines mass |
| Pressure tanks | Lined composite vessels where qualified | Smaller water inventory reduces tank volume; composite cryotank research is not a universal percentage saving for every tank |

Sources:
[NASA/contractor inflatable-material investigation](https://ntrs.nasa.gov/api/citations/20200003125/downloads/20200003125.pdf),
[NASA polyolefin-composite research](https://ntrs.nasa.gov/api/citations/20170004521/downloads/20170004521.pdf),
[NASA carbon-carbon radiator research](https://ntrs.nasa.gov/citations/19990041155),
[NASA composite cryotank demonstration](https://www.nasa.gov/centers-and-facilities/marshall/move-over-heavy-metal-theres-a-new-tank-coming-to-town/).

The major envelope reduction is geometric: surface area falls from 5,881 to
981 m² while retaining the existing aggressive 6 kg/m² envelope coefficient.
It is not a second material-strength percentage applied on top of an already
lightweight fabric design. Floors target 8 kg/m² instead of 10; qualification is
outstanding. No speculative graphene, active magnetic shield or perfect
self-repair saving is booked.

## Water with 100% recovery

Accept 100% eventual recovery as the user's design assumption. Eliminate annual
loss makeup. Target 3,000 kg total working water:

- 800 kg potable/hygiene inventory;
- 800 kg food-process inventory;
- 600 kg medical inventory;
- 800 kg recovery plant and thermal working inventory.

These are allocations to verify against equipment hold-up, sterilisation and
maintenance needs, not calculated process minima. Full recycling eliminates
loss accumulation; it does not eliminate fluid inside active processes or make
recovery instantaneous. Inventory is counted once even when used as shielding.
An additional 1 t food-loop inventory is a separate mixed nutrient/process stock,
not another claim to 1 t of pure shielding water.

Reducing 16.333 t to 3 t saves **13.333 t** directly. A 2 t water alternative saves
another tonne of supplies, but cannot be selected until the food/medical/thermal
loops demonstrate that hold-up. Removing shielding water can also require
replacement polymer, negating part of the saving.

## Cosmic rays, solar storms and existing supplies

There is **no defensible single established thickness for 20 years of GCR
protection** in this design. GCR are continuous, energetic and arrive from all
directions. Solar particle events are a different protection problem. An engine
shadow shield and a forward dust bumper cannot be credited as all-around GCR
protection.

NASA's [human-performance standard](https://www.nasa.gov/reference/4-0-human-performance/)
recommends 20 g/cm² water-equivalent surrounding crew for long-duration SPE
shielding. That means 200 kg/m², or 20 cm water. It is not a 20-year GCR safety
specification. The same standard limits career spaceflight effective dose to
600 mSv: with no prior exposure, 20 years allows at most 30 mSv/year averaged
over **all** sources, and surface years consume further lifetime budget.

NASA's [thick-GCR study](https://ntrs.nasa.gov/api/citations/20170005580/downloads/20170005580.pdf)
shows why material choice and secondary radiation matter. Polyethylene performs
better than aluminium in its studied configurations; adding more aluminium did
not produce a universally monotonic benefit. No model from that paper proves
this ship meets the lifetime dose requirement.

Protect compact berth groups rather than entire pods as the first geometry
trade. Screen two 16-person shelters, each internal 4 x 4.8 x 2.6 m. Together
they have 168.32 m² inner surface. These rectangular shielding boxes are
arithmetic envelopes *inside rounded pressure pods*, not angular exterior hulls.

| Water-equivalent column | Thin area estimate | Complete water shell including corners |
| --- | ---: | ---: |
| 20 g/cm² / 20 cm water | 33.7 t | 37.4 t |
| 40 g/cm² / 40 cm water | 67.3 t | 82.9 t |
| 100 g/cm² / 1 m water | 168.3 t | 275.5 t |

Only the first column's 20 g/cm² relates to the cited SPE guideline. The 40/100
cases are mass sensitivities, not recommendations or GCR acceptance levels.
Thicker cases may require larger pressure pods or loss of usable room area.
Mass is computed from external minus internal box volume, not just an infinitesimal
layer, so edge/corner growth is included. Real doors, overlapped panels, supports,
ducts and exact ray paths still require design.

Shielding whole pods at 20 g/cm² instead would require **196 t** even in the thin
surface-area approximation. This is why reducing crew-occupied volume matters.

### What can be reused

- Put clean water and wastewater in separate, distributed closed wall cells;
  route recovery back into them. Total water stays 3 t. Its maximum contribution
  is only **15 m² at 20 cm thickness**, and process drawdown reduces coverage.
- Position the 1 t edible reserve and selected hydrogen-rich consumables in
  shielding racks. Determine their actual composition and depleted-state
  coverage; they are not automatically equivalent to pure water.
- Use polymer lockers/berth panels as useful shield material where possible.
  The 40 t shielding row includes the bulk shielding polymer. Furniture weight
  already counted elsewhere cannot be added again as a mass saving or coverage
  credit without a parts-level allocation.
- Reposition reserve parts around vulnerable directions where radiation
  transport supports it. Do not count heavy metal machinery as equally effective
  per kilogram, or put active hot/noisy equipment against medical berths.
- Waste can be processed into stable shielding material, but no growing net
  inventory is assumed under recycling. Material needed as food/process feedstock
  cannot simultaneously remain permanently immobilised in a shield.
- Do not rely on propulsion fuel: excluded from this trade, depleted during
  flight, and inappropriate for an assured minimum shielding inventory.

NASA has [analysed water/logistics shelters](https://ntrs.nasa.gov/api/citations/20140000593/downloads/20140000593.pdf)
and [developed trash compaction for recovery and shielding](https://www.nasa.gov/ames/space-biosciences/what-is-nasas-heat-melt-compactor/).
Those support multifunctional use, not a guarantee that all existing supplies
can be converted into adequate shielding.

The **40 t total polyethylene provision**, plus useful water/stores, is a
conservative allowance relative to the simple 20 cm shelter-volume screen.
It is not a validated spectrum/material equivalent or a certified GCR design.
At typical solid-polyethylene density, equal areal mass requires somewhat more
physical thickness than water. Panel layout, openings, support mass and dose
must be checked. No percentage dose reduction is invented here.

Torpor occupants still receive radiation and need protection. If each person
spends 75% of time in the sheltered torpor bay and 25% in lighter spaces, average
dose rate is `0.75*D_shelter + 0.25*D_light`. Even perfect shelter protection
would leave a quarter of the lightly shielded exposure. Do not treat only eight
awake people as eight people requiring cosmic-ray protection.

No new particle-transport simulation was run. Long-term GCR and engine/power
shielding remain unclosed and may increase this mass substantially. See the
existing [crew-protection assessment](SHIELDING_ASSESSMENT.md).

## Other cuts and their consequences

The numerical ledger makes the following aggressive equipment assumptions:

- Habitat frames 24→8 t, bearings 12→6 t, fittings 10.67→3 t: fewer pressure
  structures and cabins, one balanced rotor; add 4 t booms and 2 t tunnels.
- Flight frame 20→12 t and retained frame 10→8 t: fewer unloaded bays and
  common attachments. Required engine radiation standoff remains unresolved.
- Landing systems 20→10 t and rigid refuge 9.45→6 t: smaller packed payload,
  stacked seating and integrated restraints. Crash, evacuation and load sizing
  may invalidate these targets.
- Life support 14→10 t: compact redundant racks, not reduced metabolic capacity.
  Medical 13→11 t assumes 200 kg/berth plus common equipment; repeated torpor,
  two-tier transfer and sterilisation have not been engineered.
- Fabrication seed 30→15 t: basic resource extraction, repair and materials
  processing. A complete autonomous manufacturing economy is not demonstrated.
- Rover 6→3.5 t: two seats, shorter endurance, modular tools. A utility rover
  alternative might save another 1-2 t at the cost of suit dependence and range.
- Avionics 4→2.5 t, spares 15→10 t, specialist consumables 12→8 t: modular
  equipment and reduced inventories; requires parts, reliability and shelf-life
  accounting. Water recovery does not imply perfect recycling of medicines,
  filters, seals or catalysts.
- Process tanks 5→2 t and gas 11.014→2 t: smaller working inventories and
  pressure volumes; distributed shielding water cells are included in tank mass.
- Hold 2 MWe conversion, service radiators, 10 t food factory, 25 t cruise
  engine, 38 t bulk containment, 12 t touchdown hardware, 31 t dust shield,
  hot radiators, hydrogen tank hardware and scouts at their current allocations.

Further architectural alternatives, not included in the total:

1. Combine the two berth shelters into one 8 x 4.8 x 2.6 m shelter: complete
   20 cm water shell falls from 37.44 to 31.20 t, a 6.24 t geometric saving.
   This sacrifices independent protected bays and changes pod/evacuation layout.
2. Land an occupied rigid transit pod instead of a separate refuge: potentially
   delete part of the 6 t refuge, but pod rigidity, landing loads, packaging and
   independent survival systems add mass elsewhere. Do not book the full saving.
3. Manufacture more surface expansion locally: potentially reduce the 4 t
   starter kit, but only after proving the 15 t factory can bootstrap it and
   adequate resources exist. Planetary resources are currently assumptions.
4. Reduce electrical demand and raise suitable radiator-loop temperatures:
   potentially reduce nearly 30 t of radiator hardware, but only after resolving
   actual loads, compatible materials, conversion efficiency and engine heat.
5. Drop either crew capacity, artificial gravity or mission capabilities: these
   change requirements, rather than improving material efficiency. Not booked.

The bare hardware subtotal is not a minimum viable ship. Engine/containment
physics, shielding and autonomous manufacturing are not closed technologies.
The purpose is an explicit target ledger showing where further work can
confirm savings or force mass back in.

## Complete itemised ledger

Every row from the current non-fuel ledger appears once; new booms, tunnels and
surface kit are explicit. Figures below are generated from the calculation.

| Item | Current t | Target t |
| --- | ---: | ---: |
| Habitat pressure membranes, insulation and restraint | 35.286 | 5.887 |
| Folding composite floors | 15.268 | 2.016 |
| Habitat deployment frames, hatches and cabin partitions | 24.000 | 8.000 |
| Hubs, bearings, spin motors and balance equipment | 12.000 | 6.000 |
| Cabins, wardrooms, lounge, hygiene and exercise fittings | 10.667 | 3.000 |
| Settlement delivery frame and surface services | 10.000 | 8.000 |
| Landing supports, restraints and habitat transport covers | 20.000 | 10.000 |
| Forward dust/gas shield stack and supports | 31.000 | 31.000 |
| Total modular polyethylene berth/shelter shielding provision | 11.165 | 40.000 |
| Hydrogen-heated touchdown assembly | 10.000 | 10.000 |
| Touchdown antimatter isolation hardware | 2.000 | 2.000 |
| Rigid 32-person descent refuge and airlocks | 9.452 | 6.000 |
| Redundant life support and water/waste processing | 14.000 | 10.000 |
| 32 torpor beds, medical systems and embryo storage | 13.000 | 11.000 |
| 2 MWe conversion, distribution and backup allowance | 6.000 | 6.000 |
| Service/surface radiators and heat-recovery loops | 11.744 | 11.744 |
| Avionics, navigation, communications and sensors | 4.000 | 2.500 |
| Advanced fabrication, chemistry and resource-processing seed | 30.000 | 15.000 |
| Reused pressurised rover module, chassis and7-day stores | 6.000 | 3.500 |
| Repair stock, tools, EVA suits and replacement units | 15.000 | 10.000 |
| Initial habitat atmosphere and gas makeup | 11.014 | 2.000 |
| Water/oxygen-cycle buffers and process starting inventory | 16.333 | 3.000 |
| One tonne spare edible food plus packaging | 1.020 | 1.020 |
| Medical, hygiene, nutrient and general consumables | 12.000 | 8.000 |
| Atmosphere, water and process tank hardware | 5.000 | 2.000 |
| 32 crew and personal effects | 2.880 | 2.880 |
| Two surface micro-rovers | 0.030 | 0.030 |
| Redundant microbial/chemical full-diet food factory and small garden | 10.000 | 10.000 |
| Food-loop startup and circulating material inventory | 1.000 | 1.000 |
| Cruise engine standoff and support frame | 20.000 | 12.000 |
| Interstellar magnetic nozzle and cruise engine | 25.000 | 25.000 |
| Bulk cruise antimatter containment and cryogenics | 38.000 | 38.000 |
| Space scouts, microlanders and their support allocations | 0.420 | 0.420 |
| Separation interfaces and independent service isolation | 2.000 | 2.000 |
| Direct-engine hot radiators | 18.164 | 18.164 |
| Touchdown hydrogen tank hardware | 1.035 | 1.035 |
| Spin booms and pod balance attachments | 0.000 | 4.000 |
| Pressurised transfer tunnels and flexible interfaces | 0.000 | 2.000 |
| Packed surface expansion starter | 0.000 | 4.000 |
| Hardware development allowance (25%) | 102.445 | 79.962 |

Verification: 12 tests pass across this trade, the earlier compactness study and engine-reuse accounting. They check ledger closure, baseline agreement, shielding shell volume, water counted once, envelope screens and absence of selected-design changes. They do not certify structural, medical or radiation performance.
