"""Tank-closed hybrid trade, not a qualified complete spacecraft.

Two finite burns, independent mixture in each burn, retained tank baseline.
Optional jettison only of empty acceleration tanks/containment plus separation kit.
Energy excludes unpriced fuel acquisition, construction and ongoing storage power.
"""
import json
import math
from calculations.family_fleet_trade import ROOT, C, trajectory
from calculations.onboard_energy_trade import Q, FUSION_COUPLING, IGNITION_GAIN


def mixture(a=None,tank_fraction=.03,containment=1.,fusion_coupling=FUSION_COUPLING,annihilation_coupling=.5):
    if a is None:
        a=0.
        directed=Q*(fusion_coupling-1/(IGNITION_GAIN*.2*.4))
        kind='electrical'
    else:
        a=max(a,Q/IGNITION_GAIN)
        directed=Q*fusion_coupling+annihilation_coupling*(a-Q/IGNITION_GAIN)
        kind='hybrid'
    gamma=1+directed/(1-Q)
    w=(1-Q)*math.sqrt(gamma*gamma-1)/(1+a)
    # Ordinary fusion fuel and ordinary annihilation reactant have tank fraction t.
    # AM containment is an independent kg hardware / kg AM sensitivity.
    k=(tank_fraction*(1+a/2)+containment*a/2)/(1+a)
    return dict(kind=kind,annihilated_mass_per_fusion_mass=a,
        effective_exhaust_c=w,exhaust_c=math.sqrt(1-1/gamma**2),tank_per_spent=k,
        fusion_tank_per_spent=tank_fraction/(1+a),
        ordinary_reactant_tank_per_spent=tank_fraction*a/2/(1+a),
        containment_per_spent=containment*a/2/(1+a))


def solve(first,last,epsilon,beta,staged=False,base_t=300.,stage_kit_t=5.,arrival_floor_t=None):
    r1=math.exp(math.atanh(beta)/first['effective_exhaust_c'])
    r2=math.exp(math.atanh(beta)/last['effective_exhaust_c'])
    k1,k2=first['tank_per_spent'],last['tank_per_spent']
    s1,s2=r1-1,r2-1
    if staged:
        d1,d2=1-k1*s1,1-k2*s2
        if min(d1,d2)<=0:return None
        if arrival_floor_t is not None:base_t=max(base_t,arrival_floor_t*d2)
        final=base_t/d2
        p2=s2*final
        p1=s1*(r2*final+stage_kit_t)/d1
        discarded=k1*p1+stage_kit_t
        departure=r2*final+stage_kit_t+(1+k1)*p1
        feedback=max(k1*s1,k2*s2)
    else:
        feedback=k1*s1*r2+k2*s2
        if feedback>=1:return None
        if arrival_floor_t is not None:base_t=max(base_t,arrival_floor_t*(1-feedback))
        final=base_t/(1-feedback)
        p2=s2*final
        p1=s1*r2*final
        discarded=0.
        departure=r1*r2*final
    fusion=am=ordinary=0.
    phases=[]
    for m,p in [(first,p1),(last,p2)]:
        fuel=p/(1+m['annihilated_mass_per_fusion_mass'])
        anti=(p-fuel)/2
        fusion+=fuel;am+=anti;ordinary+=anti
        phases.append(dict(**m,spent_t=p,fusion_t=fuel,antimatter_t=anti,
            tank_hardware_t=p*m['tank_per_spent']))
    fusion_energy=fusion*1000*Q*C*C
    production=2*am*1000*C*C/epsilon
    return dict(staged=staged,base_t=base_t,departure_t=departure,arrival_t=final,
        fusion_t=fusion,antimatter_t=am,ordinary_annihilation_reactant_t=ordinary,
        retained_storage_t=final-base_t,discarded_t=discarded,
        all_storage_t=k1*p1+k2*p2,feedback=feedback,
        fusion_energy_ZJ=fusion_energy/1e21,manufacturing_ZJ=production/1e21,
        primary_energy_ZJ=(fusion_energy+production)/1e21,phases=phases)


def candidates(tank_fraction=.03,containment=1.,fusion_coupling=FUSION_COUPLING,n=110):
    # Both pure electrical fusion and ignition-only hybrid are explicit endpoints.
    amin=Q/IGNITION_GAIN
    values=[None]+[amin*math.exp(math.log(2/amin)*i/n) for i in range(n+1)]
    return [mixture(a,tank_fraction,containment,fusion_coupling) for a in values]


