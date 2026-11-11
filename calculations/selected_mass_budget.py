"""Selected low-mass target; antimatter, torpor and full-diet food-factory technology unvalidated."""
import copy
import json
import math
from pathlib import Path
from calculations.mass_budget import build_budget
from calculations.mission_calculations import C,G,YEAR,trajectory
ROOT=Path(__file__).resolve().parent.parent

def mission_config():
    return json.loads((ROOT/'data/mission_config.json').read_text(encoding='utf-8'))

def _evaluate_whole_ship(rows,exhaust=.5,*,reserve_delta_v_km_s=None,electrical_power_MWe=2,onboard_transfer_years=None,thermal_delta_v_km_s=None):
    cfg=mission_config();transfer=onboard_transfer_years if onboard_transfer_years is not None else cfg['total_onboard_years']-cfg['arrival_allowance_years']
    mission=trajectory(transfer,acceleration_g=cfg['main_acceleration_g']);eta=mission['rapidity'];ve=cfg['thermal_Isp_s']*G
    thermal_dv=cfg['thermal_delta_v_km_s'] if thermal_delta_v_km_s is None else thermal_delta_v_km_s
    thermal_ratio=math.exp(thermal_dv*1000/ve)
    direct_ratio=math.exp(2*eta/exhaust+cfg['arrival_direct_delta_v_km_s']*1000/(exhaust*C));total_ratio=thermal_ratio*direct_ratio
    heater_am_per_h2=ve**2/(4*cfg['thermal_heating_efficiency']*C*C)
    h2_per_mass=(thermal_ratio-1)/(1+2*heater_am_per_h2)
    reserve_per_mass=.05*(direct_ratio-1)*thermal_ratio if reserve_delta_v_km_s is None else -math.expm1(-reserve_delta_v_km_s*1000/(exhaust*C))
    flux=.9*5.670374419e-8*1500**4;margin_fraction=cfg['hardware_margin_fraction']
    hotrad_per_mass=5*1e-7*(cfg['main_acceleration_g']*G)*C/(exhaust*flux)*total_ratio;tank_per_mass=.12*h2_per_mass
    hardware=sum(r['mass_kg'] for r in rows if r['kind']=='hardware');stocks=sum(r['mass_kg'] for r in rows if r['kind']!='hardware')
    denominator=1-(1+margin_fraction)*(hotrad_per_mass+tank_per_mass)-reserve_per_mass
    if denominator<=0:return {'finite_solution':False,'effective_exhaust_fraction_c':exhaust}
    retained=(hardware*(1+margin_fraction)+stocks)/denominator;departure=retained*total_ratio
    h2=retained*h2_per_mass;heat_am=h2*heater_am_per_h2;burned_direct=retained*(direct_ratio-1)*thermal_ratio;reserve=retained*reserve_per_mass
    tank=retained*tank_per_mass;radiator=retained*hotrad_per_mass;margin=margin_fraction*(hardware+tank+radiator)
    hardware_margin=hardware+tank+radiator+margin;transit_am=electrical_power_MWe*1e6*cfg['total_onboard_years']*YEAR/(2*C*C*.4)
    n={'name':'32 people / 20 years / compact closed-loop food-factory target','finite_solution':True,'effective_exhaust_fraction_c':exhaust,'final_retained_mass_kg':retained,'departure_mass_kg':departure,'hardware_before_margin_kg':hardware+tank+radiator,'hardware_with_margin_kg':hardware_margin,'hardware_margin_kg':margin,'stocks_people_kg':stocks,'retained_direct_propellant_reserve_kg':reserve,'thermal_hydrogen_kg':h2,'thermal_antimatter_kg':heat_am,'thermal_matching_matter_kg':heat_am,'hydrogen_tank_kg':tank,'engine_hot_radiator_kg':radiator,'direct_propellant_consumed_kg':burned_direct,'direct_antimatter_consumed_kg':burned_direct/2,'direct_matching_matter_consumed_kg':burned_direct/2,'propulsion_antimatter_loaded_kg':(burned_direct+reserve)/2+heat_am,'propulsion_matching_matter_loaded_kg':(burned_direct+reserve)/2+heat_am,'surface_antimatter_reserved_kg':1,'transit_power_antimatter_kg':transit_am,'initial_thrust_MN':departure*cfg['main_acceleration_g']*G/1e6,'initial_annihilation_power_PW':departure*cfg['main_acceleration_g']*G*C/exhaust/1e15,'engine_absorbed_heat_MW':departure*cfg['main_acceleration_g']*G*C/exhaust*1e-7/1e6,'engine_absorbed_fraction':1e-7,'engine_radiator_emitting_area_m2':radiator/5,'service_radiator_emitting_area_m2':build_budget()['nominal']['service_radiator_emitting_area_m2']*(electrical_power_MWe/10),'hardware_margin_fraction':margin_fraction,'nominal_phase_masses_kg':{'departure':departure,'after_acceleration':departure/math.exp(eta/exhaust),'before_interstellar_braking':departure/math.exp(eta/exhaust),'after_interstellar_braking':departure/math.exp(2*eta/exhaust),'after_direct_arrival_braking':retained*thermal_ratio,'after_hydrogen_touchdown':retained}}
    n['total_radiator_emitting_area_m2']=n['engine_radiator_emitting_area_m2']+n['service_radiator_emitting_area_m2']
    assert abs(departure-retained-h2-2*heat_am-burned_direct)<1e-6
    assert abs(retained-hardware_margin-stocks-reserve)<1e-6
    return n

