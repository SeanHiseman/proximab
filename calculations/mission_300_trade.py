"""300 t allocation, continuous transit roster, food/thermal/relay calculations.

Engineering allocations are not demonstrated component masses or safety limits.
"""
import copy
import csv
import io
import json
import math
from pathlib import Path

from calculations.dry_mass_trade import build_trade
from calculations.mission_calculations import C, G, YEAR, trajectory

ROOT = Path(__file__).resolve().parent.parent
SIGMA = 5.670374419e-8


def nutrition(awake, torpid, torpor_factor=.6):
    kcal = awake*2500+torpid*2500*torpor_factor
    protein = (awake+torpid)*70*1.2/1000
    lipid = .30*kcal/9000
    carb = (kcal-protein*4000-lipid*9000)/4000
    # Illustrative harvested biomass: 65% protein, 10% lipid, 15% digestible
    # carbohydrate, 10% other matter. This is a formulation assumption.
    biomass = protein/.65
    extra_lipid = lipid-.10*biomass
    extra_carb = carb-.15*biomass
    return dict(awake=awake,torpid=torpid,kcal_day=kcal,protein_kg_day=protein,
                lipid_kg_day=lipid,carbohydrate_kg_day=carb,
                protein_biomass_kg_day=biomass,additional_lipid_kg_day=extra_lipid,
                additional_carbohydrate_kg_day=extra_carb,
                food_solids_kg_day=biomass+extra_lipid+extra_carb,
                chemical_food_power_W=kcal*4184/86400)


def food_factory():
    coast = nutrition(8,24)
    all_awake = nutrition(32,0)
    # These are explicit sustained-productivity assumptions, not universal
    # organism properties or a demonstrated closed-loop process.
    rates = dict(protein_biomass=.5,carbohydrate=.25,lipid=.1) # g/L/h
    output = dict(protein_biomass=coast['protein_biomass_kg_day'],
                  carbohydrate=coast['additional_carbohydrate_kg_day'],
                  lipid=coast['additional_lipid_kg_day'])
    uptime = .8
    volumes = {key:mass*1000/(24*rates[key]*uptime) for key,mass in output.items()}
    # The carbohydrate/lipid shares change with calorie demand while protein
    # stays fixed. Size post-landing operating water from actual branch outputs.
    surface_output = dict(protein_biomass=all_awake['protein_biomass_kg_day'],
                          carbohydrate=all_awake['additional_carbohydrate_kg_day'],
                          lipid=all_awake['additional_lipid_kg_day'])
    surface_volumes = {key:mass*1000/(24*rates[key]*uptime) for key,mass in surface_output.items()}
    hardware = dict(two_train_vessels_and_jackets=600,electrolysis_and_gas_conditioning=250,
                    carbon_intermediate_and_enzyme_hardware=400,harvesting_and_slurry_processing=300,
                    pumps_valves_heat_exchange=300,culture_and_micronutrient_modules=200,
                    controls_and_analysis=100,enclosure_frames_and_mounts=550,
                    cleaning_and_sterilisation=300)
    # A thin-shell screen for the primary process vessels only, not a factory mass.
    # Each branch is one cylinder with hemispherical ends, chosen L=4r.
    vessels = []
    for name,litres in volumes.items():
        volume = litres/1000
        radius = (volume/(math.pi*(4+4/3)))**(1/3)
        thickness = max(.002, .3e6*radius/(100e6*.85))
        area = 12*math.pi*radius**2
        vessels.append(dict(branch=name,volume_m3=volume,radius_m=radius,
                            shell_thickness_m=thickness,unreinforced_shell_mass_kg=area*thickness*8000))
    return dict(transit=coast,descent_and_surface=all_awake,
                torpor_factor_sensitivity=[nutrition(8,24,factor) for factor in [.4,.6,.8]],
                productivity_g_L_h=rates,uptime_fraction=uptime,
                one_train_working_volume_L=volumes,
                two_installed_trains_capacity_kcal_day=2*coast['kcal_day'],
                surface_operating_volume_L=surface_volumes,
                vessel_shell_screen=vessels,hardware_allocation_kg=hardware,
                assumed_water_inventory_kg=5000,
                transit_process_volume_L=sum(volumes.values()),
                surface_process_volume_L=sum(surface_volumes.values()),
                water_note='Process-liquid volume screen only: feedstock/cell displacement, auxiliary stages and hold-up require validation. 100% recovery; no loss reserve.',
                dry_food_for_one_all_awake_day_kg=all_awake['food_solids_kg_day'],
                electrical_power_W_at_efficiencies={str(eff):coast['chemical_food_power_W']/eff for eff in [.05,.1,.15]},
                electrical_plant_allocation_W=125000,
                status='Two coast-duty trains; both operate on surface. Complete diet, sustained rate, enzyme renewal and 20-year closure unvalidated.')


