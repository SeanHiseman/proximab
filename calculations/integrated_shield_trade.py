"""Planning-only useful-mass shielding trade; no dose/safety validation.

Maintain a specified material column through nominal braking. Additional water
is charged as carried mass, even when described as a useful resource.
"""
import copy
import json
import math

from calculations.family_fleet_trade import ROOT, SCENARIOS, evaluate, ledger, optimise, trajectory

OPTIONS = {
    'existing_envelope_20': dict(area=1800, column=200, diameter=20, compact=False),
    'existing_envelope_10': dict(area=1800, column=100, diameter=20, compact=False),
    'compact_20': dict(area=1280, column=200, diameter=14, compact=True),
    'compact_10': dict(area=1280, column=100, diameter=14, compact=True),
    'compact_5': dict(area=1280, column=50, diameter=14, compact=True),
    'compact_20_hydrogen': dict(area=1280, column=200, diameter=14, compact=True,hydrogen=True),
}


def hydrogen_shell(mass_t):
    """Uniform liquid-H2 shells around two equal-height/diameter cylinders.

    These enclose 1600 and 800 m3 respectively, plus a 0.2 m warm-water/
    insulation interface around each cylinder. Full endcaps are included.
    Density 70.8 kg/m3; radial column, not mass/inner area, receives credit.
    """
    radii = [(v/(2*math.pi))**(1/3)+.2 for v in [1600,800]]
    lo,hi = 0.,10.
    for _ in range(60):
        t = (lo+hi)/2
        volume = sum(math.pi*((r+t)**2*(2*r+2*t)-2*r**3) for r in radii)
        if volume*70.8/1000 < mass_t:
            lo = t
        else:
            hi = t
    thickness = (lo+hi)/2
    area = sum(6*math.pi*(r+thickness)**2 for r in radii)
    return dict(thickness_m=thickness,column_kg_m2=thickness*70.8,outer_area_m2=area)


def integrated_base(years, option):
    base = ledger('crew',years,shield_multiplier=0.)
    # Existing 60 t envelope allocation: 40 t area-dependent and 20 t floors/
    # fittings. Retain 2400 m3, all beds, life support, furnishings and allowance.
    shell_saving = 40*(1-option['area']/1800) if option['compact'] else 0.
    forward_saving = math.pi*(10**2-(option['diameter']/2)**2)*.1
    # Distributed cells, local liners, plumbing and supports are extra to main
    # tank allocation. Fixed 3 t balances/control provision is also extra.
    distribution = .006*option['area']+3
    # 40 t water stays with the surface refuge; this replaces the old 40 t
    # separate shelter material, and is counted as mass, not a free credit.
    surface_water = 40.
    surface_tanks = .05*surface_water
    cryogenic = 0.
    # Solve outer-area-based insulation/distribution hardware and the landing
    # fuel needed to land that hardware together. Existing landing tanks remain.
    if option.get('hydrogen'):
        for _ in range(40):
            land_delta = 1.25*(distribution+surface_tanks+cryogenic-shell_saving)+surface_water
            factor = base['landing_hydrogen_t']/base['landed_without_unused_reserves_t']
            h = base['landing_hydrogen_t']+factor*land_delta/(1-.08*factor)
            cryogenic = .005*hydrogen_shell(h)['outer_area_m2']+8
    dry_change = 1.25*(distribution+surface_tanks+cryogenic-shell_saving-forward_saving)
    # Shell saving lands; distribution hardware remains with the landed habitat.
    land_change = 1.25*(distribution+surface_tanks+cryogenic-shell_saving)+surface_water
    landing_factor = base['landing_hydrogen_t']/base['landed_without_unused_reserves_t']
    hydrogen_change = landing_factor*land_change/(1-.08*landing_factor)
    tank_change = .08*hydrogen_change
    am_change = base['landing_am_t']*hydrogen_change/base['landing_hydrogen_t']
    shell = hydrogen_shell(base['landing_hydrogen_t']+hydrogen_change) if option.get('hydrogen') else None
    if shell:
        # 0.2 m radial provision for vacuum insulation/interfaces outside LH2.
        expanded_diameter = option['diameter']+2*(shell['thickness_m']+.4)
        extra_forward = .1*math.pi*((expanded_diameter/2)**2-(option['diameter']/2)**2)
        dry_change += 1.25*extra_forward
        shell['expanded_forward_diameter_m'] = expanded_diameter
        shell['extra_forward_shield_t'] = extra_forward
    base['fixed_dry_t'] += dry_change
    base['supplies_t'] += surface_water
    base['landing_hydrogen_t'] += hydrogen_change
    base['landing_tanks_t'] += tank_change
    base['landing_am_t'] += am_change
    base['auxiliary_am_t'] += am_change
    base['landed_without_unused_reserves_t'] += land_change+tank_change
    base['base_arrival_t'] += dry_change+surface_water+hydrogen_change+tank_change+2*am_change
    base['changes'] = dict(envelope_saving_t=shell_saving,forward_shield_saving_t=forward_saving,
                           additional_distribution_t=distribution,cryogenic_hardware_t=cryogenic,
                           retained_surface_water_t=surface_water,hydrogen_shell=shell)
    # Original rows are not an updated bill of materials; expose changes instead.
    base.pop('hardware_rows')
    return base


