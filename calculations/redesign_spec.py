"""Close the selected concept's mass ledger; unresolved technology stays labelled."""
import json
import math

from calculations.family_fleet_trade import ROOT, SCENARIOS, optimise
from calculations.mission_calculations import G


def load_spec():
    return json.loads((ROOT/'docs'/'specs'/'redesign_v1.json').read_text(encoding='utf-8'))


def close_landing(dry_landed, inventories, delta_v, isp, tank_fraction=.08):
    f = 1.1*math.expm1(delta_v/(isp*G))
    # Same reserve convention as earlier studies; no rocket model can close
    # if its tank fraction makes the denominator nonpositive.
    if 1-tank_fraction*f <= 0:
        return None
    propellant = f*(dry_landed+inventories)/(1-tank_fraction*f)
    return dict(propellant_t=propellant,tank_t=tank_fraction*propellant,
                dry_landed_t=dry_landed,landed_inventory_t=inventories,
                touchdown_without_unused_propellant_t=dry_landed+inventories+tank_fraction*propellant)


def base_ledger(spec,kind,isp=None,delta_v=None):
    landing = spec['landing']
    isp = landing['terminal_Isp_s'] if isp is None else isp
    delta_v = landing['terminal_delta_v_m_s'] if delta_v is None else delta_v
    allowance = 1+spec['mass_rules']['hardware_allowance_fraction']
    if kind == 'crew':
        years = spec['fleet']['crew_flight_years']
        rows = list(spec['mass_rows'])
        shield = spec['propulsion']['shadow_shields']
        shadow_t = shield['count']*math.pi*shield['radius_m']**2*shield['tungsten_thickness_m']*shield['tungsten_density_kg_m3']/1000
        rows += [dict(id='source_shadow_shields',target_t=shadow_t+shield['neutron_layers_and_mounts_total_t'],lands=False),
                 dict(id='forward_shield_face',target_t=math.pi*7**2*.1,lands=True)]
        m = spec['mass_rules']
        inventories = (m['fixed_crew_and_loop_inventory_t']+m['adult_maintenance_t_per_year']*years+
                       m['family_maintenance_t_per_year']*m['family_years']+
                       m['landed_refuge_water_is_additional_inventory_t']+spec['power']['fuel_inventory_t'])
    else:
        years = spec['cargo']['duration_years']
        rows = [dict(id=k,target_t=v,lands=True) for k,v in spec['cargo']['surface_manifest_t'].items()]
        rows += [dict(id='landing_and_aeroshell',target_t=24,lands=True),
                 dict(id='forward_shield',target_t=math.pi*3**2*.1+2,lands=False),
                 dict(id='spine_avionics_services',target_t=10,lands=False),
                 dict(id='tow_assembly',target_t=10,lands=False),
                 dict(id='main_feed_and_electronics_protection',target_t=8,lands=False)]
        inventories = 20+.1*years+.5
    dry = allowance*sum(r['target_t'] for r in rows)
    landed = allowance*sum(r['target_t'] for r in rows if r['lands'])
    terminal = close_landing(landed,inventories,delta_v,isp)
    if terminal is None:
        return None
    # Optional thermal case charges annihilation energy separately. Its missing
    # radiation/thermal qualification is not cured by retaining chemical hardware.
    heater_am = (terminal['propellant_t']*(isp*G)**2/(4*.5*299792458**2)) if isp > 450 else 0.
    return dict(kind=kind,years=years-spec['fleet']['arrival_operations_allowance_years'],
                total_flight_years=years,hardware_rows=rows,fixed_dry_t=dry,
                supplies_t=inventories,landing_tanks_t=terminal['tank_t'],auxiliary_am_t=heater_am,
                base_arrival_t=dry+inventories+terminal['propellant_t']+terminal['tank_t']+2*heater_am,
                terminal=terminal,terminal_delta_v_m_s=delta_v,terminal_Isp_s=isp)


