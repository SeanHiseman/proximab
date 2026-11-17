# Fully onboard propulsion: energy comparison

Reproduce: `python -m calculations.onboard_energy_trade`.
Machine-readable results: `reports/onboard-energy-trade.json`.
This study does not change the selected vehicle or viewer.

## Accounting boundary

Compare 20-year, 4.24 ly flights at minimum cruise speed 0.212 c, with 300 t retained
after braking. Acceleration and braking are included as instantaneous burns; no
hardware, reserve, finite-thrust or manufacturing-infrastructure mass closure exists.

Primary energy = nuclear energy released aboard + electricity used to manufacture
antimatter + fusion-fuel processing energy. Do not add annihilation energy again:
it was purchased through the antimatter-production term. Electrical ignition is
powered aboard by recirculating fusion output and is not added a second time.
Prelaunch industrial energy excludes naturally stored nuclear energy released aboard.
Construction, maintenance and isotope production/acquisition are not quantified.
The zero processing-cost input is an unpriced term, not a claim that fuel is free.

## Explicit speculative assumptions

- Fusion energy release q = 0.00392 of fully burned fuel rest mass, representing D–He3
  energetics, not a demonstrated complete-burn propulsion pellet.
- Fusion jet energy coupling 80%; supplementary annihilation coupling 50%.
- Electrical ignition: target fusion gain 1,000 relative to driver output, driver
  efficiency 20%, onboard electricity generation 40%. This diverts 1.25% of fusion
  output before jet coupling in this conservative allocation; ignition input is
  not separately credited to directed exhaust.
- Antimatter ignition: fusion gain 1,000 relative to total ignition annihilation
  energy. This is a different gain definition from electrical target gain. Assigning
  both 1,000 is a sensitivity example, not evidence of equal ignition performance.
- Antimatter manufacturing efficiency 1%, defined as subsequent annihilation energy
  divided by production electricity. This is hypothetical, not present capability.
- Illustrative compact hybrid uses 0.20 c massive exhaust; it is compared with a
  continuous supplementary-antimatter sweep, not declared energy-optimal.

Per kg fusion fuel, a kg ordinary-plus-antimatter reactants supplies a*c² energy.
Residual massive exhaust is (1−q) kg. Its gamma is 1 + directed_energy/[(1−q)c²].
Effective exhaust fraction is (1−q)*sqrt(gamma²−1)/(1+a). Mass ratio is
exp[2*atanh(0.212)/effective_exhaust]. Lost mass is fusion fuel plus a times fuel;
half the latter is antimatter. Waste energy is isotropic in the ship frame.

## Results before fuel processing and construction

| Design | Fusion fuel t | AM t | Departure t | Fusion energy J | AM production J | Combined primary energy J |
|---|---:|---:|---:|---:|---:|---:|
| Electrical ignition | 72,069 | 0 | 72,369 | 2.539e22 | 0 | 2.539e22 |
| Antimatter ignition only | 69,018 | 0.1353 | 69,318 | 2.432e22 | 2.432e21 | 2.675e22 |
| Energy-supplemented hybrid, exhaust 0.20 c | 2,304 | 40.09 | 2,684 | 8.116e20 | 7.207e23 | 7.215e23 |

Electrical ignition wins this conditional comparison. Ignition-only AM is only
5.3% worse; that is not a robust ranking given uncertain gain, coupling and hardware.
The compact hybrid uses about 28.4 times as much combined primary energy.

At fixed fuel/ignition assumptions, ignition-only AM becomes lower in combined
primary energy than electrical ignition above about 2.26% AM production efficiency.
It still requires external antimatter manufacture, while electrical ignition draws
its operating power from onboard nuclear fuel. Compare both accounting boundaries.

Over the scanned a range (ignition minimum through an additional 0.1 kg annihilation
reactants per kg fusion fuel), the best hybrid at AM production efficiencies 0.1%,
1% and 10% uses no supplementary antimatter: it collapses to ignition-only fusion.
At ideal 100% manufacturing efficiency, the best sampled hybrid has exhaust about
0.241 c, 40.63 t AM and combined energy 7.83e21 J. Thus a unique winner independent
of manufacturing efficiency cannot be claimed. The scan is not an optimization over
variable exhaust, staging, hardware or all physically possible propulsion systems.

Fusion-fuel processing cost can favor smaller ships. At 1% AM production efficiency,
the fixed 0.20 c compact hybrid would overtake electrical ignition only if their
common fuel-processing intensity exceeded roughly 9.98e15 J/kg, ignoring construction.
This is a break-even calculation, not an estimate of isotope acquisition cost.
About 60% of a stoichiometric D–He3 mixture is helium-3 by mass, making acquisition
of tens of thousands of tonnes a central unresolved requirement. Substituting D–T
or D–D requires changing energy release, neutron losses, ignition and storage models.

## Interpretation

Recommend electrically ignited fusion as the reference for minimizing primary
energy; retain AM ignition as a close competitor contingent on demonstrated ignition
advantage. A large additional antimatter energy supply is poorly matched to the
energy objective unless production efficiency becomes exceptionally high or it
substantially reduces unmodeled industrial and hardware costs.

This does not establish a feasible colony mission. A 72,000 t fuel load with even
1% tank mass already exceeds the entire assumed 300 t retained vehicle. Staging,
engine/radiator mass and finite burns require a new integrated solution. Health and
reproduction requirements remain unchanged. No minimum total industrial investment
can be established before those systems and isotope acquisition are priced in energy.

Sources for concepts (table values are project calculations):
- NASA antimatter energy-cost assessment: https://ntrs.nasa.gov/api/citations/19990110316/downloads/19990110316.pdf
- Fusion energetics/propulsion: https://www.icarusinterstellar.org/papers/optimisation.pdf
- NASA fusion concept: https://www.nasa.gov/general/radioisotope-positron-propulsion/