def relay_chain(margin_fraction=.15):
    mission = trajectory(19.9)
    count, per_node, dispenser = 200,.4,5
    ratio = math.exp(mission['rapidity']/.5)
    node_dry = per_node/ratio
    fuel = count*(per_node-node_dry)
    dry = count*node_dry+dispenser
    allowance = margin_fraction*dry
    distance = 4.2465*C*YEAR/(count+1)
    wavelength, h = 1.55e-6,6.62607015e-34
    cases = []
    for diameter in [1,5,10,20]:
        # Ideal on-axis far-field circular-aperture coupling; lumped efficiency
        # .2 includes detector/optical losses, not pointing/weather/noise penalties.
        photons = .2*(math.pi*.05*diameter/(4*wavelength*distance))**2/(h*C/wavelength)
        area = math.pi*diameter**2/4
        cases.append(dict(receiver_diameter_m=diameter,receiver_area_m2=area,
                          detected_photons_s=photons,screen_bits_s_at_10_photons_per_bit=photons/10,
                          bare_film_kg_at_1um=area*1400*1e-6,
                          bare_film_kg_at_quarter_um=area*1400*.25e-6))
    return dict(count=count,mass_cap_all_up_kg=100,nominal_node_all_up_kg=per_node,
                dispenser_kg=dispenser,dry_hardware_kg=dry,dry_development_allowance_kg=allowance,
                braking_matter_plus_antimatter_kg=fuel,braking_antimatter_kg=fuel/2,
                total_with_dry_allowance_kg=dry+allowance+fuel,
                remaining_cap_kg=100-dry-allowance-fuel,
                node_dry_hardware_kg=node_dry,spacing_AU=distance/149597870700,
                spacing_light_days=distance/C/86400,
                transmitter_aperture_m=.05,optical_transmit_power_W=1,wavelength_m=wavelength,
                nominal_receiver_diameter_m=20,nominal_film_thickness_m=.25e-6,
                receiver_cases=cases,
                coast_release_braking_distance_ly=C*C/(1.2*G)*(math.cosh(mission['rapidity'])-1)/(C*YEAR),
                coast_release_braking_proper_days=mission['rapidity']*C/(1.2*G)/86400,
                one_way_end_to_end_light_years=4.2465,
                chain_survival_for_node_reliability={str(p):p**count for p in [.99,.999,.9999]},
                status='Proposed 100 kg requirement, NOT feasible hardware demonstrated. Wide diffractive receivers included. Independent power, braking/containment, pointing, background rejection and trajectory deployment do not yet close.',
                stationary_definition='Approximately at rest in a chosen Solar-System-barycentric frame after braking. Gravitational motion, transverse motion and stationkeeping remain to be solved; not Earth-fixed.')


def thermal_budget():
    # Explicit reduced-load targets; no automatic scale-down from sleeping crew.
    loads = dict(food=125000,habitat_medical=150000,life_support=200000,
                 containment_cryogenics=300000,computing_comms=20000,
                 robotics=50000,distribution=80000,operating_margin=275000)
    electric = sum(loads.values())
    conversion_heat = electric*(1/.4-1)
    original = build_trade()
    hot_area = next(r['target_kg'] for r in original['items'] if r['id']=='hotradiators')/5
    loops = []
    for name,heat,temp,area_factor,areal in [('Conversion',conversion_heat,600,1.25,2),
                                          ('Loads',electric,330,1.25,2),
                                          ('Engine',hot_area*.9*SIGMA*1500**4,1500,1,3)]:
        area = heat/(.9*SIGMA*temp**4)*area_factor
        loops.append(dict(name=name,heat_W=heat,temperature_K=temp,area_factor=area_factor,
                          emitting_area_m2=area,two_sided_panel_area_m2=area/2,
                          kg_per_emitting_m2=areal,mass_kg=area*areal))
    return dict(electrical_load_allocations_W=loads,conversion_efficiency=.4,loops=loops,
                convention='Area counts emitting faces. Specific masses cover panel/heat-pipe/coolant/deployment allocation; primary source areal conventions must be reconciled. No bare-panel figure treated as complete installed hardware.',
                status='Loads and installed specific masses are targets. Cold cryogenic lifts, planetary view factors and engine/shield heat remain unclosed.')


