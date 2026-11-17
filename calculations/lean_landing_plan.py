"""Conditional S6 mass plan; reuse S5 propulsion closure and keep cargo unchanged."""
import json
from functools import partial
from pathlib import Path

from calculations.arrival_redesign import closed
from calculations.depleted_staged_tanks import optimise, MIN_SPEED
from calculations.integrated_specification import ledger

ROOT = Path(__file__).resolve().parents[1]


def build_plan():
    spec = json.loads((ROOT / 'data/lean_landing_plan.json').read_text())
    crew_book = ledger('crew', spec, spec['landing']['crew_terminal_delta_v_m_s'])
    cargo_book = ledger('cargo', spec)
    candidates = []
    for burn in [1.25, 1.5, 1.75, 2, 2.075, 2.25, 2.5]:
        r = optimise(20, core_t=crew_book['nonpropulsion_core_t'],
                     evaluator=partial(closed, burn_years=burn))
        if r:
            candidates.append(r)
    crew = min(candidates, key=lambda r: r['primary_ZJ'])
    cargo = closed(MIN_SPEED, MIN_SPEED, core_t=cargo_book['nonpropulsion_core_t'],
                   burn_years=.75, transfer_years=39.9, electrical_fusion=True)
    ships = {}
    for kind, book, ship in [('crew', crew_book, crew), ('cargo', cargo_book, cargo)]:
        fixed = book['fixed_dry_with_margin_t']
        dry = fixed + ship['engine_with_allowance_t'] + ship['hot_radiator_with_allowance_t']
        ships[kind] = dict(ledger=book, propulsion=ship,
            retained_dry_hardware_t=dry,
            departure_dry_hardware_t=dry + ship['tank_and_separation_t'],
            landed_dry_hardware_t=sum(r[1] for r in book['hardware_rows'] if r[2])*1.1
                + book['landing']['tank_with_margin_t'])
    return dict(revision=spec['revision'], ships=ships,
        fleet={k: crew[k]+cargo[k] for k in ['fusion_t', 'antimatter_t',
            'ordinary_annihilation_matter_t', 'departure_t', 'primary_ZJ']},
        search=[{k:r[k] for k in ['trajectory','fusion_t','antimatter_t','primary_ZJ']}
                for r in candidates],
        selection='Lowest primary energy among feasible sampled burn durations at 20 t AM cap; not a global optimum',
        qualifications=dict(radiation_verified=False, landing_verified=False,
            shielding_layout_hardware_sized=False, arrival_capture_fuel_included=False,
            annihilation_coupling=.8, hardware_allowance=.1, main_reserve=0,
            landing_contingency_fraction_of_burn=.1))


if __name__ == '__main__':
    report = build_plan()
    (ROOT / 'reports/lean-landing-plan.json').write_text(json.dumps(report, indent=2)+'\n')
    for kind, ship in report['ships'].items():
        print(kind, {k:v for k,v in ship.items() if k not in ['ledger','propulsion']})
        print({k:ship['propulsion'][k] for k in ['fusion_t','antimatter_t','departure_t',
            'retained_core_t','tank_and_separation_t','engine_with_allowance_t',
            'hot_radiator_with_allowance_t','trajectory','exhaust_c']})
    print('fleet', report['fleet'])
