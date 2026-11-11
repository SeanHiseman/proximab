"""Conditional continuous-braking switches; no acceptable plume cutoff established."""
import json
from pathlib import Path
from calculations.mission_calculations import continuous_terminal_sensitivity
from calculations.selected_mass_budget import build_selected,evaluate

def build_landing_options():
    selected=build_selected();rows=[r for r in selected['components'] if r['kind']!='derived']
    terminal=continuous_terminal_sensitivity();cases=[]
    for height,dv in [(10,1.025),(5,.8),(1,.4)]:
        ideal=next(c for c in terminal['switch_cases'] if c['height_km']==height)
        mass=evaluate(rows,reserve_delta_v_km_s=100,electrical_power_MWe=2,thermal_delta_v_km_s=dv)
        cases.append(dict(mass,switch_height_km=height,thermal_delta_v_km_s_budget=dv,ideal_terminal=ideal))
    return {'status':'Conditional vertical terminal options. Switch height is not radiation/plume approved. Flight-only hardware remains in orbit in every case. No integrated orbital/terrain approach.',
            'mass_definition':'Final retained mass is after touchdown. Mass at hydrogen ignition also includes hydrogen and its heater reactants.',
            'terminal_model':terminal,'cases':cases}

if __name__=='__main__':
    result=build_landing_options()
    (Path(__file__).resolve().parent.parent / 'reports/landing-mass-options.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
    print([(c['switch_height_km'],round(c['final_retained_mass_kg']/1000,2),round(c['thermal_hydrogen_kg']/1000,2),round(c['departure_mass_kg']/1000,2)) for c in result['cases']])
