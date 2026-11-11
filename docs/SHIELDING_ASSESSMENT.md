# Quantitative crew-protection assessment

Research checked 10 November 2026. Calculations use the current viewer design.

**Finding:** numerical exposure requirements can be specified now. The research
does not establish a safe exact shield thickness or engine separation for this
engine. The present compact ship has not closed its radiation or shield-cooling
budget. The figures below are reproducible screening results, not a replacement
for particle transport or a declaration of crew safety.

Reproduce with `python -m calculations.shielding_assessment`; numerical output is in
[shielding-assessment.json](../reports/shielding-assessment.json). Eight tests in
`test_shielding_assessment.py` verify mass evolution, an independent numerical
burn integral, attenuation arithmetic, unit conversions and geometric scaling.
They do not validate the physical shielding assumptions.

## 1. Definite requirements versus proposed allocations

Use NASA's published standards as reference constraints, rather than inventing
a new exposure threshold:

| Reference constraint | Value |
| --- | ---: |
| Career effective dose, all spaceflight sources | Less than 600 mSv |
| Onboard nuclear technologies | Less than 20 mSv per mission year |
| Design-reference solar particle event | Less than 250 mSv effective dose |
| Recommended long-duration SPE shelter guideline | 20 g/cm2 water-equivalent surrounding the crew |

