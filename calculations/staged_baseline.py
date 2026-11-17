"""Selected optimistic coefficient model; radiation and hardware not qualified."""
import json
import math
from calculations.family_fleet_trade import ROOT, C, trajectory
from calculations.onboard_energy_trade import Q, IGNITION_GAIN
from calculations.retained_tank_trade import mixture, solve

ASSUMPTIONS=dict(fusion_coupling=.8,annihilation_coupling=.8,
    manufacturing_efficiency=.5,tank_fraction=.01,containment_kg_kg=.5,
    engine_W_kg=5e9,absorbed_power_fraction=1e-5,radiator_temperature_K=2000,
    radiator_emissivity=.9,radiator_kg_m2=5,hardware_margin=.25,reserve_fraction=.05,
    nonpropulsion_allocation_t=300,separation_kit_t=5)


def evaluate(burn_years,u1,u2,assumptions=None,transfer_years=19.9,staged=True):
    s=assumptions or ASSUMPTIONS
    tr=trajectory(transfer_years,burn_years)
    mixes=[]
    for u in [u1,u2]:
        gamma=1/math.sqrt(1-u*u)
        a=Q/IGNITION_GAIN+((gamma-1)*(1-Q)-s['fusion_coupling']*Q)/s['annihilation_coupling']
        if a<Q/IGNITION_GAIN:return None
        m=mixture(a,s['tank_fraction'],s['containment_kg_kg'],s['fusion_coupling'],s['annihilation_coupling'])
        # Nominal storage allowance travels with its tank and is staged with it.
        m['tank_per_spent']*=1+s['hardware_margin']
        mixes.append(m)
    def costs(base):
        r=solve(*mixes,s['manufacturing_efficiency'],tr['beta'],staged,base,
                s['separation_kit_t']*(1+s['hardware_margin']))
        if r is None:return None
        brake_start=r['arrival_t']*math.exp(math.atanh(tr['beta'])/mixes[1]['effective_exhaust_c'])
        powers=[]
        for mass,m in zip([r['departure_t'],brake_start],mixes):
            a=m['annihilated_mass_per_fusion_mass']
            powers.append(mass*1000*tr['acceleration_m_s2']*C/m['effective_exhaust_c']*(Q+a)/(1+a))
        peak=max(powers)
        engine=peak/s['engine_W_kg']/1000
        heat=peak*s['absorbed_power_fraction']
        area=heat/(2*s['radiator_emissivity']*5.670374419e-8*s['radiator_temperature_K']**4)
        radiator=area*s['radiator_kg_m2']/1000
        reserve=s['reserve_fraction']*sum(p['spent_t'] for p in r['phases'])
        # Dedicated reserve stores stay with the ship; never discard reserve fuel.
        reserve_storage=s['reserve_fraction']*r['all_storage_t']
        required=s['nonpropulsion_allocation_t']+(engine+radiator)*(1+s['hardware_margin'])+reserve+reserve_storage
        return r,required,dict(engine_t=engine,radiator_t=radiator,radiator_planform_m2=area,
            phase_peak_source_power_W=powers,
            peak_power_TW=peak/1e12,peak_absorbed_heat_GW=heat/1e9,
            retained_reserve_t=reserve,retained_reserve_storage_with_margin_t=reserve_storage)
    zero,one=costs(0),costs(1000)
    if zero is None or one is None:return None
    # Each burn's peak power is affine in core mass. Their maximum is piecewise
    # affine: solve both branches rather than fitting across a branch switch.
    branches=[]
    for phase in [0,1]:
        values=[]
        for _,required,h in [zero,one]:
            power_mass=(h['engine_t']+h['radiator_t'])*(1+s['hardware_margin'])
            coefficient=(1+s['hardware_margin'])*(1/(s['engine_W_kg']*1000)+
                s['absorbed_power_fraction']*s['radiator_kg_m2']/
                (2*s['radiator_emissivity']*5.670374419e-8*s['radiator_temperature_K']**4*1000))
            values.append(required-power_mass+coefficient*h['phase_peak_source_power_W'][phase])
        branches.append((values[0],(values[1]-values[0])/1000))
    slope=max(m for _,m in branches)
    if slope>=1:return None
    base=max(b/(1-m) for b,m in branches)
    r,required,hardware=costs(base)
    assert math.isclose(base,required,rel_tol=1e-8)
    reserve_factor=1+s['reserve_fraction']
    loaded_am=r['antimatter_t']*reserve_factor
    production=r['manufacturing_ZJ']*reserve_factor
    r.update(hardware=hardware,trajectory=tr,closure_feedback=slope,
        loaded_antimatter_t=loaded_am,loaded_fusion_t=r['fusion_t']*reserve_factor,
        loaded_ordinary_annihilation_reactant_t=loaded_am,
        manufacture_loaded_antimatter_ZJ=production,
        primary_energy_loaded_fuel_ZJ=production+r['fusion_energy_ZJ'],
        dry_hardware_and_nonpropulsion_allocation_t=r['arrival_t']-hardware['retained_reserve_t']+r['discarded_t'],
        departure_phase_thrust_MN=r['departure_t']*tr['acceleration_m_s2']/1000)
    return r


