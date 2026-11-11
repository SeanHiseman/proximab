# Shield stand-off, thickness and engine separation

The quantitative follow-up is in [SHIELDING_ASSESSMENT.md](SHIELDING_ASSESSMENT.md),
with reproducible calculations and explicit dose targets. The earlier notes below
are context rather than a protection specification.

These notes assess the current concept. They do not size a flight-qualified shield
or establish a safe crew distance. No shield geometry, mass saving or dose claim
has been inferred from the visual changes.

## Forward shield

A sacrificial bumper ahead of a rear absorber is worth studying. A gap lets an
impact cloud expand before it reaches the rear layer; moving the bumper forward
does not remove the incoming kinetic energy. LLNL investigated this approach
with radiation-hydrodynamic simulations of relativistic dust impacts:

https://ldrd-annual.llnl.gov/archives/ldrd-annual-2018/hed/erd/17-ERD-091

Impacts also produce bremsstrahlung photons, neutrons, nuclear fragments and
activation. Separation does not guarantee protection from those products. A
large illuminated shield is an extended, direction-dependent radiation source,
so its dose cannot simply be scaled by the inverse square of the stand-off.

https://arxiv.org/html/2201.02721v1

The model peaks at 0.2104439289 c. Using E=(gamma-1)*m*c^2, an incoming stationary
hydrogen proton has approximately 21.49 MeV in the ship frame. Stopping those
individual protons is only one shielding requirement: erosion, rare dust grains,
heat removal and accumulated secondary-particle dose must also be assessed.

The current layout's 50 kg/m2 areal-density sensitivity is 5 g/cm2. Purely as a
mass conversion, that is 5 cm of water or about 1.85 cm of aluminium. Neither is a
recommended shield thickness. The displayed plates are illustrative geometry.
Proton stopping-range data alone do not qualify a crew shield:

https://physics.nist.gov/PhysRefData/Star/Text/PSTAR.html

## Antimatter engine

The geometric engine centre is about 84.5 m behind the habitat centres and 40.3 m
behind the rover cabin centre. Those are layout dimensions, not safe separations.
Gamma radiation and other annihilation products require a source-specific
transport calculation; a magnetic nozzle does not steer neutral gamma photons.
NASA's antiproton-engine study illustrates the potential significance of shield
mass and heating, though its engine is different from this concept:

https://ntrs.nasa.gov/citations/19890018329

For scale, the current departure mass is 1,330,200 kg and acceleration is 1.2 g,
giving initial thrust approximately 15.65 MN. In the model's ideal effective
exhaust convention (0.5 c), the associated rest-mass-energy loss rate is
F*c/0.5, approximately 9.39 petawatts. This is a model-derived energy scale, not a
validated engine specification or a claim that all that energy becomes gamma rays.

An illustrative isotropic point source leaking one millionth of that power in
penetrating radiation would deliver approximately 74,700 W/m2 at 100 m before
attenuation. The leakage fraction and angular distribution are unknown; this is
an illustration of sensitivity, not a predicted flux or dose. At fixed source
and shielding, ten times the distance reduces point-source flux by a factor of
100, not to zero.

A defensible engine distance needs the photon/particle spectra and angular
distribution, reaction and exhaust source locations, burn duration, intervening
materials, scattering, activation, allowed crew dose and transport modelling.
The present compact layout therefore must not be described as radiation-safe.

NASA discusses the coupled separation, shielding and scattering trade for nuclear
propulsion here; numerical values cannot be transferred directly to antimatter:

https://ntrs.nasa.gov/api/citations/20180002056/downloads/20180002056.pdf