def build_target():
    previous = build_trade()
    cfg = json.loads((ROOT/'data/mission_config.json').read_text())
    margin_fraction = cfg['design_to_hardware_margin_fraction']
    food,relay,thermal = food_factory(),relay_chain(margin_fraction),thermal_budget()
    allocations = dict(habframes=5000,bearings=5000,structure=5000,landing=6000,
                       refuge=4500,eclss=8000,medical=9500,power=4500,avionics=750,
                       factory=12000,rover=2500,spares=3000,processtanks=1500,
                       foodfactory=sum(food['hardware_allocation_kg'].values()),
                       flightstructure=8000,cruiseengine=25000,bulkcontainment=38000,
                       separation=1500,spinbooms=3000,transfertunnels=1500,
                       surfacekit=3000,engine=8000,containment=1500,furnishings=2000,
                       water=food['assumed_water_inventory_kg'])
    allocations['warmradiators'] = sum(r['mass_kg'] for r in thermal['loops'] if r['name']!='Engine')
    allocations['hotradiators'] = next(r['mass_kg'] for r in thermal['loops'] if r['name']=='Engine')
    rows = []
    for item in previous['items']:
        if item['id']=='margin':
            continue
        row = copy.deepcopy(item)
        row['previous_kg'] = row['target_kg']
        row['target_kg'] = allocations.get(row['id'],row['target_kg'])
        if row['id'] in allocations:
            row['basis'] = '300 t design-to allocation; see MISSION_300_TRADE.md. Not a validated minimum or proven hardware estimate.'
        rows.append(row)
    rows.append(dict(id='relaychain',item='200-node relay dry hardware and dispenser',kind='hardware',
                     baseline_kg=0,previous_kg=0,target_kg=relay['dry_hardware_kg'],
                     basis='Independent 100 kg all-up cap includes braking fuel and allowance; optical/power/containment feasibility unclosed.'))
    raw = sum(r['target_kg'] for r in rows if r['kind']=='hardware')
    rows.append(dict(id='margin',item=f'Hardware development allowance ({margin_fraction:.0%})',kind='allowance',
                     baseline_kg=next(r['baseline_kg'] for r in previous['items'] if r['id']=='margin'),
                     previous_kg=next(r['target_kg'] for r in previous['items'] if r['id']=='margin'),
                     target_kg=margin_fraction*raw,basis='Planning reserve on system hardware; scout payload remains fixed. Lower reserve is not a physical saving.'))
    dry = sum(r['target_kg'] for r in rows if r['kind'] in ['hardware','allowance','payload'])
    supplies_people = sum(r['target_kg'] for r in rows if r['kind'] not in ['hardware','allowance','payload'])
    payload = sum(r['target_kg'] for r in rows if r['kind']=='payload')
    margin_cases = [dict(margin_fraction=f,dry_mass_kg=raw*(1+f)+payload,
                         dry_if_engine_and_containment_cut_to_20t_each_kg=(raw-23000)*(1+f)+payload)
                    for f in [.25,.2,.15,.1]]
    occupancy = cfg['flight_occupancy']
    return dict(status='300 t cap allocation, not a demonstrated feasible 300 t spacecraft.',
                occupancy=dict(occupancy,crew=32,transit_torpid=24),
                food=food,relay_chain=relay,thermal=thermal,items=rows,
                raw_system_hardware_kg=raw,hardware_margin_fraction=margin_fraction,
                margin_comparison=margin_cases,dry_mass_kg=dry,dry_mass_cap_kg=300000,
                unallocated_headroom_kg=300000-dry,nonfuel_supplies_and_people_kg=supplies_people,
                total_without_fuels_kg=dry+supplies_people,
                dry_if_25_percent_allowance_kg=raw*1.25+payload,
                spares_breakdown_kg=dict(suits_and_support=600,tools=400,critical_mechanical_spares=700,
                                         repair_feedstock=1000,hoses_seals_thermal_repairs=300),
                avionics_breakdown_kg=dict(flight_computers=36,star_trackers=8,inertial_units=20,
                                           navigation_cameras=16,docking_lidar=20,optical_terminals=70,
                                           local_backup_radios=40,controllers=120,harness=150,
                                           displays_instrumentation=100,electronic_spares=70,
                                           enclosures_fault_isolation_EMI=100))


if __name__ == '__main__':
    result = build_target()
    (ROOT/'reports/mission-300-trade.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    output = io.StringIO(newline='')
    writer = csv.writer(output)
    writer.writerow(['id','item','previous_kg','target_kg','change_kg','basis'])
    for row in result['items']:
        writer.writerow([row['id'],row['item'],row['previous_kg'],row['target_kg'],row['previous_kg']-row['target_kg'],row['basis']])
    (ROOT/'reports/mission-300-ledger.csv').write_text(output.getvalue(),encoding='utf-8')
    print({key:result[key] for key in ['dry_mass_kg','unallocated_headroom_kg','total_without_fuels_kg','dry_if_25_percent_allowance_kg']})
