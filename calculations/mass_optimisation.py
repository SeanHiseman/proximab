"""Controlled reductions against the current mass ledger; alternatives, not a new baseline."""
import copy
import json
import math
from pathlib import Path
from calculations.mass_budget import build_budget
from calculations.mission_calculations import G, trajectory

ROOT = Path(__file__).resolve().parent.parent

def solve(rows, reference):
    hardware = sum(r['mass_kg'] for r in rows if r['kind'] == 'hardware')
    stocks = sum(r['mass_kg'] for r in rows if r['kind'] != 'hardware')
    margin = reference['hardware_margin_fraction']
    coefficients = [reference[k] for k in ('thermal_mass_feedback_coefficient', 'hydrogen_tank_mass_feedback_coefficient', 'direct_reserve_mass_feedback_coefficient')]
    retained = (hardware * (1 + margin) + stocks) / (1 - sum(coefficients))
    factor = retained / reference['final_retained_mass_kg']
    result = {k: reference[k] * factor for k in ('final_retained_mass_kg', 'departure_mass_kg', 'thermal_hydrogen_kg', 'propulsion_antimatter_loaded_kg', 'propulsion_matching_matter_loaded_kg', 'retained_direct_propellant_reserve_kg', 'hydrogen_tank_kg', 'engine_hot_radiator_kg', 'initial_thrust_MN', 'initial_annihilation_power_PW', 'engine_radiator_emitting_area_m2')}
    hardware_total = hardware + result['hydrogen_tank_kg'] + result['engine_hot_radiator_kg']
    result.update({'hardware_before_margin_kg': hardware_total, 'hardware_margin_kg': hardware_total * margin, 'stocks_people_kg': stocks, 'hardware_with_margin_kg': hardware_total * (1 + margin), 'components_before_derived': copy.deepcopy(rows)})
    assert abs(result['final_retained_mass_kg'] - hardware_total*(1+margin) - stocks - result['retained_direct_propellant_reserve_kg']) < 1e-6
    return result

