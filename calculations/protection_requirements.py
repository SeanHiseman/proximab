"""S2 protection requirements and mass penalties, not radiation transport."""
import json
import math

from calculations.family_fleet_trade import ROOT
from calculations.staged_baseline import evaluate


def maximum_shelter_rate(days, budget_mSv, awake_fraction, awake_mSv_day):
    # A negative result means even a perfect shelter cannot close the budget.
    remaining = budget_mSv / days - awake_fraction * awake_mSv_day
    return remaining / (1 - awake_fraction)


def water_shell(volume_m3, thickness_m, count):
    radius = (3 * volume_m3 / (4 * math.pi)) ** (1 / 3)
    return count * 4 * math.pi / 3 * ((radius + thickness_m) ** 3 - radius ** 3)


def build_requirements():
    baseline = json.loads((ROOT / 'reports/integrated-specification-s2.json').read_text())
    spec = json.loads((ROOT / 'data/integrated_specification_s2.json').read_text())
    crew = baseline['crew']
    selected = crew['selected']
    days = baseline['radiation']['proper_exposure_years'] * 365.25
    budget = spec['dose']['transit_GCR_mSv']
    occupancy = []
    # 0.52 is an invented sensitivity case, NOT a magnetic-shield prediction.
    for awake_rate in [1.04, .52]:
        for fraction in [.25, .10, .05]:
            rate = maximum_shelter_rate(days, budget, fraction, awake_rate)
            occupancy.append(dict(awake_mSv_day=awake_rate, awake_fraction=fraction,
                awake_only_mSv=days*fraction*awake_rate,
                maximum_shelter_mSv_day=rate if rate >= 0 else None,
                possible_with_perfect_shelter=rate >= 0))
    mass_cases = []
    for extra in [0, 50, 100, 200, 500]:
        coefficients = dict(crew['coefficients'])
        coefficients['nonpropulsion_allocation_t'] += extra
        r = evaluate(selected['trajectory']['burn_years'],
            *[p['exhaust_c'] for p in selected['phases']], coefficients, 19.9)
        mass_cases.append(dict(extra_retained_orbital_mass_t=extra,
            crew_departure_t=r['departure_t'], crew_antimatter_t=r['loaded_antimatter_t'],
            fleet_antimatter_t=r['loaded_antimatter_t']+baseline['cargo']['selected']['loaded_antimatter_t'],
            fleet_primary_ZJ=r['primary_energy_loaded_fuel_ZJ']+baseline['cargo']['selected']['primary_energy_loaded_fuel_ZJ']))
    shells = [dict(volume_each_m3=v, count=n, thickness_m=t,
        water_mass_t=water_shell(v,t,n))
        for v,n in [(64,2),(750,1)] for t in [.2,.4,1.]]
    # Two 4 m clear cubes: wall thickness with all 44 t or only 36 t water.
    cube_thickness = {str(m): ((64+m/2)**(1/3)-4)/2 for m in [36,44]}
    return dict(baseline_revision=baseline['revision'], proper_days=days,
        target_mSv_day=budget/days, target_mSv_year=budget/days*365.25,
        reference_proxy_mSv_day=1.04, reference_proxy_transit_mSv=days*1.04,
        actual_transport_result_mSv=None,
        perfect_shelter_max_awake_fraction=budget/(days*1.04),
        occupancy_requirements=occupancy, ideal_spherical_water_shells=shells,
        two_4m_cube_water_thickness_m=cube_thickness,
        fixed_profile_mass_sensitivity=mass_cases,
        scope='Geometry and arithmetic requirements only; no dose assigned to water, magnets or torpor. Extra mass includes its margin, stays in orbit and adds no new service power; propulsion mass feedback included.')


if __name__ == '__main__':
    result = build_requirements()
    (ROOT / 'reports/protection-requirements.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result, indent=2))
