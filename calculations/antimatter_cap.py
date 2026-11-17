"""Ten-tonne fleet AM trade; frozen S3 core, not a long-duration qualification."""
import json
import math

from calculations.family_fleet_trade import ROOT, trajectory
from calculations.onboard_energy_trade import Q
from calculations.fuel_substitution import optimise_endpoint
from calculations.staged_baseline import evaluate

MIN_SPEED = math.sqrt(1-1/(1+.8*Q/(1-Q))**2)+1e-10


def search(s, years, objective='loaded_antimatter_t', penalty=0):
    best = None
    minimum_speed=math.sqrt(1-1/(1+s['fusion_coupling']*Q/(1-Q))**2)+1e-10
    def score(r):
        return r[objective]+penalty*r['loaded_antimatter_t']
    def consider(b,u,v):
        nonlocal best
        if not 0 < b < years/2 or not minimum_speed <= min(u,v) or max(u,v)>=.95:
            return
        r=evaluate(b,u,v,s,years)
        if r and (best is None or score(r)<score(best)):
            best=r
    speeds=[minimum_speed]+[.08+i*.02 for i in range(32)]
    for b in [.25,.5,.75,1,1.25,1.5,2,2.5,3,4,5,7,9]:
        for u in speeds:
            for v in speeds:
                consider(b,u,v)
    for delta,bd in [(.01,.25),(.0025,.1),(.0005,.025)]:
        b=best['trajectory']['burn_years']
        u,v=[p['exhaust_c'] for p in best['phases']]
        for i in range(-3,4):
            for j in range(-3,4):
                for k in range(-2,3):
                    consider(b+k*bd,max(minimum_speed,u+i*delta),max(minimum_speed,v+j*delta))
    return best


def compact(r):
    return dict(departure_t=r['departure_t'],fusion_t=r['loaded_fusion_t'],
        antimatter_t=r['loaded_antimatter_t'],primary_ZJ=r['primary_energy_loaded_fuel_ZJ'],
        proper_years=r['trajectory']['proper_years']+.1,beta=r['trajectory']['beta'],
        burn_years=r['trajectory']['burn_years'],exhaust_c=[p['exhaust_c'] for p in r['phases']])


def fleet(baseline, years, objective, penalty=0):
    ships={k:compact(search(baseline[k]['coefficients'],years+lead-.1,objective,penalty))
        for k,lead in [('crew',0),('cargo',20)]}
    for k,lead in [('crew',0),('cargo',20)]:
        pure=optimise_endpoint('fusion',baseline[k]['coefficients'],years+lead-.1)
        key='antimatter_t' if objective=='loaded_antimatter_t' else 'primary_ZJ'
        if pure and pure[key]+penalty*pure['antimatter_t'] < ships[k][key]+penalty*ships[k]['antimatter_t']:
            tr=trajectory(years+lead-.1,pure['burn_years'])
            ships[k]=dict(pure,proper_years=tr['proper_years']+.1,beta=tr['beta'])
    return dict(crew_years=years,cargo_years=years+20,ships=ships,
        totals={key:sum(s[key] for s in ships.values())
            for key in ['departure_t','fusion_t','antimatter_t','primary_ZJ']})


def constrained(baseline, years, cap=10):
    objective='primary_energy_loaded_fuel_ZJ'
    r=fleet(baseline,years,objective)
    if r['totals']['antimatter_t']<=cap:
        return r
    if fleet(baseline,years,'loaded_antimatter_t')['totals']['antimatter_t']>cap:
        return None
    lo,hi=0,1
    best=fleet(baseline,years,objective,hi)
    while best['totals']['antimatter_t']>cap:
        hi*=2
        best=fleet(baseline,years,objective,hi)
    for _ in range(8):
        mid=(lo+hi)/2
        r=fleet(baseline,years,objective,mid)
        if r['totals']['antimatter_t']<=cap:
            best=r;hi=mid
        else:
            lo=mid
    return best


def build_trade():
    baseline=json.loads((ROOT/'reports/integrated-specification.json').read_text())
    cases=[]
    for years in [20,25,30,35,40]:
        cases.append(dict(years=years,minimum_AM=fleet(baseline,years,'loaded_antimatter_t'),
            minimum_energy=fleet(baseline,years,'primary_energy_loaded_fuel_ZJ')))
    return dict(baseline_revision=baseline['revision'],fleet_cap_t=10,
        scope='Same S3 core and optimistic coefficients at every duration; longer-life supplies, reliability and radiation changes not sized. Grid/local minima, not a global optimum.',cases=cases)


if __name__=='__main__':
    r=build_trade()
    (ROOT/'reports/antimatter-cap.json').write_text(json.dumps(r,indent=2)+'\n')
    for case in r['cases']:
        print(case['years'],{k:v['totals'] for k,v in case.items() if k!='years'})