def build_optimisation():
    original = build_budget()
    reference = original['nominal']
    base = [copy.deepcopy(r) for r in original['components'] if r['kind'] != 'derived']
    results = []
    def record(name, rows, changes, speculative=False):
        result = solve(rows, reference)
        result.update({'name': name, 'changes': changes, 'speculative': speculative})
        results.append(result)
        return result
    record('Current 30 m discs', base, ['Reproduces the current baseline; not an independently validated design.'])
    radius, depth, floors = 20, 4.5, [18,14,10,6]
    area = 2*(2*math.pi*radius**2 + 2*math.pi*radius*depth)
    volume = 2*math.pi*radius**2*depth
    floor = 2*2*math.pi*sum(floors)*3
    def compact(rows):
        rows = copy.deepcopy(rows)
        byid = {r['id']: r for r in rows}
        byid['membranes']['mass_kg'] *= area/original['geometry']['full_disc_pressure_area_m2']
        byid['floors']['mass_kg'] *= floor/original['geometry']['gross_floor_area_m2']
        # Radiator height remains 44 m, so the shield cannot simply shrink to 40 m.
        byid['dustshield']['mass_kg'] *= (46*20)/(66*20)
        old_gas = 70_000*original['geometry']['full_disc_gross_pressure_volume_m3']/(287.05*293.15)
        byid['gas']['mass_kg'] = 70_000*volume/(287.05*293.15) + (byid['gas']['mass_kg']-old_gas)
        return rows
    rows = compact(base)
    record('20 m discs; same equipment assumptions', rows, ['Four decks per disc; membrane, floors and fill gas scale with geometry.', '46 x 20 m shield retains clearance over the 44 m radiator height.', 'Hub, frame, machinery, medical and room-fitting allowances held unchanged.'])
    def bootstrap(rows):
        rows = copy.deepcopy(rows)
        byid = {r['id']: r for r in rows}
        byid['power']['mass_kg'] *= .3
        byid['warmradiators']['mass_kg'] *= .2
        return rows
    rows = bootstrap(rows)
    record('Compact plus 2 MWe surface bootstrap', rows, ['Carry 2 MWe rather than the complete 10 MWe surface plant.', 'Power-conversion mass reduced to 30%; service radiator area/mass to 20%.', 'Keep the factory starter and farm allocations; manufacture later power/cooling locally.', 'Assumes 2 MWe is enough to bootstrap that factory; no detailed load audit yet.'])
    def bulk_food(rows):
        rows = copy.deepcopy(rows)
        next(r for r in rows if r['id']=='food')['mass_kg'] = 36*16.5*365.25*(.617+.1)
        return rows
    rows = bulk_food(rows)
    record('Compact bootstrap plus bulk food packaging', rows, ['0.10 kg packaging/person/day instead of 0.26; dry food stays 0.617.', 'No torpor nutrition saving. Long shelf-life bulk packaging remains a target.'])
    light = [dict(r, mass_kg=r['low_kg']) for r in base]
    full_size_light = bulk_food(bootstrap(light))
    record('30 m discs with lightweight equipment targets', full_size_light, ['Retain both existing 30 m discs; use prior low equipment/material targets, 2 MWe bootstrap and bulk food.', 'Keep baseline margin, fuel reserve and hot-engine thermal assumptions.'], True)
    flight_farm = copy.deepcopy(full_size_light)
    food_row = next(r for r in flight_farm if r['id']=='food')
    food_row['mass_kg'] = 36*2*365.25*(.617+.1)
    flight_farm.append({'id':'flightfarm_startup','system':'Cruise hydroponic conversion and startup stock','kind':'hardware','mass_kg':15_000,'basis':'Additional 15 t allowance; existing farm hardware already counted. No carried surface regolith.'})
    record('30 m lightweight discs plus cruise food production', flight_farm, ['Operate the carried 2,000 m2 crop hardware in cruise, repurposing inner stores into crop rooms.', 'Replace 16.5 years of stored food with a two-year full-crew reserve and add 15 t hydroponic/startup hardware.', 'Three-tier crop footprint including 25% access is at least 833 m2; actual crop/maintenance footprint may be larger.', 'Assumes a complete reliable diet, nutrient recovery, pollination and disease control; these are not demonstrated by crop-area arithmetic.', 'Uses the full-size discs. The smaller-disc proposal has not fitted this farm alongside the accommodation.'], True)
    light = compact(full_size_light)
    record('Aggressive lightweight equipment targets', light, ['Use prior low hardware allocations, plus compact/2 MWe/bulk-food changes.', 'Keep baseline 25% hardware margin, 5% direct-fuel reserve, 0.5c exhaust and 1e-7 engine heat interception.', 'Engine and containment allowances are optimistic targets, not mass predictions.'], True)
    nutrition = copy.deepcopy(light)
    awake = trajectory(16)['awake_years_if_all_awake_during_burns']
    effective_years = awake + .2*(16-awake) + .5
    next(r for r in nutrition if r['id']=='food')['mass_kg'] *= effective_years/16.5
    record('Additional hypothetical 20% torpor nutrition', nutrition, ['Torpor food demand assumed 20% of awake demand; normal nutrition during burns and commissioning.', 'Packaging scales with food. Clinical feed delivery and sterile consumables are not redesigned.', 'No demonstrated safe human 21-day torpor regimen establishes this saving.'], True)
    programme = {'private_cabins':108, 'dining_galley':40, 'lounge_quiet_arts_telepresence':60, 'exercise_rehabilitation':40, 'clinical':24, 'science_control_training_workshop':55, 'hygiene':20, 'plant_stores':140, 'circulation_egress':100}
    assert sum(programme.values()) <= floor*.65/2
    ratio = reference['departure_mass_kg']/reference['final_retained_mass_kg']
    return {'status':'Historical alternatives against frozen 30 m reference; the selected compact design is calculated separately.', 'iss_comparison':{'mass_kg':419725, 'pressurised_volume_m3':1005, 'habitable_volume_m3':388, 'source':'https://www.nasa.gov/international-space-station/space-station-facts-and-figures/'}, 'compact_geometry':{'disc_count':2,'disc_radius_m':radius,'axial_depth_m':depth,'floor_radii_m':floors,'gross_floor_area_m2':floor,'net_floor_area_m2_assumed':floor*.65,'gross_pressurised_volume_m3':volume,'pressure_area_m2':area,'outer_floor_gravity_g':.5,'spin_rpm':math.sqrt(.5*G/floors[0])*60/(2*math.pi),'area_allocations_per_disc_m2':programme,'all_awake_occupants_per_disc':18}, 'scenarios':results, '500_t_departure_constraint':{'maximum_retained_kg_at_same_propulsion_assumptions':500_000/ratio,'bulk_full_metabolism_food_alone_kg':36*16.5*365.25*(.617+.1)}, 'limits':['Comparison of whole-ISS mass to only habitat fabric is not an equivalent comparison.','ISS receives frequent cargo and external operational support; this mission carries its supplies, propulsion and settlement seed.','A cruise farm could reduce stocks, but it requires a complete diet, nutrient accounting, maintenance access and failure reserves.','An inflatable envelope saves structural and packaging mass; floors, pressure-restraint loads, radiation protection, machinery and supplies remain.','A broad flat disc needs pressure ties or compartmentalisation; thin fabric alone cannot carry the pressure loads.','About 5 rpm at the compact outer floor requires adaptation studies, especially with repeated torpor recovery.','No calculation here demonstrates a tonnes-scale antimatter bank or establishes an achievable dry mass.','500 t departure is not interchangeable with 500 t retained or 500 t hardware.']}

if __name__ == '__main__':
    result = build_optimisation()
    (ROOT/'reports/mass-optimisation.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    for r in result['scenarios']:
        print(r['name'], {k:round(r[k]/1000,1) for k in ['hardware_with_margin_kg','final_retained_mass_kg','departure_mass_kg','propulsion_antimatter_loaded_kg','thermal_hydrogen_kg']})