def optimise(epsilon,beta,tank_fraction=.03,containment=1.,staged=False,
             arrival_floor_t=None,fusion_coupling=FUSION_COUPLING):
    choices=candidates(tank_fraction,containment,fusion_coupling)
    best=None
    def search(left,right):
        nonlocal best
        for f in left:
            for l in right:
                r=solve(f,l,epsilon,beta,staged=staged,arrival_floor_t=arrival_floor_t)
                if r and (best is None or r['primary_energy_ZJ']<best['primary_energy_ZJ']):best=r
    search(choices,choices)
    if best:
        for span in [.15,.025]:
            grids=[]
            for phase in best['phases']:
                a=phase['annihilated_mass_per_fusion_mass']
                values=[None,Q/IGNITION_GAIN]+[max(Q/IGNITION_GAIN,a*math.exp(span*(i/8-1))) for i in range(17)]
                grids.append([mixture(v,tank_fraction,containment,fusion_coupling) for v in values])
            search(*grids)
    return best


def build_trade():
    tr=trajectory(19.9,1.)
    beta=tr['beta']
    main=[]
    for efficiency in [.01,.03,.1,.3,.5,.8,1.]:
        retained=optimise(efficiency,beta)
        staged=optimise(efficiency,beta,staged=True)
        matched=optimise(efficiency,beta,staged=True,arrival_floor_t=retained['arrival_t'])
        same_mixes=[mixture(p['annihilated_mass_per_fusion_mass'] if p['kind']=='hybrid' else None) for p in retained['phases']]
        same_mix_matched=solve(*same_mixes,efficiency,beta,staged=True,arrival_floor_t=retained['arrival_t'])
        for result in [retained,staged,matched]:
            masses=[result['departure_t'],result['arrival_t']*math.exp(math.atanh(beta)/result['phases'][1]['effective_exhaust_c'])]
            powers=[]
            for mass,mix in zip(masses,result['phases']):
                a=mix['annihilated_mass_per_fusion_mass']
                thrust=mass*1000*tr['acceleration_m_s2']
                powers.append(thrust*C/mix['effective_exhaust_c']*(Q+a)/(1+a)/1e12)
            result['peak_nuclear_plus_annihilation_power_TW']=max(powers)
            result['peak_thrust_MN']=result['departure_t']*tr['acceleration_m_s2']/1000
        main.append(dict(efficiency=efficiency,retained=retained,staged=staged,
            staged_with_at_least_same_arrival_mass=matched,
            staged_same_mixtures_same_arrival_mass=same_mix_matched,
            staging_energy_saving=1-staged['primary_energy_ZJ']/retained['primary_energy_ZJ'],
            staging_mass_matched_energy_saving=1-matched['primary_energy_ZJ']/retained['primary_energy_ZJ']))
    sensitivity=[]
    for t,c in [(.01,1),(.05,1),(.1,1),(.03,.1),(.03,10)]:
        sensitivity.append(dict(tank_fraction=t,containment_kg_kg=c,
            retained=optimise(.1,beta,t,c),staged=optimise(.1,beta,t,c,True)))
    mixes=[]
    for a in [None,Q/IGNITION_GAIN,.001,.003,.01,.03,.1]:
        m=mixture(a)
        mixes.append(dict(annihilated_mass_per_fusion_mass=a,
            retained=solve(m,m,.1,beta),staged=solve(m,m,.1,beta,True)))
    lower_coupling=dict(retained=optimise(.1,beta,fusion_coupling=.6),
        staged=optimise(.1,beta,staged=True,fusion_coupling=.6))
    return dict(status=__doc__,trajectory=tr,
        assumptions=dict(core_and_fixed_hardware_t=300,core_mass_is_allocation_not_sizing=True,
            arrival_allowance_years=.1,ordinary_tank_fraction=.03,containment_kg_per_kg_AM=1,
            separation_kit_t=5,staging_event='After acceleration; no braking tanks discarded',
            fuel_reserves_included=False,storage_fractions_are_hypothetical=True,
            primary_energy_excludes_fuel_acquisition_and_hardware_manufacture=True,
            surface_landing_of_retained_tanks_not_solved=True),
        efficiency_cases=main,storage_sensitivity=sensitivity,mixture_examples=mixes,
        fusion_coupling_60_percent=lower_coupling)


if __name__=='__main__':
    r=build_trade()
    (ROOT/'reports/retained-tank-trade.json').write_text(json.dumps(r,indent=2)+'\n')
    print('beta',r['trajectory']['beta'])
    for x in r['efficiency_cases']:
        print('eff',x['efficiency'])
        for k in ['retained','staged','staged_with_at_least_same_arrival_mass']:
            y=x[k];print(k,*(f'{v}={y[v]:.2f}' for v in ['primary_energy_ZJ','fusion_t','antimatter_t','all_storage_t','arrival_t','departure_t','discarded_t']))
    for x in r['storage_sensitivity']:
        print('sensitivity',x['tank_fraction'],x['containment_kg_kg'],x['retained']['primary_energy_ZJ'] if x['retained'] else None,x['staged']['primary_energy_ZJ'] if x['staged'] else None)
