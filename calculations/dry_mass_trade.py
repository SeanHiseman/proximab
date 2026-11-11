"""Aggressive dry-mass trade; no selected configuration or propellant changes."""
import copy
import csv
import io
import json
import math
from pathlib import Path

from calculations.engine_reuse_options import evaluate_reuse
from calculations.selected_mass_budget import build_selected

ROOT = Path(__file__).resolve().parent.parent


def box_shield_mass(dimensions, thickness, density=1000):
    """Complete external rectangular shell, including edge/corner growth."""
    inner = math.prod(dimensions)
    outer = math.prod(d+2*thickness for d in dimensions)
    return (outer-inner)*density


def build_trade():
    selected = build_selected()
    original = [copy.deepcopy(r) for r in selected['components'] if r['kind'] != 'derived']
    nominal = evaluate_reuse(original)
    # Hold propulsion hardware/cooling/tanks at their current allowances. This
    # isolates dry-mass changes without resizing fuel or claiming thermal closure.
    original.extend([
        dict(id='hotradiators', system='Direct-engine hot radiators', kind='hardware', mass_kg=nominal['engine_hot_radiator_kg']),
        dict(id='hydrogentank', system='Touchdown hydrogen tank hardware', kind='hardware', mass_kg=.12*nominal['thermal_hydrogen_kg']),
    ])
    count, radius, cylinder = 2, 3.2, 18
    area = count*(2*math.pi*radius*cylinder+4*math.pi*radius**2)
    volume = count*(math.pi*radius**2*cylinder+4*math.pi*radius**3/3)
    gross_floor = count*cylinder*(3+4)
    geometry = dict(pod_count=count, pod_radius_m=radius, cylindrical_length_m=cylinder,
                    total_capsule_length_m=cylinder+2*radius, spin_centre_radius_m=16.3,
                    maximum_outer_radius_m=19.5, pressure_area_m2=area,
                    pressure_volume_m3=volume, gross_floor_area_m2=gross_floor,
                    assumed_net_floor_area_m2=.8*gross_floor,
                    floor_radius_range_m=[15.8,18.3], gravity_reference_radius_m=17.5,
                    spin_rpm_at_half_g_reference=math.sqrt(.5*9.80665/17.5)*60/(2*math.pi))
    programme = {
        '32 berths in two-tier racks, including their equipment footprint': 40,
        'Galley, dining and flexible common rooms': 24,
        'Exercise and rehabilitation': 12,
        'Medical and recovery working space': 12,
        'Hygiene': 8,
        'Control, communications and clean work bench': 8,
        'Life-support and electrical service bays': 22,
        'Two airlocks and suit service': 12,
        'Accessible stores': 12,
        'Circulation and berth transfer access': 28,
    }
    # Every number below is a planning target, not an as-built equipment estimate.
    targets = {
        'membranes': (area*6, 'Vectran/aramid restraint, redundant gas liners, insulation and local impact layers; retain 6 kg/m2 assumption.'),
        'floors': (gross_floor*8, 'CFRP sandwich panels, local metal inserts; 8 kg/m2 target needs load/fire/repair qualification.'),
        'habframes': (8000, 'Two small pods, partitions, hatches and deployable supports; exclude separately counted spin booms/tunnels.'),
        'bearings': (6000, 'One balanced two-pod rotor; duplicated drive/control, common bearing failure loses spin, not pressure isolation.'),
        'furnishings': (3000, 'No permanent private cabins; convertible berth privacy screens, shared folding galley/common fittings.'),
        'structure': (8000, 'Compact retained delivery frame; CFRP members, local titanium/metal joints; load model outstanding.'),
        'landing': (10000, 'Smaller stowed payload and common restraints; stretch target, not sized landing gear.'),
        'refuge': (6000, 'Compact two-tier 32-place rigid burn/descent refuge; medical and restraint interfaces need layout.'),
        'eclss': (10000, 'Two compact independent process trains and modular racks; retain full 32-person metabolic throughput.'),
        'medical': (11000, '32 medical/ordinary berths at 200 kg each plus 4.6 t common clinical/torpor equipment; stretch target.'),
        'avionics': (2500, 'Shared modular electronics with independent survival controls; antenna/link budget outstanding.'),
        'factory': (15000, 'Minimum resource-processing, machining, polymer and repair starter; local expansion capability must be demonstrated.'),
        'rover': (3500, 'Shorter-range two-seat rover, small pressure cabin and removable tools; independent emergency systems retained.'),
        'spares': (10000, 'Standardised repair stock/tools/suits; failure-rate and shelf-life audit required.'),
        'gas': (2000, 'About 1.3 t initial fill for pods/factory/refuge/tunnels plus about 0.7 t deployment/makeup reserve.'),
        'water': (3000, '100% recovery assumed: working fluid only, no annual loss reserve; distributed clean/process/medical inventories.'),
        'consumables': (8000, 'Specialist medicines, hygiene and process chemicals; stretch target, not assumed 100% chemical recycling.'),
        'processtanks': (2000, 'Small distributed water cells and lined composite gas bottles; no duplicate water or shield mass.'),
        'flightstructure': (12000, 'Compact cruise support truss, but no reduction of a required radiation standoff is established.'),
        'radiationshield': (40000, 'Replace the old 11.16 t refuge allowance with 40 t total modular polyethylene provision for two berth shelters; no qualified GCR or engine-dose result.'),
    }
    labels = {
        'crew': '32 crew and personal effects',
        'power': '2 MWe conversion, distribution and backup allowance',
        'engine': 'Hydrogen-heated touchdown assembly',
        'containment': 'Touchdown antimatter isolation hardware',
        'radiationshield': 'Total modular polyethylene berth/shelter shielding provision',
    }
    rows = []
    for r in original:
        if r['id'] == 'powerfuel':
            continue
        target, basis = targets.get(r['id'], (r['mass_kg'], 'Current allowance held; no additional reduction claimed.'))
        rows.append(dict(id=r['id'], item=labels.get(r['id'],r['system']), kind=r['kind'],
                         baseline_kg=r['mass_kg'], target_kg=target, basis=basis))
    for key, name, mass, basis in [
        ('spinbooms', 'Spin booms and pod balance attachments', 4000, 'CFRP/tension structure; separate from main ship frame.'),
        ('transfertunnels', 'Pressurised transfer tunnels and flexible interfaces', 2000, 'Rounded fabric tunnels and isolation hatches; medical transfer clearance requires checking.'),
        ('surfacekit', 'Packed surface expansion starter', 4000, 'Approximately 60-80 m2 initial expansion target; envelope, floors, connectors and deployment hardware, not full settlement.'),
    ]:
        rows.append(dict(id=key,item=name,kind='hardware',baseline_kg=0,target_kg=mass,basis=basis))
    base_hardware = sum(r['baseline_kg'] for r in rows if r['kind']=='hardware')
    target_hardware = sum(r['target_kg'] for r in rows if r['kind']=='hardware')
    rows.append(dict(id='margin',item='Hardware development allowance (25%)',kind='allowance',
                     baseline_kg=.25*base_hardware,target_kg=.25*target_hardware,
                     basis='Budget allowance, not installed radiation shielding or proof against omitted equipment.'))
    totals = {}
    for field in ['baseline_kg','target_kg']:
        dry = sum(r[field] for r in rows if r['kind'] in ['hardware','allowance','payload'])
        supplies = sum(r[field] for r in rows if r['kind'] not in ['hardware','allowance','crew','payload'])
        crew = sum(r[field] for r in rows if r['kind']=='crew')
        totals[field] = dict(dry_hardware_including_allowance_kg=dry, supplies_kg=supplies,
                             crew_kg=crew, total_without_fuels_kg=dry+supplies+crew)
    payload = sum(r['baseline_kg'] for r in rows if r['kind']=='payload')
    assert abs(totals['baseline_kg']['dry_hardware_including_allowance_kg']-nominal['hardware_with_margin_kg']-payload)<1e-6
    shelter_dimensions = [4,4.8,2.6]
    shelter_area = 2*2*sum(shelter_dimensions[i]*shelter_dimensions[j] for i,j in [(0,1),(0,2),(1,2)])
    shield_cases = []
    for column in [20,40,100]:
        thickness = column/100 # water: 1 g/cm2 = 1 cm depth
        shield_cases.append(dict(column_g_cm2=column,water_thickness_m=thickness,
                                 thin_shell_water_kg=shelter_area*column*10,
                                 full_shell_water_kg=2*box_shield_mass(shelter_dimensions,thickness)))
    return dict(status='Unselected stretch targets; 100% water recovery as instructed; GCR/engine protection not closed.',
                boundary='All hardware including empty propulsion tanks, plus separate people/stocks. All fuel excluded; no propellant resizing.',
                geometry=geometry, area_programme_m2=programme, items=rows, totals=totals,
                water_inventory_kg=dict(potable_hygiene=800, food_process=800, medical=600, recovery_and_thermal_loops=800),
                shielding=dict(two_shelters_inner_dimensions_m=shelter_dimensions,total_inner_surface_m2=shelter_area,
                               cases=shield_cases, credited_existing_mass_kg=3000,
                               water_credit_status='Upper bound if all water remains in shield cells; working water in pipes/processors reduces local coverage.',
                               dedicated_polyethylene_provision_kg=40000,
                               whole_pod_thin_shell_20g_cm2_kg=area*200))


if __name__ == '__main__':
    trade = build_trade()
    (ROOT/'reports/dry-mass-trade.json').write_text(json.dumps(trade,indent=2)+'\n',encoding='utf-8')
    output = io.StringIO(newline='')
    writer = csv.writer(output)
    writer.writerow(['id','item','kind','baseline_kg','target_kg','saving_kg','basis'])
    for r in trade['items']:
        writer.writerow([r['id'],r['item'],r['kind'],r['baseline_kg'],r['target_kg'],r['baseline_kg']-r['target_kg'],r['basis']])
    (ROOT/'reports/dry-mass-trade.csv').write_text(output.getvalue(),encoding='utf-8')
    print(json.dumps(trade['totals'],indent=2))