def optimise(assumptions=None,transfer_years=19.9,staged=True):
    best=None
    for burn in [.5,1,1.5,2,2.5,3,4,5]:
        for i in range(25):
            for j in range(25):
                r=evaluate(burn,.08+i*.02,.08+j*.02,assumptions,transfer_years,staged)
                if r and (best is None or r['primary_energy_loaded_fuel_ZJ']<best['primary_energy_loaded_fuel_ZJ']):best=r
    for span in [.02,.005]:
        burn=best['trajectory']['burn_years']
        u1,u2=[p['exhaust_c'] for p in best['phases']]
        for b in [burn-.25,burn,burn+.25]:
            for i in range(-4,5):
                for j in range(-4,5):
                    r=evaluate(b,u1+i*span/4,u2+j*span/4,assumptions,transfer_years,staged)
                    if r and r['primary_energy_loaded_fuel_ZJ']<best['primary_energy_loaded_fuel_ZJ']:best=r
    return best


def build_baseline():
    optimum=optimise()
    # Round only design inputs; all reported masses are recalculated afterwards.
    burn=round(optimum['trajectory']['burn_years']*4)/4
    speeds=[round(p['exhaust_c'],2) for p in optimum['phases']]
    selected=evaluate(burn,*speeds)
    sensitivity={}
    for key,values in [('manufacturing_efficiency',[.3,.8]),('engine_W_kg',[1e9,2e9]),
                       ('absorbed_power_fraction',[1e-4,1e-3]),('tank_fraction',[.02,.03]),
                       ('nonpropulsion_allocation_t',[450,600])]:
        for value in values:
            sensitivity[f'{key}={value}']=evaluate(burn,*speeds,dict(ASSUMPTIONS,**{key:value}))
    return dict(status='Selected optimistic design baseline, not flight qualification',
        assumptions=ASSUMPTIONS,selected=selected,numerical_optimum=optimum,
        sensitivity_at_fixed_design=sensitivity,
        unresolved=['GCR transport and healthy arrival','Full engine/nozzle and gamma/neutron shielding design',
            'Tonnes-scale antimatter production and containment','Fusion burnup and helium-3 supply',
            'Core/landing allocation and cargo vehicle','Low-temperature service heat and cryogenic power',
            'Source-waste interception including engine shadow shields'])


if __name__=='__main__':
    report=build_baseline()
    (ROOT/'reports/staged-baseline.json').write_text(json.dumps(report,indent=2)+'\n')
    r=report['selected']
    print(json.dumps({k:r[k] for k in ['trajectory','loaded_antimatter_t','loaded_fusion_t',
        'departure_t','arrival_t','discarded_t','hardware','primary_energy_loaded_fuel_ZJ',
        'manufacture_loaded_antimatter_ZJ','dry_hardware_and_nonpropulsion_allocation_t']},indent=2))
    print('exhaust',[p['exhaust_c'] for p in r['phases']])