def integrated_case(base, traj, speed, scenario, option, reserve_credit=1.):
    initial = evaluate(base,traj,speed,scenario)
    if initial is None:
        return None
    target = option['area']*option['column']/1000
    # Only 4 t of the already-budgeted 8 t process water receives location credit.
    process_water = 4.
    retained_water = base['changes']['retained_surface_water_t']
    shell = base['changes']['hydrogen_shell']
    hydrogen_credit = shell['column_kg_m2']*option['area']/1000 if shell else 0.
    fixed_credit = process_water+retained_water+hydrogen_credit
    reserve_per_arrival = initial['reaction_loaded_t']/21/initial['arrival_before_staging_t']
    denominator = 1-initial['feedback_fraction']
    # Additional retained water has its own tank mass; it is not burn fuel.
    water_mass_factor = 1+1.25*scenario['tank_fraction']
    water = max(0.,(target-fixed_credit-reserve_credit*reserve_per_arrival*
                    initial['arrival_before_staging_t'])/
                   (1+reserve_credit*reserve_per_arrival*water_mass_factor/denominator))
    adjusted = copy.copy(base)
    added_tank = 1.25*scenario['tank_fraction']*water
    adjusted['base_arrival_t'] += water+added_tank
    adjusted['fixed_dry_t'] += added_tank
    item = evaluate(adjusted,traj,speed,scenario)
    reserve = item['reaction_loaded_t']/21
    spent_reaction = item['reaction_loaded_t']/1.05
    fraction = spent_reaction/((item['mass_ratio']-1)*item['arrival_before_staging_t'])
    rapidity = math.atanh(item['beta'])
    profile = []
    # Progress in proper braking time/rapidity, not coordinate time.
    for i in range(11):
        remaining = rapidity*(1-i/10)
        burn_fuel = fraction*item['arrival_before_staging_t']*math.expm1(remaining/item['effective_exhaust_c'])
        available = water+fixed_credit+reserve_credit*reserve+burn_fuel
        profile.append(dict(braking_fraction=i/10,available_water_t=available,
                            coverage_g_cm2=available*100/option['area']))
    item.update(extra_retained_water_t=water,extra_water_tanks_with_allowance_t=added_tank,
                shielding_target_t=target,process_water_credit_t=process_water,
                retained_surface_water_t=retained_water,hydrogen_column_mass_credit_t=hydrogen_credit,
                nominal_reserve_water_t=reserve,reserve_credit=reserve_credit,
                end_braking_column_g_cm2=(water+fixed_credit+reserve_credit*reserve)*100/option['area'],
                end_column_after_using_all_main_reserve_g_cm2=(water+fixed_credit)*100/option['area'],
                braking_profile=profile,base=adjusted)
    return item


def optimise_integrated(years, scenario, option, reserve_credit=1., objective='total_am_loaded_t',grid=70):
    base = integrated_base(years,option)
    best = None
    def search(blo,bhi,ulo,uhi,n):
        nonlocal best
        for i in range(n+1):
            traj = trajectory(years,blo+(bhi-blo)*i/n)
            for j in range(n+1):
                item = integrated_case(base,traj,ulo+(uhi-ulo)*j/n,scenario,option,reserve_credit)
                if item and (best is None or item[objective] < best[objective]):
                    best = item
    search(.1,.49*years,.025,.95,grid)
    if best:
        for step in [.015,.003]:
            search(max(.1,best['burn_years']-years*step),min(.49*years,best['burn_years']+years*step),
                   max(.025,best['exhaust_c']-2*step),min(.95,best['exhaust_c']+2*step),25)
    return best


def build_study():
    cases = {}
    for name,scenario in SCENARIOS.items():
        if name == 'stress':
            continue
        cargo = optimise(ledger('cargo',60),scenario)
        options = {}
        for label,option in OPTIONS.items():
            crew = optimise_integrated(40,scenario,option)
            options[label] = dict(assumptions=option,crew=crew,
                fleet_am_t=crew['total_am_loaded_t']+cargo['total_am_loaded_t'] if crew else None,
                fleet_departure_t=crew['departure_t']+cargo['departure_t'] if crew else None)
        cases[name] = dict(cargo=cargo,options=options)
    reference = SCENARIOS['reference']
    robust = optimise_integrated(40,reference,OPTIONS['compact_20_hydrogen'],reserve_credit=0.)
    lightest = optimise_integrated(40,reference,OPTIONS['compact_20_hydrogen'],objective='departure_t')
    durations = {}
    for years in [40,30,20]:
        durations[str(years)] = {}
        for name in ['reference','optimistic']:
            scenario = SCENARIOS[name]
            crew = optimise_integrated(years,scenario,OPTIONS['compact_20_hydrogen'])
            cargo = optimise(ledger('cargo',years+20),scenario)
            durations[str(years)][name] = dict(crew=crew,cargo=cargo,
                fleet_am_t=crew['total_am_loaded_t']+cargo['total_am_loaded_t'] if crew and cargo else None,
                fleet_departure_t=crew['departure_t']+cargo['departure_t'] if crew and cargo else None)
    return dict(status='Material column accounting, not validated radiation dose protection',
                scenarios=cases,hydrogen_20_no_reserve_credit=robust,
                hydrogen_20_minimum_departure_mass=lightest,durations=durations)


if __name__ == '__main__':
    result = build_study()
    (ROOT/'reports'/'integrated-shield-trade.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    for name,data in result['scenarios'].items():
        for label,item in data['options'].items():
            crew = item['crew']
            print(name,label,'fleet AM',round(item['fleet_am_t'],2),'fleet wet',round(item['fleet_departure_t']),
                  'crew dry',round(crew['dry_t']),'extra water',round(crew['extra_retained_water_t']))
