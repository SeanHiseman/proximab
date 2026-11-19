"""Adopt orbital reactor/water disposition; compare fixed-allocation and closed mass."""
import json
import math

from calculations.family_fleet_trade import ROOT
from calculations.integrated_specification import ledger
from calculations.depleted_staged_tanks import calculate,optimise,MIN_SPEED


def closed(u,v,stages=8,tanks=True,core_t=500,annihilation_coupling=.8,
           burn_years=1.25,transfer_years=19.9,electrical_fusion=False,thrust_fraction=1.):
    def run(m):
        return calculate(u,v,stages,tanks,m,burn_years,transfer_years,
            electrical_fusion,annihilation_coupling,thrust_fraction)
    z,o=run(0),run(1000)
    if z is None or o is None:return None
    coefficient=1.1*(1/(5e9*1000)+2.28e-5*5/(2*.9*5.670374419e-8*2000**4*1000))
    candidates=[]
    for a,b in zip(z['segments'],o['segments']):
        intercept=coefficient*a['source_W']
        slope=coefficient*(b['source_W']-a['source_W'])/1000
        if slope>=1:return None
        candidates.append((core_t+intercept)/(1-slope))
    r=run(max(candidates))
    assert math.isclose(r['retained_core_t'],core_t+r['engine_with_allowance_t']+r['hot_radiator_with_allowance_t'],rel_tol=1e-8)
    r['nonpropulsion_core_t']=core_t
    return r


def build_redesign():
    old=json.loads((ROOT/'data/integrated_specification.json').read_text())
    new=json.loads((ROOT/'data/arrival_redesign.json').read_text())
    before,after=ledger('crew',old),ledger('crew',new)
    saving=before['nonpropulsion_core_t']-after['nonpropulsion_core_t']
    fixed=optimise(20,core_t=500-saving)
    crew=optimise(20,core_t=after['nonpropulsion_core_t'],evaluator=closed)
    cargo_book=ledger('cargo',new)
    cargo=closed(MIN_SPEED,MIN_SPEED,core_t=cargo_book['nonpropulsion_core_t'],
        burn_years=.75,transfer_years=39.9,electrical_fusion=True)
    minimum=None
    for burn in [.5,.75,1,1.25,1.5,2,2.5,3,4,5]:
        for i in range(26):
            for j in range(40):
                r=closed(MIN_SPEED+i*.006,MIN_SPEED+j*.01,
                    core_t=after['nonpropulsion_core_t'],burn_years=burn)
                if r and (minimum is None or r['antimatter_t']<minimum['antimatter_t']):minimum=r
    for step,db in [(.002,.1),(.0005,.025)]:
        u,v=minimum['exhaust_c'];burn=minimum['trajectory']['burn_years']
        for i in range(-4,5):
            for j in range(-4,5):
                for k in range(-3,4):
                    r=closed(max(MIN_SPEED,u+i*step),max(MIN_SPEED,v+j*step),
                        core_t=after['nonpropulsion_core_t'],burn_years=burn+k*db)
                    if r and r['antimatter_t']<minimum['antimatter_t']:minimum=r
    return dict(revision=new['revision'],crew_ledger_before=before,crew_ledger_after=after,
        nonpropulsion_core_saving_t=saving,fixed_allocation_comparator=fixed,
        component_closed_crew=crew,component_closed_cargo=cargo,
        sampled_minimum_AM_component_closed_crew=minimum,
        component_closed_20t_candidate_found=minimum['antimatter_t']<=20,
        fixed_allocation_comparator_fleet={k:fixed[k]+cargo[k] for k in ['fusion_t','antimatter_t','departure_t','primary_ZJ']},
        main_fuel_reserve_fraction=0,chemical_landing_reserve_fraction=.1,
        fleet=({k:crew[k]+cargo[k] for k in ['fusion_t','antimatter_t','departure_t','primary_ZJ']} if crew else None),
        status='Orbital disposition adopted. Component closure includes engine/radiator feedback; 80% annihilation coupling and health/landing performance unverified. No structural saving credited.')


if __name__=='__main__':
    r=build_redesign()
    (ROOT/'reports/arrival-redesign.json').write_text(json.dumps(r,indent=2)+'\n')
    print('core saving',r['nonpropulsion_core_saving_t'])
    print('landing',r['crew_ledger_after']['landing'])
    for k in ['fixed_allocation_comparator','component_closed_crew','component_closed_cargo']:
        x=r[k]
        print(k,{key:x[key] for key in ['fusion_t','antimatter_t','departure_t','retained_core_t','engine_with_allowance_t','hot_radiator_with_allowance_t','exhaust_c']} if x else None)
    print('fleet',r['fleet'])
