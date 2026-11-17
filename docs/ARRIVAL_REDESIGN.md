# S5: adopted arrival disposition and recalculated fuel

Authoritative component inputs for this change: `data/arrival_redesign.json`.
Results: `reports/arrival-redesign.json`. Reproduce with
`python -m calculations.arrival_redesign`. S3 inputs and its numerical results
remain the unchanged component reference; the mission architecture selects S5.

## Implemented changes

- Split the two service fission-electric units into two 15 t nominal allocations.
  Both operate/remain available in transit; one 16.5 t unit (with allowance) stays
  in orbit, and the other remains on the landing habitat.
- Keep all 44 t water during transit. Land 8 t working water and retain 36 t transit
  protection water in orbit. Inventory disposition is now explicit in the ledger.
- Cargo must confirm usable water, power and protected surface accommodation
  before crew descent. Eight tonnes is an adopted planning allocation, not a
  validated minimum for life support.
- Keep zero unused main-propulsion fuel, eight tank drops per main burn, the 20 t
  fleet AM cap, 10% hardware allowance and the existing chemical landing reserve.
- No unengineered 10 t structural reduction was credited. Reactor isolation and
  water separation remain within existing service/transfer allocations pending
  sizing; no new unsupported negative mass term was introduced.

## Landing result

| Quantity | Before | After |
|---|---:|---:|
| Crew entry package | 364.331 t | 295.009 t |
| Crew touchdown package | 290.458 t | 235.192 t |
| Chemical propellant loaded | 81.260 t | 65.799 t |
| Chemical tanks | 7.151 t | 5.790 t |

New chemical loading is 56.399 t oxygen and 9.400 t hydrogen. Nominal burn is
59.817 t, leaving 5.982 t chemical reserve. Main-propulsion reserve is zero; the
unchanged landing reserve is a separate allocation. Landed dry hardware totals
198.290 t; inventories 30.920 t; touchdown includes the chemical reserve.

Moving 52.5 t from the lander to the orbital assembly does NOT remove it from
interstellar flight. The actual reduction in mass carried through the main burns
is just the avoided chemical fuel and chemical tanks: **16.822 t**. The fixed
nonpropulsion core therefore falls from 519.742 to 502.920 t.

## Like-for-like fixed-allocation fuel comparison

Apply the same 16.822 t saving to the earlier assumed 500 t retained ship. With
483.178 t retained, 20 t AM, no unused main fuel, eight tank drops per burn and the
same 20-year trajectory, the recomputed crew ship has:

- Fusion fuel **15,906.967 t**, down from 17,017.531 t (6.53%).
- AM **20 t**, plus **20 t matching ordinary matter**.
- Departure **16,618.101 t**, down from 17,757.704 t.
- Exhaust .082198c acceleration / .354905c braking.
- Main engine/hot-radiator sizing consumes about 135.0 t INSIDE this allocation.

The separate fusion-only 40-year cargo remains 4,093.599 t fusion, zero AM and
4,406.660 t departure. The fixed-allocation fleet comparison is therefore
**20,000.566 t fusion, 20 t AM, 20 t ordinary annihilation reactant and 21,024.761 t
departure**. These numbers are transfer estimates, not a completed component budget.

## Full component closure: unresolved cap

The actual S5 nonpropulsion ledger is 502.920 t BEFORE adding main engines and hot
radiators. It cannot be substituted for a 483.178 t allocation that already includes
those systems. We now also solve the coupled mass balance:

`retained_mass = nonpropulsion_core + engine(peak_power) + radiator(peak_power)`.

All tank masses and drop hardware are then included in the backward segment rocket
equations. Each peak-power branch is solved separately to account for either burn
setting the engine size. No arbitrary subtraction makes the engine fit in 500 t.

At 1.25-year burns there is no 20 t candidate in the searched mixtures. Broadening
burn duration and refining the minimum-AM candidate gives approximately:

- **20.885 t crew AM**, already above the fleet cap (cargo uses zero).
- **56,234 t crew fusion fuel** and **57,696 t crew departure mass**.
- **787.921 t retained mass**: 502.920 t nonpropulsion + 211.263 t engine +
  73.738 t hot radiators.
- Each main burn 2.075 years; peak ship speed .23747c; exhaust .079165c/.208165c.

This is the sampled minimum-AM result, not the minimum-energy result or a selected
replacement for the 20 t budget. Search covers .5-5-year initial burn samples and
phase exhaust grids, followed by local refinement. It does not prove every possible
staging, geometry or propulsion history fails. The 20 t requirement remains open.

## Qualification and display

80% supplementary-annihilation coupling is still hypothetical. Protection, service
lifetime, water adequacy, cargo commissioning and entry performance remain
unverified. Planned capture/approach fuel must be incorporated in a final trajectory;
the current transfer estimates do not quietly draw from a nonexistent main reserve.

The viewer reports the adopted landing disposition and distinguishes the
fixed-allocation result from the component-closed cap failure. Its 3D hardware
geometry remains an explicitly labeled reference; reactor/water separation hardware
has not been dimensioned. Tests check conservation of moved hardware/inventory,
chemical mass balance, main-engine/radiator closure and no false 20 t compliance.