def evaluate(rows,exhaust=.5,*,reserve_delta_v_km_s=None,electrical_power_MWe=2,onboard_transfer_years=None,thermal_delta_v_km_s=None):
    cfg=mission_config()
    if not cfg.get('stage_flight_hardware_before_arrival',False):
        return _evaluate_whole_ship(rows,exhaust,reserve_delta_v_km_s=reserve_delta_v_km_s,electrical_power_MWe=electrical_power_MWe,onboard_transfer_years=onboard_transfer_years,thermal_delta_v_km_s=thermal_delta_v_km_s)
    transfer=onboard_transfer_years if onboard_transfer_years is not None else cfg['total_onboard_years']-cfg['arrival_allowance_years']
    mission=trajectory(transfer,acceleration_g=cfg['main_acceleration_g']);ve=cfg['thermal_Isp_s']*G
    dv=cfg['thermal_delta_v_km_s'] if thermal_delta_v_km_s is None else thermal_delta_v_km_s
    thermal_ratio=math.exp(dv*1000/ve);heater_am_per_h2=ve**2/(4*cfg['thermal_heating_efficiency']*C*C)
    h2_per_mass=(thermal_ratio-1)/(1+2*heater_am_per_h2);tank_per_mass=.12*h2_per_mass
    capture_dv=cfg['pre_separation_capture_delta_v_km_s']
    interstellar_ratio=math.exp(2*mission['rapidity']/exhaust+capture_dv*1000/(exhaust*C))
    arrival_ratio=math.exp((cfg['arrival_direct_delta_v_km_s']-capture_dv)*1000/(exhaust*C))
    # Reserve stays with the orbital flight module after the last planned correction.
    correction_ratio=math.exp((cfg['correction_reserve_delta_v_km_s'] if reserve_delta_v_km_s is None else reserve_delta_v_km_s)*1000/(exhaust*C))
    margin_fraction=cfg['hardware_margin_fraction'];factor=1+margin_fraction
    def total(kind,surface):return sum(r['mass_kg'] for r in rows if (r['kind']=='hardware')==kind and r.get('surface_delivery',True)==surface)
    land_hardware,flight_hardware=total(True,True),total(True,False)
    land_stocks,flight_stocks=total(False,True),total(False,False)
    flux=.9*5.670374419e-8*1500**4
    cruise_rad_per_departure=5*1e-7*cfg['main_acceleration_g']*G*C/(exhaust*flux)
    landing_rad_per_retained=5*1e-7*cfg['landing_proper_acceleration_earth_g_study']*G*C/(exhaust*flux)*thermal_ratio*arrival_ratio
    land_denominator=1-factor*(tank_per_mass+landing_rad_per_retained)
    flight_denominator=1-correction_ratio*factor*cruise_rad_per_departure*interstellar_ratio
    if min(land_denominator,flight_denominator)<=0:return {'finite_solution':False,'effective_exhaust_fraction_c':exhaust}
    retained=(factor*land_hardware+land_stocks)/land_denominator
    h2=retained*h2_per_mass;heat_am=h2*heater_am_per_h2;tank=.12*h2
    landing_radiator=retained*landing_rad_per_retained
    thermal_ignition=retained+h2+2*heat_am
    descent_departure=thermal_ignition*arrival_ratio
    fixed_post_burn=descent_departure+factor*flight_hardware+flight_stocks
    after_main=correction_ratio*(fixed_post_burn-factor*landing_radiator)/flight_denominator
    cruise_only_radiator=cruise_rad_per_departure*after_main*interstellar_ratio-landing_radiator
    if cruise_only_radiator<0:
        cruise_only_radiator=0;after_main=correction_ratio*fixed_post_burn
    departure=after_main*interstellar_ratio
    reserve=after_main-(fixed_post_burn+factor*cruise_only_radiator)
    discarded=after_main-descent_departure
    burned_direct=departure-after_main+descent_departure-thermal_ignition
    radiator=landing_radiator+cruise_only_radiator
    all_hardware=land_hardware+flight_hardware+tank+radiator
    all_margin=margin_fraction*all_hardware
    land_margin=margin_fraction*(land_hardware+tank+landing_radiator)
    transit_am=electrical_power_MWe*1e6*cfg['total_onboard_years']*YEAR/(2*C*C*.4)
    n={'name':'32 people / 20 years / staged surface delivery','finite_solution':True,'effective_exhaust_fraction_c':exhaust,
       'final_retained_mass_kg':retained,'departure_mass_kg':departure,'total_unburned_mass_kg':retained+discarded,
       'flight_hardware_and_stocks_left_behind_kg':discarded,'surface_hardware_before_margin_kg':land_hardware+tank+landing_radiator,
       'surface_hardware_margin_kg':land_margin,'surface_hardware_with_margin_kg':factor*(land_hardware+tank+landing_radiator),
       'surface_stocks_people_kg':land_stocks,'hardware_before_margin_kg':all_hardware,'hardware_with_margin_kg':factor*all_hardware,
       'hardware_margin_kg':all_margin,'stocks_people_kg':land_stocks+flight_stocks,'retained_direct_propellant_reserve_kg':reserve,
       'surface_direct_propellant_reserve_kg':0,'thermal_hydrogen_kg':h2,'thermal_antimatter_kg':heat_am,'thermal_matching_matter_kg':heat_am,
       'hydrogen_tank_kg':tank,'engine_hot_radiator_kg':radiator,'landing_hot_radiator_kg':landing_radiator,
       'cruise_only_hot_radiator_kg':cruise_only_radiator,'direct_propellant_consumed_kg':burned_direct,
       'direct_antimatter_consumed_kg':burned_direct/2,'direct_matching_matter_consumed_kg':burned_direct/2,
       'propulsion_antimatter_loaded_kg':(burned_direct+reserve)/2+heat_am,'propulsion_matching_matter_loaded_kg':(burned_direct+reserve)/2+heat_am,
       'surface_antimatter_reserved_kg':1,'transit_power_antimatter_kg':transit_am,
       'landing_direct_antimatter_consumed_kg':(descent_departure-thermal_ignition)/2,
       'mass_at_thermal_ignition_kg':thermal_ignition,'mass_after_separation_kg':descent_departure,
       'initial_thrust_MN':departure*cfg['main_acceleration_g']*G/1e6,
       'initial_annihilation_power_PW':departure*cfg['main_acceleration_g']*G*C/exhaust/1e15,
       'engine_absorbed_heat_MW':departure*cfg['main_acceleration_g']*G*C/exhaust*1e-7/1e6,'engine_absorbed_fraction':1e-7,
       'engine_radiator_emitting_area_m2':radiator/5,'landing_radiator_emitting_area_m2':landing_radiator/5,
       'service_radiator_emitting_area_m2':build_budget()['nominal']['service_radiator_emitting_area_m2']*(electrical_power_MWe/10),
       'hardware_margin_fraction':margin_fraction,
       'nominal_phase_masses_kg':{'departure':departure,'after_acceleration':departure/math.exp(mission['rapidity']/exhaust),
           'before_interstellar_braking':departure/math.exp(mission['rapidity']/exhaust),'after_interstellar_braking':departure/math.exp(2*mission['rapidity']/exhaust),'after_capture_before_separation':after_main,
           'after_orbital_separation':descent_departure,'after_direct_arrival_braking':thermal_ignition,'after_hydrogen_touchdown':retained}}
    n['total_radiator_emitting_area_m2']=n['service_radiator_emitting_area_m2']+n['engine_radiator_emitting_area_m2']
    assert abs(departure-retained-discarded-h2-2*heat_am-burned_direct)<1e-6
    assert abs(retained-factor*(land_hardware+tank+landing_radiator)-land_stocks)<1e-6
    return n


