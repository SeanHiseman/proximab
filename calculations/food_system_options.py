"""Food-factory and reserve sensitivities for the current 32-person design."""
import copy
import json
from pathlib import Path
from calculations.selected_mass_budget import build_selected,evaluate
ROOT=Path(__file__).resolve().parent.parent

def build_food_options():
    current=build_selected();results=[]
    rows=[r for r in current['components'] if r['kind']!='derived']
    for edible_kg in [1000,32*.5*365.25*.617]:
        for factory_kg in [10000,20000,30000]:
            candidate=copy.deepcopy(rows)
            next(r for r in candidate if r['id']=='food')['mass_kg']=edible_kg*1.02
            next(r for r in candidate if r['id']=='foodfactory')['mass_kg']=factory_kg
            mass=evaluate(candidate,reserve_delta_v_km_s=100,electrical_power_MWe=2)
            results.append(dict(mass,factory_hardware_target_kg=factory_kg,stored_edible_food_kg=edible_kg,stored_food_kg=edible_kg*1.02,full_crew_food_reserve_years=edible_kg/(32*.617*365.25)))
    edible_W=32*2500*4184/86400
    return {'status':'Current 32-person, 20-year mission; 10 t factory target and 1 t edible reserve selected. Complete-diet plant unvalidated.',
            'crew':32,'edible_food_energy_W':edible_W,'synthesis_power_W_at_5_to_15_percent_conversion':[edible_W/.15,edible_W/.05],
            'mass_target_scope':'Two complete-diet trains including pressure modules, sterile processing, protected culture banks and small garden. Shared power, cooling, water and 1 t process inventory counted separately.',
            'cases':results,'sources':[{'title':'Food in space from hydrogen-oxidizing bacteria','url':'https://www.sciencedirect.com/science/article/pii/S0094576520307438'},{'title':'Hybrid electrochemical-biological food production','url':'https://doi.org/10.1038/s43016-022-00530-x'},{'title':'Chemoenzymatic starch from carbon dioxide','url':'https://pubmed.ncbi.nlm.nih.gov/34554807/'},{'title':'ESA closed-loop life support','url':'https://www.esa.int/articles/life-support'}]}

if __name__=='__main__':
    (ROOT/'reports/food-system-options.json').write_text(json.dumps(build_food_options(),indent=2),encoding='utf-8')
