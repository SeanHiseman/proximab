"""Integrated conditional fleet specification, explicitly not health-qualified."""
import json
import math
from calculations.family_fleet_trade import ROOT, C
from calculations.mission_calculations import G
from calculations.staged_baseline import ASSUMPTIONS, optimise, evaluate


def load_spec():
    return json.loads((ROOT/'data/integrated_specification.json').read_text())


def landing(base_t,delta_v,config,margin=.25):
    # Reserve remains aboard at touchdown, with tanks sized to all loaded fuel.
    reserve=config['reserve_fraction_of_burned']
    tank=config['tank_mass_fraction_of_loaded']*(1+margin)
    growth=math.expm1(delta_v/(config['specific_impulse_s']*G))
    denominator=1-growth*(reserve+tank*(1+reserve))
    if denominator<=0:return None
    burned=growth*base_t/denominator
    loaded=(1+reserve)*burned
    tank_mass=tank*loaded
    return dict(base_t=base_t,burned_t=burned,loaded_t=loaded,tank_with_margin_t=tank_mass,
        touchdown_t=base_t+tank_mass+reserve*burned,entry_t=base_t+tank_mass+loaded,
        oxygen_t=loaded*6/7,hydrogen_t=loaded/7,delta_v_m_s=delta_v)


def ledger(kind,spec,delta_v=None):
    rows=spec[f'{kind}_hardware']
    margin=spec['hardware_allowance']
    dry=sum(r[1] for r in rows)*(1+margin)
    landed_dry=sum(r[1] for r in rows if r[2])*(1+margin)
    inventory=sum(r[1] for r in spec[f'{kind}_inventories'])
    landed_inventory=sum(r[1] for r in spec[f'{kind}_inventories'] if len(r)<3 or r[2])
    terminal=landing(landed_dry+landed_inventory,delta_v or spec['landing']['terminal_delta_v_m_s'],spec['landing'],margin)
    if terminal is None:return None
    core=dry+inventory+terminal['loaded_t']+terminal['tank_with_margin_t']
    return dict(hardware_rows=rows,inventory_rows=spec[f'{kind}_inventories'],
        fixed_dry_with_margin_t=dry+terminal['tank_with_margin_t'],
        fixed_inventory_t=inventory,nonpropulsion_core_t=core,landing=terminal)


def solve_ship(kind,spec):
    book=ledger(kind,spec)
    shadow=spec['source_shadow']
    intercepted=(shadow['escaping_isotropic_source_fraction']*shadow['radius_m']**2/
        (4*shadow['distance_from_source_m']**2)*shadow['intercepted_energy_deposited_fraction'])
    sc=dict(ASSUMPTIONS,nonpropulsion_allocation_t=book['nonpropulsion_core_t'],
        hardware_margin=spec['hardware_allowance'],reserve_fraction=spec['main_fuel_reserve_fraction'],
        absorbed_power_fraction=ASSUMPTIONS['absorbed_power_fraction']+intercepted)
    duration=19.9 if kind=='crew' else 39.9
    best=optimise(sc,duration)
    burn=round(best['trajectory']['burn_years']*4)/4
    speeds=[round(p['exhaust_c'],2) for p in best['phases']]
    selected=evaluate(burn,*speeds,sc,duration)
    retained=optimise(sc,duration,False)
    h=selected['hardware']
    # S1 mixed dry and inventories; here inventories are explicitly separated.
    actual_dry=selected['dry_hardware_and_nonpropulsion_allocation_t']-book['fixed_inventory_t']-book['landing']['loaded_t']
    after=selected['arrival_t']
    w=selected['phases'][1]['effective_exhaust_c']
    capture=after*(-math.expm1(-math.atanh(spec['landing']['capture_and_approach_delta_v_m_s']/C)/w))
    reserve_brake=sc['reserve_fraction']*selected['phases'][1]['spent_t']
    thrust=3*spec['landing'][f'{kind}_thrust_MN_each']*1e6
    net=thrust/(book['landing']['entry_t']*1000)-spec['landing']['planet_gravity_screen_m_s2']
    handover=spec['landing']['powered_handover_speed_m_s']
    checks=dict(capture_propellant_from_braking_reserve_t=capture,
        braking_reserve_t=reserve_brake,capture_fits_reserve=capture<=reserve_brake,
        one_engine_out_initial_net_acceleration_m_s2=net,
        one_engine_out_stop_distance_m=handover**2/(2*net) if net>0 else None,
        constant_mass_propulsive_delta_v_for_stop=handover*(1+spec['landing']['planet_gravity_screen_m_s2']/net) if net>0 else None)
    vacuum=ledger(kind,spec,spec['landing']['vacuum_comparison_delta_v_m_s'])
    return dict(ledger=book,coefficients=sc,selected=selected,dry_departure_t=actual_dry,
        extra_source_heat_fraction=intercepted,sampled_optimum=best,retained_storage_comparator=retained,
        rounding_energy_penalty_fraction=selected['primary_energy_loaded_fuel_ZJ']/best['primary_energy_loaded_fuel_ZJ']-1,
        arrival_checks=checks,vacuum_core_comparison=vacuum,
        surface_delivery_of_orbital_engine_and_storage_not_included=True)


def build_specification():
    spec=load_spec()
    crew,cargo=[solve_ship(k,spec) for k in ['crew','cargo']]
    years=crew['selected']['trajectory']['proper_years']+.1
    days=years*365.25
    dose=dict(proper_exposure_years=years,
        required_average_GCR_mSv_day=spec['dose']['transit_GCR_mSv']/days,
        adult_reference_at_20g_polyethylene_proxy_Sv=days*1.04/1000,
        proxy_to_target_ratio=days*1.04/spec['dose']['transit_GCR_mSv'],
        actual_interstellar_dose_Sv=None,health_requirement_verified=False)
    fleet={k:crew['selected'][k]+cargo['selected'][k] for k in [
        'departure_t','loaded_fusion_t','loaded_antimatter_t','primary_energy_loaded_fuel_ZJ',
        'manufacture_loaded_antimatter_ZJ']}
    fleet['dry_departure_t']=crew['dry_departure_t']+cargo['dry_departure_t']
    fleet['antimatter_factory_average_TW_over_20_years']=fleet['manufacture_loaded_antimatter_ZJ']*1e21/(20*365.25*86400)/1e12
    return dict(revision=spec['revision'],status=spec['status'],crew=crew,cargo=cargo,fleet=fleet,
        radiation=dose,feasible_health_constrained_optimum=None,
        acceptance=dict(mass_and_rocket_accounting='checked',engine_and_thermal_coefficients='assumed',
            radiation='unverified; proxy exceeds allocation',landing='conditional atmosphere and trajectory',
            structural_and_reliability='unqualified',fuel_manufacturing_and_storage='hypothetical'))


if __name__=='__main__':
    r=build_specification()
    (ROOT/'reports/integrated-specification.json').write_text(json.dumps(r,indent=2)+'\n')
    for k in ['crew','cargo']:
        s=r[k]['selected']
        print(k,'core',r[k]['ledger']['nonpropulsion_core_t'],'dry',r[k]['dry_departure_t'])
        print({x:s[x] for x in ['departure_t','arrival_t','loaded_antimatter_t','loaded_fusion_t','discarded_t','primary_energy_loaded_fuel_ZJ']})
        print('burn',s['trajectory']['burn_years'],'speed',s['trajectory']['beta'],'exhaust',[p['exhaust_c'] for p in s['phases']])
        print('landing',r[k]['ledger']['landing'])
    print('fleet',r['fleet']);print('radiation',r['radiation'])