def build_selected():
    cfg=mission_config();layout=json.loads((ROOT/'data/reference/spacecraft_layout.json').read_text());habitat=json.loads((ROOT/'data/reference/habitat_layout.json').read_text());ref=build_budget()
    rows=[dict(copy.deepcopy(r),mass_kg=r['low_kg']) for r in ref['components'] if r['kind']!='derived' and r['id']!='farm']
    for row in rows:
        row['reference_basis']=row['basis'];row['basis']='Retained lightweight target from reference: '+row['basis'];row['status']='Optimistic planning target, not validated hardware.'
        row.pop('low_kg',None);row.pop('high_kg',None)
    d={r['id']:r for r in rows}
    for key,label in [('refuge','Rigid 32-person descent refuge and airlocks'),('medical','32 torpor beds, medical systems and embryo storage'),('food','One tonne spare edible food plus packaging')]:d[key]['system']=label
    crew_scale=cfg['crew']/36;r=layout['disc_radius_m'];depth=layout['disc_axial_depth_m'];count=habitat['disc_count'];radii=habitat['geometry_study_not_selected_dimensions']['deck_floor_radii_m']
    area=count*(2*math.pi*r*r+2*math.pi*r*depth);floor=count*2*math.pi*sum(radii)*3;volume=count*math.pi*r*r*depth
    def setmass(key,mass,basis):d[key]['mass_kg']=mass;d[key]['basis']=basis
    setmass('membranes',area*6,f'{area:.1f} m2 outer-envelope approximation x 6 kg/m2. Internal compartment area, pressure ties and 20-year life unqualified.')
    setmass('floors',floor*10,f'{floor:.1f} m2 gross floor x 10 kg/m2; floor loading, folding and service access unvalidated.')
    setmass('habframes',6000+24000*len(radii)/4,'6 t fixed hubs/attachments plus 24 t reference deployable frames scaled from four to three decks. Separate bearings remain counted.')
    setmass('furnishings',12000*crew_scale,'Eight 12 m2 couple cabins per disc, 32-person shared rooms; occupancy-linked furnishings scaled 32/36.')
    setmass('dustshield',layout['forward_shield_height_m_study']*layout['forward_shield_width_m_study']*layout['shield_areal_mass_kg_m2_sensitivity'],f"{layout['forward_shield_height_m_study']:g} x {layout['forward_shield_width_m_study']:g} m rectangle covering the habitat stack and nozzle ring at an unproven {layout['shield_areal_mass_kg_m2_sensitivity']:g} kg/m2; no change in claimed protection performance.")
    old_refuge_area=2*math.pi*3*14+2*math.pi*3**2;new_refuge_area=2*math.pi*2.6*12+2*math.pi*2.6**2
    setmass('refuge',12000*(.7*new_refuge_area/old_refuge_area+.3*crew_scale),'32-seat refuge target: 70% pressure-hull allowance scaled by surface area, 30% by crew; crash/medical/endurance qualification outstanding.')
    setmass('radiationshield',15000*new_refuge_area/old_refuge_area,'Refuge shield allowance scaled by reduced hull area at unchanged assumed areal protection; radiation transport unvalidated.')
    setmass('eclss',6000+9000*crew_scale,'6 t fixed control/redundancy plus 9 t reference throughput-dependent hardware scaled 32/36. Full closure unvalidated.')
    setmass('medical',5000+cfg['crew']*250,'32 convertible torpor beds x 250 kg plus 5 t fixed medical and embryo systems. Torpor remains unproven.')
    setmass('power',6000,'2 MWe carried conversion/distribution/startup target; full local expansion later. Hardware and demand unqualified.')
    setmass('warmradiators',ref['nominal']['service_radiator_emitting_area_m2']*.2*2.5,'2 MWe service/surface starter at reference 600/330 K loops and 2.5 kg per emitting m2; includes reference 25% area allowance.')
    factory_volume=2*math.pi*layout['food_factory_modules_study']['radius_m']**2*layout['food_factory_modules_study']['length_m']
    setmass('gas',70000*(volume+factory_volume)/(287.05*293.15)+2000,'Initial habitat and two food-factory module atmosphere at 70 kPa/293 K plus 2 t contingency. No large external crop-bay gas.')
    setmass('water',15000*crew_scale+cfg['extra_food_process_water_kg'],'15 t reference water/process buffer scaled 32/36 plus 3 t food-factory process water. Perfect eventual recycling assumed.')
    setmass('food',cfg['spare_edible_food_kg']+cfg['food_packaging_kg'],'User-selected 1,000 kg edible emergency diet plus separate 20 kg reusable/bulk packaging allowance; normal full-crew metabolism.')
    setmass('crew',cfg['crew']*90,'32 people and personal effects at 90 kg/person total; no transit births.')
    transit_am=cfg['electrical_power_MWe']*1e6*cfg['total_onboard_years']*YEAR/(2*C*C*.4)
    setmass('powerfuel',2+2*transit_am,'Separate 1 kg surface antimatter bank plus matching matter, and 20 years of 2 MWe transit power at 40% conversion.')
    setmass('spares',15000,'15 t initial repair/feedstock buffer retained; parts and end-of-life material recycled/reprinted. No claim that installed components last 20 years.')
    setmass('consumables',12000,'Initial medical, hygiene, purification and chemical buffer; universal fabrication and ultimate material recovery assumed, no automatic annual mass consumption.')
    rows.extend([{'id':'foodfactory','system':'Redundant microbial/chemical full-diet food factory and small garden','mass_kg':cfg['food_factory_hardware_target_kg'],'kind':'hardware','basis':'Lowest studied 10 t target for two complete-diet trains, sterile processing, pressure modules, culture banks and fresh garden; no demonstrated integrated design.','status':'Advanced-technology target, unvalidated.'},{'id':'foodloop_inventory','system':'Food-loop startup and circulating material inventory','mass_kg':cfg['food_loop_inventory_kg'],'kind':'consumable','basis':'Separate 1 t process/nutrient inventory, not edible emergency food; perfect eventual elemental recovery assumed.','status':'Working-inventory target; chemical balance unvalidated.'}])
    # Flight-only equipment remains aboard through both interstellar burns.
    flight_splits=[('structure',20000,'flightstructure','Cruise engine standoff and support frame'),
                   ('engine',25000,'cruiseengine','Interstellar magnetic nozzle and cruise engine'),
                   ('containment',38000,'bulkcontainment','Bulk cruise antimatter containment and cryogenics'),
                   ('exploration',420,'spacescouts','Space scouts, microlanders and their support allocations')]
    byid={r['id']:r for r in rows}
    for key,mass,newid,label in flight_splits:
        original=byid[key];original['mass_kg']-=mass
        rows.append(dict(original,id=newid,system=label,mass_kg=mass,surface_delivery=False,basis='Reassigned from existing total allowance; detached in destination orbit before terminal descent. Detailed interface and sizing unvalidated.'))
    byid['engine']['system']='Dedicated direct/thermal descent engine';byid['engine']['basis']='10 t target reassigned from former combined 35 t engine allowance. Independent direct braking and thermal touchdown engine must be engineered; not a proven mass.'
    byid['containment']['system']='Descent antimatter containment';byid['containment']['basis']='2 t target reassigned from 40 t bulk storage allowance for the much smaller descent fuel inventory. Containment, shielding and power unqualified.'
    byid['structure']['system']='Settlement delivery frame and surface services';byid['structure']['basis']='10 t retained from 30 t cruise support allocation. Supports mandatory descent, unloading and habitat deployment; load paths unqualified.'
    byid['exploration']['system']='Two surface micro-rovers';byid['exploration']['basis']='30 kg from unchanged 450 kg remote allowance; all other scouts/support released before descent.'
    for row in rows:
        row.setdefault('surface_delivery',row['id'] not in ['dustshield','bearings'])
        row['delivery_role']='Settlement essential or mandatory descent equipment' if row['surface_delivery'] else 'Flight-only: detached before surface descent'
    rows.append({'id':'separation','system':'Separation interfaces and independent service isolation','mass_kg':cfg['staging_hardware_kg_target'],'kind':'hardware','surface_delivery':True,'delivery_role':'Mandatory descent equipment','basis':'2 t additional target for releasable interfaces, valves, power/data isolation and separation controls; includes retained interface halves conservatively. Unqualified.','status':'New planning target; no demonstrated staging design.'})
    base_rows=copy.deepcopy(rows);n=evaluate(rows,cfg['effective_exhaust_fraction_c'],reserve_delta_v_km_s=cfg['correction_reserve_delta_v_km_s'],electrical_power_MWe=cfg['electrical_power_MWe'])
    derived=[('hydrogentank','Thermal hydrogen tanks and insulation',n['hydrogen_tank_kg'],True,'12% of calculated terminal hydrogen; needed for descent.'),
             ('landingradiator','Descent-engine hot radiators',n['landing_hot_radiator_kg'],True,'1,500 K, 1e-7 absorbed heat, sized for the landing vehicle at 1.788 Earth g proper acceleration; unproven.'),
             ('engineradiator','Detachable cruise-only hot radiator extensions',n['cruise_only_hot_radiator_kg'],False,'Additional hot area above retained descent cooling, sized for peak interstellar thrust and detached in orbit.'),
             ('margin','Landed hardware development allowance',n['surface_hardware_margin_kg'],True,'25% of retained hardware including descent tanks, cooling and separation interfaces.'),
             ('flightmargin','Flight-only hardware development allowance',n['hardware_margin_kg']-n['surface_hardware_margin_kg'],False,'25% allowance follows the flight hardware off the lander; it is still carried during cruise.'),
             ('fuelreserve','Unused correction propellant, matter plus antimatter',n['retained_direct_propellant_reserve_kg'],False,'100 km/s ideal correction allowance for the pre-separation vehicle; unused reserve left with bulk storage in orbit, counted once.')]
    for key,system,mass,surface,basis in derived:rows.append({'id':key,'system':system,'mass_kg':mass,'kind':'derived','surface_delivery':surface,'basis':basis,'status':'Conditional staged planning result.'})
    assert abs(sum(r['mass_kg'] for r in rows)-n['total_unburned_mass_kg'])<1e-6
    assert abs(sum(r['mass_kg'] for r in rows if r['surface_delivery'])-n['final_retained_mass_kg'])<1e-6
    sensitivity=[]
    for target in cfg['food_factory_hardware_sensitivity_kg']:
        alt=copy.deepcopy(base_rows);next(r for r in alt if r['id']=='foodfactory')['mass_kg']=target
        sensitivity.append(dict(evaluate(alt,.5,reserve_delta_v_km_s=100,electrical_power_MWe=2),factory_hardware_target_kg=target))
    mission=trajectory(cfg['total_onboard_years']-cfg['arrival_allowance_years']);comparison=[]
    for years in [15.9,19.9]:comparison.append(dict(evaluate(base_rows,.5,reserve_delta_v_km_s=100,electrical_power_MWe=2,onboard_transfer_years=years),name=f'Same selected 32-person component targets / {years+0.1:.0f} years onboard'))
    return {'status':'32 people, 20 years onboard, one tonne edible reserve, staged settlement delivery, compact full-diet food-factory target; enabling technologies and reserve adequacy unvalidated.','crew':cfg['crew'],'couples':cfg['couples'],'geometry':{'gross_floor_area_m2':floor,'net_floor_area_m2_assumed':floor*.65,'full_disc_gross_pressure_volume_m3':volume,'full_disc_pressure_area_m2':area},'components':rows,'delivery_manifest':{'surface':[r for r in rows if r['surface_delivery']],'left_in_orbit':[r for r in rows if not r['surface_delivery']]},'whole_ship_comparison':_evaluate_whole_ship([r for r in base_rows if r['id']!='separation'],.5,reserve_delta_v_km_s=100,electrical_power_MWe=2),'nominal':n,'mass_reduction_comparison':comparison,'food_factory_sensitivity':sensitivity,'trajectory':mission,'assumptions':dict(cfg,interstellar_transfer_years=cfg['total_onboard_years']-cfg['arrival_allowance_years'],arrival_time_allowance_years=cfg['arrival_allowance_years'],hardware_margin_fraction=.25,transit_power_MWe=2,surface_starter_MWe=2,surface_expansion_target_MWe=10,torpor_nutrition_discount=0,spare_food_endurance_days_at_full_crew=cfg['spare_edible_food_kg']/(cfg['crew']*.617),food_production='Complete-diet microbial/chemical factory, small fresh-food garden; rigid factory must operate during burns and coast.',storage_loss_credit='Zero antimatter losses and zero hydrogen boiloff assumed; containment and cooling unproven.',engine_exhaust_definition='Thrust divided by total rest-mass loss rate including escaping radiation and particles; optimistic whole-engine 0.5c target.',departure_boundary='Assembled in space; Earth launch, fuel production and assembly propellant excluded.',arrival_status=cfg['arrival_delta_v_allocation_status']),'exhaust_sensitivity':[evaluate(base_rows,f,reserve_delta_v_km_s=100,electrical_power_MWe=2) for f in [.3,.5]],'sources':ref['sources']+[{'title':'Space food from hydrogen-oxidising bacteria','url':'https://www.sciencedirect.com/science/article/pii/S0094576520307438','use':'Protein/calorie and equivalent-mass research; not a qualified complete diet.'},{'title':'Electrochemical-biological food production','url':'https://doi.org/10.1038/s43016-022-00530-x','use':'Candidate carbon feedstock routes; integrated food factory unvalidated.'}]}

if __name__=='__main__':
    result=build_selected();(ROOT/'reports/mass-budget.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    path=ROOT/'data/reference/spacecraft_layout.json';layout=json.loads(path.read_text());n=result['nominal'];layout['mass_ledger']=result['components'];layout['mass_budget_status']=result['status']
    tank=layout['hydrogen_tanks_study'];tank['semi_axis_radial_m']=math.sqrt(n['thermal_hydrogen_kg']*(1+tank['capacity_margin_over_nominal_load'])/(2*4/3*math.pi*tank['semi_axis_x_m']*(1-tank['ullage_fraction'])*tank['hydrogen_density_kg_m3']))
    for bank,area in zip(layout['radiator_panels_study']['banks'],[n['service_radiator_emitting_area_m2'],n['engine_radiator_emitting_area_m2']]):bank['x_max_m']=bank['x_min_m']+area/(4*layout['radiator_panels_study']['height_m'])+8*.15;bank['emitting_area_m2_target']=area
    path.write_text(json.dumps(layout,indent=2)+'\n')
    print({k:round(n[k],3) for k in ['hardware_with_margin_kg','final_retained_mass_kg','departure_mass_kg','propulsion_antimatter_loaded_kg','thermal_hydrogen_kg']})
