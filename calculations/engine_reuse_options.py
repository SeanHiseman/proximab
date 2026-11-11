"""Unselected reuse of the cruise engine through direct descent; release-state accounting."""
import copy
import json
import math
from pathlib import Path
from calculations.selected_mass_budget import build_selected,mission_config
from calculations.mission_calculations import C,G,trajectory,continuous_terminal_sensitivity


def evaluate_reuse(rows,thermal_delta_v_km_s=.4,exhaust=.5):
    cfg=mission_config();factor=1+cfg['hardware_margin_fraction']
    mission=trajectory(cfg['total_onboard_years']-cfg['arrival_allowance_years'],acceleration_g=cfg['main_acceleration_g'])
    ve=cfg['thermal_Isp_s']*G;ratio=math.exp(thermal_delta_v_km_s*1000/ve)
    heater_am_per_h2=ve**2/(4*cfg['thermal_heating_efficiency']*C*C)
    h2_per_mass=(ratio-1)/(1+2*heater_am_per_h2);tank_per_mass=.12*h2_per_mass
    early_ids={'dustshield','bearings','spacescouts'}
    def total(hardware,predicate):return sum(r['mass_kg'] for r in rows if (r['kind']=='hardware')==hardware and predicate(r))
    landed=lambda r:r['surface_delivery']
    early=lambda r:r['id'] in early_ids
    late=lambda r:not landed(r) and not early(r)
    land_hardware,land_stocks=total(True,landed),total(False,landed)
    early_mass=factor*total(True,early)+total(False,early)
    late_base=factor*total(True,late)+total(False,late)
    land= (factor*land_hardware+land_stocks)/(1-factor*tank_per_mass)
    h2=land*h2_per_mass;heater_am=h2*heater_am_per_h2;tank=.12*h2
    ignition=land+h2+2*heater_am
    interstellar=math.exp(2*mission['rapidity']/exhaust+cfg['pre_separation_capture_delta_v_km_s']*1000/(exhaust*C))
    arrival=math.exp((cfg['arrival_direct_delta_v_km_s']-cfg['pre_separation_capture_delta_v_km_s'])*1000/(exhaust*C))
    reserve_fraction=-math.expm1(-cfg['correction_reserve_delta_v_km_s']*1000/(exhaust*C))
    flux=.9*5.670374419e-8*1500**4
    cruise_cooling=5*1e-7*cfg['main_acceleration_g']*G*C/(exhaust*flux)
    descent_cooling=5*1e-7*cfg['landing_proper_acceleration_earth_g_study']*G*C/(exhaust*flux)
    # Shared hot panels must support whichever phase has the larger thrust/heat load.
    after_capture=(arrival*(ignition+late_base)+early_mass)/(1-arrival*reserve_fraction-arrival*factor*cruise_cooling*interstellar)
    hot=cruise_cooling*interstellar*after_capture
    if hot<descent_cooling*(after_capture-early_mass):
        after_capture=(arrival*(ignition+late_base-factor*descent_cooling*early_mass)+early_mass)/(1-arrival*reserve_fraction-arrival*factor*descent_cooling)
        hot=descent_cooling*(after_capture-early_mass)
    departure=after_capture*interstellar;reserve=reserve_fraction*after_capture
    late_mass=late_base+factor*hot+reserve
    before_descent=after_capture-early_mass;before_release=ignition+late_mass
    direct_consumed=departure-after_capture+before_descent-before_release
    all_hardware=total(True,lambda r:True)+tank+hot
    result={'status':'Unselected conditional engine-reuse study; late stage separation/divert and thermal hardware cooling unqualified.',
            'thermal_delta_v_km_s':thermal_delta_v_km_s,'effective_exhaust_fraction_c':exhaust,
            'thermal_hardware_allowance_kg':next(r['mass_kg'] for r in rows if r['id']=='engine'),
            'departure_mass_kg':departure,'final_retained_mass_kg':land,'thermal_hydrogen_kg':h2,
            'thermal_antimatter_kg':heater_am,'mass_at_thermal_ignition_kg':ignition,
            'early_release_mass_kg':early_mass,'late_engine_stage_release_mass_kg':late_mass,
            'direct_propellant_consumed_kg':direct_consumed,'retained_correction_propellant_kg':reserve,
            'propulsion_antimatter_loaded_kg':(direct_consumed+reserve)/2+heater_am,
            'engine_hot_radiator_kg':hot,'hardware_with_margin_kg':factor*all_hardware,
            'landed_hardware_with_margin_kg':factor*(land_hardware+tank),'peak_descent_thrust_MN':before_descent*cfg['landing_proper_acceleration_earth_g_study']*G/1e6,
            'phase_masses_kg':{'departure':departure,'after_interstellar_braking':departure/math.exp(2*mission['rapidity']/exhaust),
               'after_capture':after_capture,'after_early_release':before_descent,'before_engine_release':before_release,
               'after_engine_release':ignition,'after_touchdown':land}}
    assert abs(departure-land-early_mass-late_mass-h2-2*heater_am-direct_consumed)<1e-6
    return result


def build_engine_options():
    selected=build_selected();rows=copy.deepcopy([r for r in selected['components'] if r['kind']!='derived'])
    # Keep the complete prior 10 t engine and 2 t local-store allowances conservatively;
    # repurpose them for hydrogen-heater/nozzle and its isolated metering/containment.
    # No mass saving from deleting the duplicated direct nozzle is assumed yet.
    cfg=mission_config();terminal=continuous_terminal_sensitivity();cases=[]
    mu=3.986004418e14*1.44;radius=6371000*1.10;gravity=mu/radius**2
    for height,dv in [(10,1.025),(5,.8),(1,.4)]:
        case=evaluate_reuse(rows,dv);ideal=next(c for c in terminal['switch_cases'] if c['height_km']==height)
        speed=ideal['downward_speed_at_switch_km_s']*1000
        # Local constant-g approximation, starting with the same downward speed.
        impact_time=2*height*1000/(math.sqrt(speed**2+2*gravity*height*1000)+speed)
        case.update(switch_height_km=height,ideal_terminal=ideal,
                    unpowered_stage_ground_time_seconds=impact_time,
                    instantaneous_lateral_delta_v_for_1km_offset_m_s=1000/impact_time)
        cases.append(case)
    return {'status':'Comparison only; currently selected model still has orbital main-engine release and independent direct/thermal descent.',
            'conservative_scope':'Same 10 t touchdown engine, 2 t local containment and 2 t separation allowances. No smaller thermal-only hardware credit. Shared direct-engine hot radiators leave with the cruise engine; the hydrogen-heated engine needs its own qualified regenerative/pulse cooling within its allowance.',
            'release_policy':'Dust shield, bearings and remote scouts separate early. Main direct engine, bulk storage, standoff frame, hot radiators and unused correction stock stay through descent, then release at hydrogen handover. Disposal maneuver, safe plume/fragment corridor and transition loads not solved.',
            'ground_time_model':'Constant local gravity, no thrust, vertical point mass. Illustrative warning against simply dropping the stage below the habitat; 1 km lateral delta-v assumes an instantaneous impulse, not a feasible divert maneuver.',
            'previous_selected':selected['nominal'],'cases':cases}

if __name__=='__main__':
    result=build_engine_options()
    (Path(__file__).resolve().parent.parent / 'reports/engine-reuse-options.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print([{k:round(c[k],3) for k in ['switch_height_km','departure_mass_kg','final_retained_mass_kg','thermal_hydrogen_kg','late_engine_stage_release_mass_kg','unpowered_stage_ground_time_seconds']} for c in result['cases']])
