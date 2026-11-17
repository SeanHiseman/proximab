"""Ideal propulsion comparisons at equal speed and post-braking mass.

No vehicle or infrastructure mass closure. Instantaneous burns are speed/fuel
benchmarks, not a finite-power 20-year trajectory. Effective fusion exhaust
speeds are sensitivity assumptions, not achieved engine performance.
"""
import json
import math
from calculations.family_fleet_trade import ROOT, C, exhaust


def antimatter_case(beta, burns, retained_t=100, efficiency=.5):
    best = None
    for i in range(100,9999):
        u = i/10000
        e = exhaust(u,efficiency)
        ratio = math.exp(burns*math.atanh(beta)/e['effective'])
        lost = retained_t*(ratio-1)
        am = lost*e['annihilated_fraction']/2
        if best is None or am < best['antimatter_t']:
            best = dict(antimatter_t=am,ordinary_annihilation_reactant_t=am,
                reaction_mass_t=lost*e['reaction_fraction'],initial_t=retained_t*ratio,
                retained_t=retained_t,exhaust_c=u,efficiency=efficiency)
    return best


def photon_launch_energy(mass_t,beta):
    # Perfect reflecting receding sail; energy of photons actually intercepted.
    return .5*mass_t*1000*C*C*math.expm1(math.atanh(beta))


def build_trade():
    rows=[]
    for years in [15,20,25,30,40]:
        beta=4.24/years
        onboard=antimatter_case(beta,2)
        hybrid=antimatter_case(beta,1)
        hybrid['ideal_intercepted_launch_beam_J']=photon_launch_energy(hybrid['initial_t'],beta)
        fusion=[]
        for u in [.03,.05,.08]:
            fusion.append(dict(effective_exhaust_c=u,
                full_rocket_mass_ratio=math.exp(2*math.atanh(beta)/u),
                external_launch_braking_mass_ratio=math.exp(math.atanh(beta)/u)))
        rows.append(dict(years=years,minimum_cruise_c=beta,onboard=onboard,hybrid=hybrid,fusion=fusion))
    beta=4.24/20
    return dict(status=__doc__,normalization_retained_t=100,cases=rows,
        onboard_20y_efficiency_cases=[antimatter_case(beta,2,efficiency=e) for e in [.3,.5,.8,1]],
        recommendation='External launch plus onboard antimatter reaction-mass braking: leading study candidate, not a proven minimum',
        complete_ship_mass_t=None,complete_fleet_antimatter_t=None,
        limitations=['Finite burns increase required peak speed for fixed arrival time',
            'No sail, beam source, pointing, radiator, containment or shielding mass closure',
            'Photon energy assumes perfect interception and reflection; source electricity is higher',
            'Fusion ignition/antimatter catalyst requirements not specified; no numeric catalyst budget',
            'Magnetic sail braking not credited within the 20-year crew schedule'])


if __name__=='__main__':
    r=build_trade()
    (ROOT/'reports/propulsion-architecture-trade.json').write_text(json.dumps(r,indent=2)+'\n')
    for row in r['cases']:
        print(row['years'],row['onboard']['antimatter_t'],row['hybrid']['antimatter_t'],row['hybrid']['ideal_intercepted_launch_beam_J'])
