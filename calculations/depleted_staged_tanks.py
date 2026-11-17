"""Zero-reserve 20-year transfer: fixed retained mass plus discrete tank staging."""
import json
import math

from calculations.family_fleet_trade import ROOT, C, trajectory
from calculations.onboard_energy_trade import Q, IGNITION_GAIN
from calculations.retained_tank_trade import mixture

MIN_SPEED=math.sqrt(1-1/(1+.8*Q/(1-Q))**2)+1e-10


def calculate(u1,u2,stages=8,tanks=True,core_t=500,burn_years=1.25,transfer_years=19.9,electrical_fusion=False,annihilation_coupling=.8):
    tr=trajectory(transfer_years,burn_years)
    rapidity=math.atanh(tr['beta'])
    mixes=[]
    for u in [u1,u2]:
        a=Q/IGNITION_GAIN+((1/math.sqrt(1-u*u)-1)*(1-Q)-.8*Q)/annihilation_coupling
        if a<Q/IGNITION_GAIN or not 0<u<1:return None
        m=mixture(None if electrical_fusion else a,.01 if tanks else 0,.5 if tanks else 0,.8,annihilation_coupling)
        m['tank_per_spent']*=1.1
        mixes.append(m)
    # .1 t nominal separation/services allowance per detachable module.
    kit=.11 if tanks else 0
    after=core_t
    segments=[]
    for phase in [1,0]:
        m=mixes[phase]
        ratio=math.exp(rapidity/stages/m['effective_exhaust_c'])
        k=m['tank_per_spent']
        denominator=1-k*(ratio-1)
        if denominator<=0:return None
        for reverse_index in range(stages):
            spent=(ratio-1)*(after+kit)/denominator
            storage=k*spent+kit
            before=after+spent+storage
            fusion=spent/(1+m['annihilated_mass_per_fusion_mass'])
            am=(spent-fusion)/2
            source_fraction=(Q+m['annihilated_mass_per_fusion_mass'])/(1+m['annihilated_mass_per_fusion_mass'])
            source_W=before*1000*tr['acceleration_m_s2']*C/m['effective_exhaust_c']*source_fraction
            segments.append(dict(phase=phase,index=stages-reverse_index-1,before_t=before,
                after_burn_t=after+storage,after_drop_t=after,spent_t=spent,
                tank_and_separation_t=storage,fusion_t=fusion,antimatter_t=am,source_W=source_W))
            after=before
    segments.reverse()
    fusion=sum(x['fusion_t'] for x in segments)
    am=sum(x['antimatter_t'] for x in segments)
    storage=sum(x['tank_and_separation_t'] for x in segments)
    source=max(x['source_W'] for x in segments)
    engine=1.1*source/5e9/1000
    radiator=1.1*source*2.28e-5/(2*.9*5.670374419e-8*2000**4)*5/1000
    return dict(retained_core_t=core_t,departure_t=after,fusion_t=fusion,antimatter_t=am,
        ordinary_annihilation_matter_t=am,departure_dry_t=core_t+storage,
        tank_and_separation_t=storage,stages_per_burn=stages,trajectory=tr,
        exhaust_c=[m['exhaust_c'] for m in mixes],segments=segments,retained_propulsion_fuel_t=0,
        peak_source_TW=source/1e12,engine_with_allowance_t=engine,
        hot_radiator_with_allowance_t=radiator,
        core_left_after_engine_and_hot_radiator_t=core_t-engine-radiator,
        effective_exhaust_c=[m['effective_exhaust_c'] for m in mixes],
        ignition_antimatter_t=0 if electrical_fusion else fusion*Q/IGNITION_GAIN/2,
        manufacture_ZJ=2*am*1000*C*C/.5/1e21,
        primary_ZJ=(2*am/.5+fusion*Q)*1000*C*C/1e21)


def optimise(cap,stages=8,tanks=True,annihilation_coupling=.8,core_t=500,evaluator=None):
    best=None
    run=evaluator or calculate
    def consider(u):
        nonlocal best
        # Find the highest feasible braking speed, then resolve its cap boundary.
        # AM is not globally monotone in braking speed, so bracket with a scan.
        speeds=[MIN_SPEED+i*.01 for i in range(73)]
        feasible=[]
        for i,v in enumerate(speeds):
            r=run(u,v,stages,tanks,core_t=core_t,annihilation_coupling=annihilation_coupling)
            if r and r['antimatter_t']<=cap:feasible.append((i,r))
        if not feasible:return
        i,r=feasible[-1]
        if i<len(speeds)-1:
            lo,hi=speeds[i:i+2]
            for _ in range(32):
                mid=(lo+hi)/2
                candidate=run(u,mid,stages,tanks,core_t=core_t,annihilation_coupling=annihilation_coupling)
                if candidate and candidate['antimatter_t']<=cap:
                    lo=mid;r=candidate
                else:hi=mid
        if best is None or r['fusion_t']<best['fusion_t']:best=r
    for i in range(100):consider(MIN_SPEED+i*.003)
    if best is None:return None
    for delta in [.0003,.00003,.000003]:
        u=best['exhaust_c'][0]
        for i in range(-10,11):consider(max(MIN_SPEED,u+i*delta))
    return best


def build_trade():
    # Optional fleet completion: S3 cargo nonpropulsion core, electrical fusion,
    # with engine/radiator mass closed rather than borrowed from the crew budget.
    baseline=json.loads((ROOT/'reports/integrated-specification.json').read_text())
    fixed=baseline['cargo']['ledger']['nonpropulsion_core_t']
    def cargo(core):
        return calculate(MIN_SPEED,MIN_SPEED,core_t=core,burn_years=.75,
            transfer_years=39.9,electrical_fusion=True)
    x,y=cargo(fixed),cargo(fixed+1000)
    hardware=lambda r:r['engine_with_allowance_t']+r['hot_radiator_with_allowance_t']
    slope=(hardware(y)-hardware(x))/1000
    closed_cargo=cargo((fixed+hardware(x)-slope*fixed)/(1-slope))
    return dict(status='Zero main-propulsion reserve comparison, not a qualified ship. Primary tables describe the 500 t retained ship; optional electrically ignited fusion cargo consumes zero AM.',
        assumptions=dict(retained_core_t=500,transfer_years=19.9,arrival_allowance_years=.1,
            burn_years_each=1.25,fusion_coupling=.8,annihilation_coupling=.8,
            tank_fraction=.01,containment_kg_per_kg_AM=.5,hardware_allowance=.1,
            nominal_separation_kit_t_per_drop=.1,stages_equal_rapidity=True,
            arrival_operations_fuel_included=False),
        optional_fusion_cargo=closed_cargo,
        cases=[dict(cap_t=cap,ideal_fixed_mass=optimise(cap,1,False),
            staged=[optimise(cap,n) for n in [1,4,8,16]]) for cap in [10,20]])


if __name__=='__main__':
    r=build_trade()
    (ROOT/'reports/depleted-staged-tanks.json').write_text(json.dumps(r,indent=2)+'\n')
    for case in r['cases']:
        for x in [case['ideal_fixed_mass']]+case['staged']:
            print(case['cap_t'],{k:x[k] for k in ['stages_per_burn','departure_t','departure_dry_t','fusion_t','antimatter_t','tank_and_separation_t','exhaust_c','engine_with_allowance_t','hot_radiator_with_allowance_t','core_left_after_engine_and_hot_radiator_t','ignition_antimatter_t','primary_ZJ']},flush=True)
