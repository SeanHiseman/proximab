# Selected compact hardware target and fuel assumptions

The selected design uses two 20 m-radius inflatable discs with four occupied deck
radii of 18/14/10/6 m. It is the smallest area-budgeted option studied, not a
proven physical minimum. All 18 shared cabins and essential common, clinical,
work and service functions remain. The former 30 m-disc budget is retained in
MASS_REFERENCE_BUDGET.md and the comparison in MASS_OPTIMISATION.md.

## Selected planning masses

| Quantity | Tonnes |
|---|---:|
| Hardware before development allowance | 464.6 |
| Hardware allowance, 25% | 116.1 |
| Hardware including allowance | **580.7** |
| People and retained stocks/food/waste | 197.7 |
| Unburned direct propellant reserve | 88.0 |
| Retained after landing | **866.3** |
| Departure including all loaded propellant | **2,677.7** |

Hardware includes fuel-dependent hydrogen tanks and main-engine radiators.
Stored fuel and supplies are not called hardware. All food/waste is conservatively
retained, with oxygen/water regeneration assumed. There is no torpor nutrition
saving or mass credit from expelling waste. Propulsion reserves are retained after
landing and counted once.

The hardware targets include a 35 t combined direct/thermal engine and 40 t main
antimatter containment installation. Neither has a demonstrated design at this
capacity. These are optimistic targets, not a physical minimum or established
mass-capacity scaling law. The 42 t shield at 50 kg/m2 is also a protection target,
not a demonstrated relativistic dust/radiation shield.

## Exactly what the fuel calculation assumes

1. The interstellar transfer takes 15.9 years onboard, leaving 0.1 year for arrival
   within the 16-year onboard budget. The arrival allowance is not an integrated
   navigation, radiation, terrain and orbital solution.
2. Acceleration and interstellar braking use 1.2g proper acceleration, separated
   by coasting. Each burn lasts approximately 78.9 onboard days. Peak speed is
   0.26136c. The target distance remains 4.2465 light-years.
3. The direct engine annihilates equal rest masses of antimatter and ordinary
   matter. No added bulk hydrogen ballast is used in the direct interstellar mode.
4. Effective exhaust is optimistically 0.5c, defined as thrust divided by total
   rest-mass loss rate. It includes uncollimated radiation and particle losses.
   It is not the speed of selected charged pions and is not demonstrated engine
   performance. A 0.3c sensitivity is calculated with the same hardware targets.
5. There is an additional 12 km/s direct-propulsion allowance for arrival after
   interstellar braking. It is not a solved approach to the actual planet.
6. The short thermal touchdown phase uses 1.025 km/s delta-v at 1,800 s Isp,
   equivalent to 17.65 km/s effective exhaust. The budget includes assumed terminal
   gravity/control allowances but is not derived from a final flight trajectory.
   Direct braking transitions to thermal braking during descent; no hover is
   required by the model. Switch altitude and radiation transport remain open.
7. Heating hydrogen uses 50% of the annihilation energy as exhaust kinetic energy.
   The other energy and its disposal require an actual engine design.
8. Five percent of nominal direct fuel consumed is carried as unburned direct
   reserve. Half is antimatter and half ordinary matter. It is not added twice.
9. Antimatter storage losses and hydrogen boiloff are assumed zero. Cooling and
   containment have mass allowances, but no system demonstrates this performance.
   The 5% direct reserve is not a solved long-term storage-loss model.
10. Departure begins with the assembled vehicle in space at the ideal transfer
    boundary. Earth launch, assembly propellant, fuel production energy and launch
    infrastructure are outside this spacecraft mass calculation.

## Fuel quantities for the selected target

| Fuel quantity | Amount |
|---|---:|
| Direct antimatter consumed | 879.783 t |
| Matching ordinary matter consumed in direct mode | 879.783 t |
| Unused antimatter reserve at landing | 43.989 t |
| Matching unused ordinary-matter reserve | 43.989 t |
| Antimatter for hydrogen heating | 0.0898 g |
| Loaded propulsion antimatter, including reserve and heater | **923.773 t** |
| Loaded matching ordinary propulsion matter | **923.773 t** |
| Hydrogen for touchdown | **51.795 t** |
| Transit electrical supply / separate | 14.0 g antimatter + equal matter |
| Surface electrical bank / separate | 1 kg antimatter + 1 kg matter |

