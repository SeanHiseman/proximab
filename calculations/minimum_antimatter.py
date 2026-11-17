"""Minimize AM, not fusion energy, with a bounded main reaction-feed inventory."""
import json
import math

from scipy.optimize import differential_evolution

from calculations.fleet_fuel_mix import ROOT, mix, solve, optimize
from calculations.onboard_energy_trade import Q, IGNITION_GAIN


def minimum(core, years, feed_limit, mode='hybrid', seed=7):
    bounds=[(.2,years/2-.01)]
    if mode=='electric_first':
        bounds += [(math.log10(Q/IGNITION_GAIN),2)]
    else:
        lower=math.log10(Q/IGNITION_GAIN) if mode=='hybrid' else -10
        bounds += [(lower,2)]*2
        if mode=='mixed':
            bounds += [(0,1)]*2

    def evaluate(x):
        if mode=='electric_first':
            pair=[mix(1,0),mix(1,10**x[1])]
        else:
            fractions=x[3:5] if mode=='mixed' else [1,1]
            pair=[mix(f,10**a) for f,a in zip(fractions,x[1:3])]
        r=solve(core,years,x[0],*pair)
        if r:
            r.update(mode=mode,parameters=list(x),feed_limit_t=feed_limit)
        return r

    def objective(x):
        r=evaluate(x)
        if r is None:return 1e30
        excess=r['fusion_t']+r['inert_reaction_mass_t']-feed_limit
        return 1e6+excess if excess>0 else r['antimatter_t']

    fit=differential_evolution(objective,bounds,seed=seed,popsize=18,
                               maxiter=350,tol=1e-9,polish=True)
    r=evaluate(fit.x)
    if r is None or r['fusion_t']+r['inert_reaction_mass_t']>feed_limit+1e-5:
        return None
    return r


def build():
    s=json.loads((ROOT/'reports/lean-landing-plan.json').read_text())
    results=[]
    for cap in [10000,20000,30000,50000,100000]:
        candidates=[]
        for mode in ['hybrid','mixed','electric_first']:
            for seed in ([7,23,101] if cap==100000 else [7]):
                r=minimum(s['ships']['crew']['ledger']['nonpropulsion_core_t'],19.9,cap,mode,seed)
                if r:candidates.append(r)
        selected=min(candidates,key=lambda r:r['antimatter_t'])
        results.append(dict(feed_limit_t=cap,selected=selected,candidates=candidates))
        print(cap,{k:selected[k] for k in ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t']},flush=True)
    cargo=optimize(s['ships']['cargo']['ledger']['nonpropulsion_core_t'],39.9,'fusion')
    return dict(objective='Minimize antimatter with fusion plus inert main feed capped; matching ordinary annihilation reactant tracked separately',
        crew=results,cargo=cargo,hardware_allowance=.1,main_reserve=0,
        status='Conditional numerical minimum in existing S6 engine/tank architecture, not a physical universal minimum; capture and radiation remain unresolved')


if __name__=='__main__':
    r=build()
    (ROOT/'reports/minimum-antimatter.json').write_text(json.dumps(r,indent=2)+'\n')