def build_spec_result(spec=None):
    spec = spec or load_spec()
    shadow = spec['propulsion']['shadow_shields']
    # Two equal-power pods: total intercepted fraction is that for one pod.
    shadow_fraction = shadow['prompt_gamma_fraction']*shadow['radius_m']**2/(4*shadow['distance_from_source_m']**2)
    cases = {}
    for name in ['reference','optimistic']:
        sc = dict(SCENARIOS[name])
        sc['absorbed_fraction'] += shadow_fraction
        crew_base = base_ledger(spec,'crew')
        cargo_base = base_ledger(spec,'cargo')
        crew = optimise(crew_base,sc)
        cargo = optimise(cargo_base,SCENARIOS[name])
        cases[name] = dict(crew_base=crew_base,cargo_base=cargo_base,crew=crew,cargo=cargo,
            fleet_am_t=crew['total_am_loaded_t']+cargo['total_am_loaded_t'] if crew and cargo else None,
            fleet_departure_t=crew['departure_t']+cargo['departure_t'] if crew and cargo else None)
    options = {}
    for name,isp,dv in [('chemical_500m_s',450,500),('thermal_1000m_s',1800,1000),('vacuum_chemical',450,6000)]:
        base = base_ledger(spec,'crew',isp,dv)
        scenario = dict(SCENARIOS['reference'])
        scenario['absorbed_fraction'] += shadow_fraction
        options[name] = dict(base=base,crew=optimise(base,scenario) if base else None)
    r = spec['crew_geometry'][0]['radius_m']
    radius_outer,radius_inner = spec['habitat']['gravity_floor_radii_m']
    floor_areas = [4*math.pi*radius*math.sqrt(r*r-radius*radius) for radius in [radius_outer,radius_inner]]
    refuge = next(x for x in spec['crew_geometry'] if x['id']=='refuge')
    refuge_area = 2*math.pi*refuge['radius_m']*refuge['length_m']+2*math.pi*refuge['radius_m']**2
    result = dict(revision=spec['revision'],status='Concept mass closure only; GCR, propulsion, structure and EDL remain unqualified',
        cases=cases,landing_options=options,
        geometry=dict(total_volume_m3=3*4*math.pi*r**3/3,total_envelope_area_m2=3*4*math.pi*r*r,
            gravity_rpm=60/(2*math.pi)*math.sqrt(.8*G/radius_outer),
            per_gravity_module_gross_floor_area_m2=sum(floor_areas),
            refuge_volume_m3=math.pi*refuge['radius_m']**2*refuge['length_m'],
            refuge_area_m2=refuge_area,refuge_column_kg_m2=44000/refuge_area),
        additional_shadow_absorbed_fraction=shadow_fraction)
    crew = cases['reference']['crew']
    if crew:
        terminal = cases['reference']['crew_base']['terminal']
        entry_mass = terminal['touchdown_without_unused_propellant_t']+terminal['propellant_t']
        weight = entry_mass*1000*11.67
        available = 3*3e6
        net_a = available/(entry_mass*1000)-11.67
        velocity = spec['landing']['powered_handover_target_speed_m_s']
        result['landing_screen'] = dict(entry_mass_t=entry_mass,one_engine_out_thrust_MN=9,
            initial_net_deceleration_m_s2=net_a,
            conservative_stop_distance_m=velocity**2/(2*net_a) if net_a > 0 else None,
            conservative_propulsive_delta_v_m_s=velocity*(1+11.67/net_a) if net_a > 0 else None,
            column_target_not_entry_simulation=True)
        force_each = crew['peak_thrust_MN']*1e6/2
        cable_length = math.hypot(2000,100)
        angle = math.atan2(100,2000)
        # Two independent paths per pod, each capable of full pod tension.
        tether_mass = 4*(force_each/math.cos(angle)/1e9)*cable_length*1600/1000
        result['tow_screen'] = dict(total_tether_t_at_1GPa_allowable=tether_mass,
            crossbeam_compression_kN=force_each*math.tan(angle)/1000,
            primary_plume_radius_at_bus_m=2000*math.tan(math.radians(1)),
            plume_to_habitat_clearance_m=100-2000*math.tan(math.radians(1))-7,
            source_shadow_radius_needed_m=.5*(1-50/2000)+7*(50/2000))
    return result


if __name__ == '__main__':
    result = build_spec_result()
    (ROOT/'reports'/'redesign-v1.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    for name,data in result['cases'].items():
        print(name,'fleet antimatter',data['fleet_am_t'],'fleet departure',data['fleet_departure_t'],
              'crew dry',data['crew']['dry_t'] if data['crew'] else None)
    print(json.dumps({k:result[k] for k in ['geometry','landing_screen','tow_screen']},indent=2))