The two hydrogen tanks provide approximately 54.4 t usable capacity, including
5% spare capacity over the nominal load and 5% ullage. Extra capacity is not
silently counted as extra loaded hydrogen.

The large direct-fuel requirement comes from transferring momentum while
accelerating and braking the spacecraft and its remaining fuel. A small surface
energy reserve does not imply a similarly small relativistic rocket fuel load.

## Equations and feedback

Let eta be each interstellar burn's rapidity, f the effective exhaust fraction
of c, ve = Isp*g0, and M the final retained mass.

```text
RH = exp(1025 / ve)
RD = exp(2*eta/f + 12000/(f*c))
Mdeparture = RD * RH * M
AM_per_H2 = ve^2 / (4 * heater_efficiency * c^2)
H2 = (RH-1)*M / (1 + 2*AM_per_H2)
burned_direct = (RD-1)*RH*M
unburned_direct_reserve = 0.05*burned_direct
loaded_propulsion_AM = (burned_direct + unburned_direct_reserve)/2 + heater_AM
```

Hydrogen tanks are assigned 12% of the hydrogen load. Hot radiators use 5 kg per
emitting m2, emissivity 0.9 and 1,500 K. Only 1e-7 of initial annihilation power is
assumed to heat the ship: 1,889 MW still needs rejection from an approximately
18.9 PW initial source. Initial thrust is approximately 31.5 MN.

The calculation solves fuel-dependent tanks, hot radiators, 25% hardware allowance
and retained direct-fuel reserve together. Radiator and tank mass are not omitted
from the mass that itself needs fuel. Selected emitting areas are approximately
7,313 m2 hot and 4,698 m2 service/surface, with separate loops. The viewer's bank
geometry matches these ideal areas. Cold-space views, terrain/mutual heating,
coolant, materials and radiation tolerance remain unvalidated.

## Exhaust sensitivity

| Whole-engine effective exhaust | Departure | Loaded propulsion antimatter |
|---|---:|---:|
| 0.5c selected optimistic target | 2,678 t | 924 t |
| 0.3c sensitivity | 8,329 t | 3,638 t |

The 0.3c case resizes fuel-dependent tanks, radiators, margin and retained reserve.
It is not just the same dry mass with a larger fuel tank. Neither case validates
an actual engine, antimatter bank or achievable heat interception.

## What is manufactured after landing

Carry a 2 MWe starter, not the entire eventual 10 MWe surface plant. Critical life
support, containment and batch fabrication take priority. Expansion of power and
cooling must precede full farm and industrial loads; a detailed bootstrap schedule
must prove this within the stored commissioning-food allowance. The 1 kg power
bank supplies energy, not a demonstrated generator rating.

Bulk food uses 0.617 kg dry food plus a target 0.10 kg packaging per person per day
for all 36 people over 16.5 years, approximately 155.6 t. No lower torpor metabolism
is credited. Long shelf life, closed-loop chemistry, medical supplies and crop
commissioning still require qualification. The carried farm is packed in cruise;
using it in flight was a different, larger-habitat alternative.

## Sources and reproduction

[NASA life-support baseline](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf)
provides context for food rates. The lower packaging, structural areal masses,
engine, containment, factory and farm masses are planning targets.
[NASA antimatter-system concepts](https://ntrs.nasa.gov/citations/19820013176)
identify separate storage, feed and engine design problems; they do not validate
this spacecraft. [CERN antimatter overview](https://home.cern/science/physics/antimatter/)
describes trapping and energy-use difficulties. Charged-pion nozzle simulations
such as [Keane and Zhang](https://arxiv.org/abs/1205.2281) are not whole-engine
mass-loss/exhaust guarantees.

```powershell
python -m calculations.selected_mass_budget
python -m unittest discover -s tests
python mission-viewer/sync_data.py
python mission-viewer/pack_standalone.py
```

`selected_mass_budget.py` writes the selected ledger and mass-budget.json.
`mass_budget.py` now reproduces only the frozen historical reference, using
mass_reference_inputs.json, and writes mass-reference-budget.json. It does not
overwrite the selected design.
