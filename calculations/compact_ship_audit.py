"""Mass trade study only; does not change the selected ship or qualify its design."""
import copy
import json
import math
from pathlib import Path

from calculations.engine_reuse_options import evaluate_reuse
from calculations.selected_mass_budget import build_selected

ROOT = Path(__file__).resolve().parent.parent


def build_audit():
    selected = build_selected()
    rows = [copy.deepcopy(r) for r in selected['components'] if r['kind'] != 'derived']
    baseline = evaluate_reuse(rows)
    groups = {
        'Habitat envelopes, floors, frames, bearings and fittings': ['membranes', 'floors', 'habframes', 'bearings', 'furnishings'],
        'Flight and settlement support frames': ['structure', 'flightstructure'],
        'Landing supports, restraints and transport covers': ['landing'],
        'Dust shield and crew radiation-shield allowance': ['dustshield', 'radiationshield'],
        'Cruise engine, touchdown engine and containment': ['cruiseengine', 'engine', 'bulkcontainment', 'containment'],
        'Rigid crew refuge and airlocks': ['refuge'],
        'Life support, medical and process tanks': ['eclss', 'medical', 'processtanks'],
        'Electrical conversion and service radiators': ['power', 'warmradiators'],
        'Avionics, navigation and communications': ['avionics'],
        'Settlement fabrication and resource-processing seed': ['factory'],
        'Food-factory hardware': ['foodfactory'],
        'Pressurised rover': ['rover'],
        'Spares, tools and suits': ['spares'],
        'Separation interfaces': ['separation'],
    }
    byid = {r['id']: r for r in rows}
    hardware_groups = {name: sum(byid[key]['mass_kg'] for key in ids) for name, ids in groups.items()}
    grouped_ids = [key for ids in groups.values() for key in ids]
    assert len(set(grouped_ids)) == len(grouped_ids)
    assert set(grouped_ids) == {r['id'] for r in rows if r['kind'] == 'hardware'}
    stock_rows = {r['id']: r['mass_kg'] for r in rows if r['kind'] != 'hardware'}
    tank = .12 * baseline['thermal_hydrogen_kg']
    hardware_groups['Calculated hot radiators and hydrogen tanks'] = baseline['engine_hot_radiator_kg'] + tank
    hardware = sum(hardware_groups.values())
    departure_ledger = dict(hardware_groups)
    departure_ledger.update({
        'Hardware development allowance (25%)': .25 * hardware,
        'People, stocks and scout payloads': sum(stock_rows.values()),
        'Propulsion matter and antimatter, including correction reserve': 2 * baseline['propulsion_antimatter_loaded_kg'],
        'Touchdown hydrogen': baseline['thermal_hydrogen_kg'],
    })
    assert abs(sum(departure_ledger.values()) - baseline['departure_mass_kg']) < 1e-6

    # Two continuous rounded pressure tori, one occupied deck per torus. Retain
    # the current outer radius; no shield reduction or smaller spin radius credit.
    major, minor, floor_radius = 17, 2.5, 18
    area = 2 * 4 * math.pi**2 * major * minor
    volume = 2 * 2 * math.pi**2 * major * minor**2
    floor = 2 * 2 * math.pi * floor_radius * 3
    geometry = dict(torus_count=2, major_radius_m=major, tube_radius_m=minor,
                    outer_radius_m=major+minor, floor_radius_m=floor_radius,
                    pressure_area_m2=area, pressure_volume_m3=volume,
                    gross_floor_area_m2=floor, assumed_net_floor_area_m2=.65*floor,
                    spin_rpm_at_half_g=math.sqrt(.5*9.80665/floor_radius)*60/(2*math.pi))
    programme = {
        '32 convertible torpor/sleep berths, equipment footprint': 80,
        'Four shared double cabins for the eight awake crew': 32,
        'Galley and dining': 24,
        'Lounge, library, learning, arts and telepresence': 32,
        'Exercise and rehabilitation': 24,
        'Medical, recovery and private consultation': 24,
        'Hygiene': 12,
        'Control and communications': 12,
        'Life support, water and electrical equipment': 40,
        'Clean workshop and science bench': 20,
        'Two airlocks and suit service': 20,
        'Accessible stores and food reserve': 24,
        'Circulation, berth access and transfer': 64,
    }
    assert sum(programme.values()) <= geometry['assumed_net_floor_area_m2']
    scenarios = []

    def record(name, changed):
        result = evaluate_reuse(changed)
        delta = {r['id']: byid[r['id']]['mass_kg'] - r['mass_kg']
                 for r in changed if r['id'] in byid and r['mass_kg'] != byid[r['id']]['mass_kg']}
        added = {r['id']: r['mass_kg'] for r in changed if r['id'] not in byid}
        scenarios.append(dict(name=name, result=result, component_reductions_kg=delta,
                              additional_components_kg=added,
                              departure_saving_kg=baseline['departure_mass_kg']-result['departure_mass_kg'],
                              landed_saving_kg=baseline['final_retained_mass_kg']-result['final_retained_mass_kg']))

    compact = copy.deepcopy(rows)
    d = {r['id']: r for r in compact}
    d['membranes']['mass_kg'] = area*6
    d['floors']['mass_kg'] = floor*10
    # Retain the factory atmosphere and the existing 2 t gas contingency.
    d['gas']['mass_kg'] -= (selected['geometry']['full_disc_gross_pressure_volume_m3']-volume)*70000/(287.05*293.15)
    compact.extend([
        dict(id='surface_expansion', kind='hardware', mass_kg=6000, surface_delivery=True),
        dict(id='rim_access', kind='hardware', mass_kg=2000, surface_delivery=True),
    ])
    record('A: rounded single-deck rims, surface kit and access allowance', compact)
    d['habframes']['mass_kg'] = 18000
    d['furnishings']['mass_kg'] = 6000
    record('B: A plus simpler frames and shared room fittings', compact)
    for key, target in [('factory', 20000), ('landing', 15000), ('rover', 4000), ('flightstructure', 16000)]:
        d[key]['mass_kg'] = target
    record('C: B plus aggressive machinery, landing, rover and frame targets', compact)

    marginal = {}
    for key in ['membranes', 'flightstructure', 'water']:
        trial = copy.deepcopy(rows)
        next(r for r in trial if r['id'] == key)['mass_kg'] -= 1000
        result = evaluate_reuse(trial)
        marginal[key] = dict(departure_saving_per_1000kg=baseline['departure_mass_kg']-result['departure_mass_kg'],
                             landed_saving_per_1000kg=baseline['final_retained_mass_kg']-result['final_retained_mass_kg'])
    return dict(status='Unselected planning sensitivities; no demonstrated minimum mass or crew safety claim.',
                baseline=baseline, departure_ledger_kg=departure_ledger, stock_rows_kg=stock_rows,
                current_geometry=selected['geometry'], proposed_geometry=geometry,
                proposed_area_programme_m2=programme, scenarios=scenarios,
                marginal_savings=marginal)


if __name__ == '__main__':
    audit = build_audit()
    (ROOT/'reports/compact-ship-audit.json').write_text(json.dumps(audit, indent=2)+'\n', encoding='utf-8')
    for scenario in audit['scenarios']:
        print(scenario['name'], {key: round(scenario['result'][key]/1000, 2)
              for key in ['departure_mass_kg', 'final_retained_mass_kg', 'propulsion_antimatter_loaded_kg']})