Source: [NASA, section 4.8](https://www.nasa.gov/reference/4-0-human-performance/),
requirements V1 4030-4032 and table 4.8-4. The shelter guideline is for SPEs,
not a guarantee against GCR, relativistic impacts or an antimatter engine.

For 20 years, 600 mSv corresponds to an all-source average below **30 mSv/year**,
or **0.0821 mSv/day**, assuming no earlier exposure. Meeting a daily GCR criterion
in isolation does not establish compliance with this career constraint.
This assessment covers the 20-year transfer allocation, not an additional
20-year surface residence. A 40-year career would instead average below
15 mSv/year; future settlement exposure must share the same career budget.

One explicit **proposed allocation**, not a NASA allocation or proven achievable
performance, is:

| Contribution | Whole-mission effective-dose budget |
| --- | ---: |
| Propulsion | 10 mSv |
| Onboard power | 10 mSv |
| Interstellar-impact secondaries | 100 mSv |
| GCR | 300 mSv |
| Stellar/solar particle events | 50 mSv |
| Unspent reserve, including any prior exposure | 130 mSv |

Routine and event allocations total 470 mSv. The reserve is not permission to
exceed organ limits or spend uncertainty margins. The GCR allocation alone would
require an average below **0.0411 mSv/day**. No analysis here demonstrates that
level. Twenty years makes background radiation a major independent problem.
Any later surface residence needs an explicit share of the remaining budget;
it does not receive a fresh 600 mSv allowance.

## 2. Engine source calculated from this mission

| Input/result | Current value |
| --- | ---: |
| Departure mass | 1,330,200 kg |
| Proper acceleration | 1.2 Earth g |
| Effective exhaust parameter | 0.5 c |
| Initial thrust | 15.65 MN |
| Initial annihilation power under the ideal mass-loss convention | 9.386 PW |
| Each main burn, proper time | 62.991 days |
| Main-burn mass consumed, both burns | 764,230 kg |
| Assumed prompt gamma energy fraction | 710/1880 = 37.77% |
| Initial prompt gamma power | 3.545 PW |
| Integrated prompt gamma energy, both main burns | 2.594 x 10^22 J |

The gamma fraction is drawn from the annihilation-energy partition in
[LaPointe, NASA, Antimatter Propulsion, slide 12](https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf).
It is a source assumption for proton-antiproton annihilation, not a measured
emission distribution for this particular nozzle.

For constant proper acceleration, mass evolves as
`M(tau) = M_start * exp(-a*tau/(beta_effective*c))`.
Integrating source power over both burns gives
`E_gamma = f_gamma * (M_departure - M_after_braking) * c^2`.
This accounts for falling vehicle mass instead of holding peak power constant.
Capture/descent burns, continuously operating power sources and shielding-mass
feedback are excluded from this main-burn result and need separate treatment.

## 3. What the engine separation numbers actually imply

For a stationary, isotropic point source and fixed separation `r`, the integrated
energy fluence is `E_gamma/(4*pi*r^2)`. Actual exhaust and secondary radiation are
not all point sources; the real angular distribution and annihilation-zone size
must be supplied.

To expose the required scale, consider two deliberately hypothetical spectra:
put the entire prompt gamma energy into either 10 MeV photons or 4 MeV photons.
These are **spectral sensitivity cases**, not the actual annihilation spectrum.
The latter case samples the relatively penetrating MeV region that can occur in
a cascade. Using [NIST tungsten](https://physics.nist.gov/PhysRefData/XrayMassCoef/ElemTab/z74.html)
and [water](https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/water.html) tables:

| Photon case | Tungsten total mu/rho | Water mu_en/rho |
| --- | ---: | ---: |
| 4 MeV | 0.04038 cm2/g | 0.02066 cm2/g |
| 10 MeV | 0.04747 cm2/g | 0.01566 cm2/g |

Assume tungsten density 19.3 g/cm3 and reduce the **uncollided-primary water
collision-kerma proxy** to 0.010 Gy. This diagnostic value has the same numerical
scale as the proposed propulsion allocation, but **Gy in water is not NASA
effective dose in Sv**. Charged-particle equilibrium, body geometry and radiation
quality are not established. The calculation is:

`K_water = energy_fluence * (mu_en/rho)_water`

`t_W = ln(K_water / 0.010 Gy) / [(mu/rho)_W * rho_W]`.

| Crew-source distance | 10 MeV primary-only W thickness | 4 MeV primary-only W thickness |
| --- | ---: | ---: |
| 40.3 m: current rover-centre separation | 43.5 cm | 51.5 cm |
| 84.5 m: current habitat-centre separation | 41.9 cm | 49.6 cm |
| 100 m | 41.5 cm | 49.1 cm |
| 1 km | 36.5 cm | 43.2 cm |
| 10 km | 31.4 cm | 37.3 cm |
| 100 km | 26.4 cm | 31.4 cm |

These are neither a safe range nor upper/lower bounds on the actual required
shield. They omit scattering buildup, neutron production, muons, leakage through
openings, shielding fragmentation, heat and actual dosimetry. For illustration,
a multiplicative buildup factor of 1,000 would add **7.54 cm** in the 10 MeV case
or **8.86 cm** in the 4 MeV case; that factor has not been calculated or validated.

Under these same proxy assumptions, distance alone would need roughly
**18-21 million km** to reach the chosen proxy budget. That is not a recommended
safe separation; it demonstrates that moving the engine a few hundred metres
does not eliminate the shield problem. A single answer such as "100 m is safe"
or "50 cm tungsten is sufficient" is unsupported.

The 2 MWe onboard power assumption is also a radiation source. At 40% electrical
conversion it implies 5 MW of annihilation power. Over 20 years, the same
10 MeV primary-only proxy at 10 m gives **28.1 cm of tungsten**, before transport
and thermal analysis. This is not a proposed reactor shield specification.

## 4. Shield size and heat can dominate the design

A shield close to a compact source can cast a shadow over a much larger crew
volume. The current wheels are wide, however, and must fit entirely inside that
shadow. With a point source at x=84.5 m, nominal wheel radius 19.5 m and the
conservative axial envelope z=1-15 m, a rectangular shadow gives:

| Source-to-shield spacing | Shield height x width | Mass if 50 cm W |
| --- | ---: | ---: |
| 5 m | 2.37 x 1.08 m | 24.6 t |
| 10 m | 4.74 x 2.15 m | 98.6 t |
| 50 m | 23.72 x 10.77 m | 2,465 t |

This is ideal geometric shadowing, with no margin for motion, finite source,
supports or penetrations. A hypothetical **1 m source radius** increases the
5 m-spacing shield to about **4.25 x 2.92 m and 120 t**. Real longitudinal source
extent is another missing input. The JSON contains these size sensitivities;
finite-source rows use a central-point illumination approximation, not a full
extended-source radiation integral.

For the ideal point case, the rectangular shield subtends about **0.7865% of
4*pi**, intercepting **27.9 TW** of initial prompt gamma power. Moving this
geometrically scaled shield along the cone does not change its solid angle.
Not all intercepted energy necessarily becomes heat: transport must establish
the deposited fraction and where escaping radiation goes.

If all intercepted energy were deposited, ideal radiating area at emissivity
0.9 would be **108 km2 at 1500 K**, or **14.0 km2 at 2500 K**. Those are emitting
areas, not panel footprints or feasible radiator designs. Even **1% deposition
is 279 GW**. The model's present engine absorption allowance, `10^-7` of initial
annihilation power, is only **0.939 GW**. To fit that allowance, this shadow shield
could deposit no more than **0.0034%** of intercepted energy, before accounting
for other engine heating. No mechanism achieving that is specified.

**Engineering finding:** the current small heat-rejection allowance cannot be
used as evidence that a crew-protecting shadow shield fits the compact design.
The thermal and shielding budgets must be solved together. Adding shield mass
also increases departure mass and required engine power, so these frozen-baseline
estimates need iteration after any design is selected.

Holding baseline power fixed and moving the engine farther aft is different from
moving a shield along an unchanged cone: it reduces the crew's angular footprint.
An ideal point-source calculation gives the following **thermal-only** distances
if the entire existing 0.939 GW engine heat allowance is given to the crew shadow
shield, the shield plane stays 5 m from the point source, and the crew envelope
is unchanged:

| Fraction of intercepted gamma energy deposited | Habitat-centre-to-source distance |
| --- | ---: |
| 100% | 12.82 km |
| 10% | 4.06 km |
| 1% | 1.29 km |

These are conditional heat-budget constraints, **not safe crew distances**. The
deposition fractions are sensitivity parameters, not measured properties. A real
finite source changes the shadow size and can invalidate this favourable
near-source geometry; other engine components also require cooling. More
radiator capacity changes these numbers. Photon/particle dose constraints still
have to be met independently.

## 5. Forward shield: gas, dust and stand-off

At 0.21044 c, a stationary interstellar proton arrives with **21.49 MeV** kinetic
energy. A nominal total H density of 0.2 cm^-3 gives approximately **44.4 W/m2**
of hydrogen-only kinetic-power deposition if fully stopped: **27.6 kW** on the
620 m2 frontal rectangle. This density is a study assumption, not a route map.
Helium, dust and radiation from other sources are excluded from this estimate.
Gas stopping, local impact damage and crew-dose protection are separate tasks.

[Hoang et al.](https://arxiv.org/pdf/1608.05284) model erosion and melting around
0.2 c and discuss a line-of-sight H column of order 3x10^17-10^18 cm^-2. Their
small-probe results cannot be treated as a crew shield specification or a bound
on large-grain impacts. The present nominal density implies about 8.04x10^17
cm^-2 over 4.2465 light years.

For scale, at this speed a spherical grain of density 3,000 kg/m3 carries:

| Grain radius | Kinetic energy |
| --- | ---: |
| 1 micrometre | 25.9 J |
| 10 micrometres | 25.9 kJ |
| 100 micrometres | 25.9 MJ |
| 1 mm | 25.9 GJ |

A maximum design grain and a credible distribution are needed. For example,
requiring 99.9% probability of no **unmitigated** catastrophic-grain encounter
over 620 m2 and 4.2465 ly would require that hazardous population to be below
about **4.0x10^-23 m^-3** under a uniform Poisson model. This is an illustrative
reliability target, not a measured grain population or a selected mission risk.

[LLNL simulations](https://ldrd-annual.llnl.gov/archives/ldrd-annual-2018/hed/erd/17-ERD-091)
motivate investigating a sacrificial bumper and rear absorber. No retrieved
study establishes an optimum stand-off for this crewed vehicle. A useful
**simulation grid**, not a recommended flight dimension, is 10, 30 and 100 m.

| Gap | Cloud radius at assumed 1 degree half-angle | At assumed 10 degrees |
| --- | ---: | ---: |
| 10 m | 0.175 m | 1.76 m |
| 30 m | 0.524 m | 5.29 m |
| 100 m | 1.75 m | 17.63 m |

The cloud angles are unmeasured inputs. Neither this geometry nor a long boom
establishes how many secondary photons or neutrons reach the crew. The current
5 g/cm2 front-shield mass target therefore remains unqualified.

## 6. A useful firm starting thickness: an SPE shelter

For the **SPE shelter guideline only**, 20 g/cm2 equals 200 kg/m2, or 20 cm of
water. Applying that gross layer to the compact refuge's approximate 93.3 m2
outer surface gives a thin-layer lower mass estimate of **18.7 t**. Applying it
over both nominal wheel envelopes gives approximately **1,176 t**. Finite layer
growth, supports and openings increase these simple estimates; existing useful
water or stores could offset dedicated mass if their shielding coverage persists.

This does not resolve 20 years of GCR exposure. NASA's
[thick-shield transport comparison](https://ntrs.nasa.gov/api/citations/20170005580/downloads/20170005580.pdf)
finds important material and secondary-particle effects, including a local
minimum for aluminium in its studied geometry. More metal is not a universal
improvement. Hydrogen-rich materials warrant study, but no GCR thickness is
certified here.

## 7. What is needed before selecting safe dimensions

The next result must come from a coupled source/transport/thermal calculation,
not another inverse-square estimate. The numerical cases above specify a
reproducible starting envelope for that work.

1. Fix the annihilation region's dimensions, energy/angle spectra of photons,
   pions, muons and other products, and magnet/exhaust interaction geometry.
2. Include all crew positions and routes, all burn phases, onboard power,
   finite shield extent, hatches, windows, supports, scatter and activation.
3. Transport electromagnetic and hadronic showers, neutrons and muons, using
   checked data/models. For example, Geant4's
   [Shielding reference physics list](https://geant4.web.cern.ch/documentation/pipelines/master/plg_html/PhysicsListGuide/reference_PL/Shielding.html)
   includes high-precision low-energy neutron modelling; an actual calculation
   also needs appropriate EM settings, data sets and validation.
4. Score energy deposition in shields/coolant, organ doses and effective dose
   in anatomical phantoms, with statistical and model uncertainties. Attenuation
   factors near 10^16 require validated variance reduction or another suitable
   deep-shielding technique; brute-force zero-hit runs are not proof of safety.
5. Calculate GCR/SPE and interstellar-impact exposures independently, then add
   the dose contributions without double spending the allocations.
6. Verify dust protection during **braking orientation**, not just outbound
   cruise. Turning the ship reverses which hardware faces the interstellar flow;
   the forward bumper cannot simply be assumed to protect both orientations.
   [Semyonov, section 4](https://arxiv.org/pdf/2004.10079) discusses this issue.
7. Iterate mass, thrust, source power, shielding and heat rejection until they
   close. Require the resulting dose estimates plus uncertainty to stay below
   the allocated effective and organ-dose constraints for every occupied space.

No Geant4/FLUKA/HZETRN transport run was performed here. No transport executable
was found on the current environment's PATH, and the necessary
engine source specification and route-tail dust distribution are not supplied.
The assessment therefore rejects claims of an already established safe
thickness/distance; it does not replace the unanswered parts with arbitrary
"definite" dimensions.
