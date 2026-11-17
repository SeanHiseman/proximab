"""Matched S2 propulsion endpoints and mass sensitivities; hypothetical hardware."""
import json
import math

from calculations.family_fleet_trade import ROOT, C, trajectory
from calculations.onboard_energy_trade import Q, IGNITION_GAIN
from calculations.retained_tank_trade import mixture, solve
from calculations.staged_baseline import evaluate
from calculations.integrated_specification import ledger


def endpoint_mix(kind, speed, s):
    if kind == 'fusion':
        return mixture(None, s['tank_fraction'], s['containment_kg_kg'], s['fusion_coupling'])
    gamma = 1/math.sqrt(1-speed*speed)
    if kind == 'hybrid':
        a = Q/IGNITION_GAIN+((gamma-1)*(1-Q)-s['fusion_coupling']*Q)/s['annihilation_coupling']
        return mixture(a,s['tank_fraction'],s['containment_kg_kg'],s['fusion_coupling'],s['annihilation_coupling'])
    a = (gamma-1)/s['annihilation_coupling']
    return dict(annihilated_mass_per_fusion_mass=a,
        effective_exhaust_c=gamma*speed/(1+a), exhaust_c=speed,
        tank_per_spent=(s['tank_fraction']*(1+a/2)+s['containment_kg_kg']*a/2)/(1+a))


def endpoint(kind, burn, speeds, s, years):
    tr = trajectory(years, burn)
    mixes = [endpoint_mix(kind, u, s) for u in speeds]
    for m in mixes:
        m['tank_per_spent'] *= 1+s['hardware_margin']
    q = 0 if kind == 'antimatter' else Q
    coefficient = (1+s['hardware_margin'])*(1/(s['engine_W_kg']*1000)+
        s['absorbed_power_fraction']*s['radiator_kg_m2']/
        (2*s['radiator_emissivity']*5.670374419e-8*s['radiator_temperature_K']**4*1000))

    def costs(base):
        r = solve(*mixes, s['manufacturing_efficiency'], tr['beta'], True, base,
            s['separation_kit_t']*(1+s['hardware_margin']))
        if r is None:
            return None
        brake = r['arrival_t']*math.exp(math.atanh(tr['beta'])/mixes[1]['effective_exhaust_c'])
        powers = [mass*1000*tr['acceleration_m_s2']*C/m['effective_exhaust_c']*
            (q+m['annihilated_mass_per_fusion_mass'])/(1+m['annihilated_mass_per_fusion_mass'])
            for mass,m in zip([r['departure_t'],brake],mixes)]
        reserve = s['reserve_fraction']*(sum(p['spent_t'] for p in r['phases'])+r['all_storage_t'])
        branches = [s['nonpropulsion_allocation_t']+reserve+coefficient*p for p in powers]
        return r, branches

    z, o = costs(0), costs(1000)
    if z is None or o is None:
        return None
    slopes = [(y-x)/1000 for x,y in zip(z[1],o[1])]
    if max(slopes) >= 1:
        return None
    base = max(x/(1-m) for x,m in zip(z[1],slopes))
    r, branches = costs(base)
    assert math.isclose(base,max(branches),rel_tol=1e-8)
    f = 1+s['reserve_fraction']
    return dict(kind=kind, burn_years=burn, exhaust_c=[m['exhaust_c'] for m in mixes],
        departure_t=r['departure_t'], bulk_propellant_t=r['fusion_t']*f,
        fusion_t=r['fusion_t']*f if kind!='antimatter' else 0,
        inert_reaction_mass_t=r['fusion_t']*f if kind=='antimatter' else 0,
        antimatter_t=r['antimatter_t']*f,
        primary_ZJ=r['manufacturing_ZJ']*f+r['fusion_t']*1000*q*C*C/1e21,
        closure_feedback=max(slopes))


def optimise_endpoint(kind, s, years):
    best = None
    for burn in [i*.25 for i in range(1, min(40,int(years*2))+1)]:
        speeds = [0] if kind=='fusion' else [.08+i*.02 for i in range(37)]
        for u in speeds:
            for v in speeds:
                r = endpoint(kind,burn,[u,v],s,years)
                if r and (best is None or r['primary_ZJ']<best['primary_ZJ']):
                    best = r
    return best


def build_trade():
    baseline = json.loads((ROOT/'reports/integrated-specification-s2.json').read_text())
    spec = json.loads((ROOT/'data/integrated_specification_s2.json').read_text())
    result = {}
    for kind,years in [('crew',19.9),('cargo',39.9)]:
        ship = baseline[kind]
        s = ship['coefficients']
        chosen = ship['selected']
        burn = chosen['trajectory']['burn_years']
        speeds = [p['exhaust_c'] for p in chosen['phases']]
        # Idealised fuel-only comparison excludes every propulsion hardware item
        # and reserves, but carries the same nonpropulsion core and trajectory.
        fusion = endpoint_mix('fusion',0,s)
        ideal_fusion = s['nonpropulsion_allocation_t']*math.expm1(2*math.atanh(chosen['trajectory']['beta'])/fusion['effective_exhaust_c'])
        changes = {}
        for name,updates in [('reserve_2_percent',dict(reserve_fraction=.02)),
            ('engine_twice_specific_power',dict(engine_W_kg=s['engine_W_kg']*2)),
            ('containment_half',dict(containment_kg_kg=s['containment_kg_kg']/2)),
            ('ordinary_tanks_half',dict(tank_fraction=s['tank_fraction']/2))]:
            r = evaluate(burn,*speeds,dict(s,**updates),years)
            changes[name] = dict(departure_saved_t=chosen['departure_t']-r['departure_t'],
                antimatter_saved_t=chosen['loaded_antimatter_t']-r['loaded_antimatter_t'])
        one_less = evaluate(burn,*speeds,dict(s,nonpropulsion_allocation_t=s['nonpropulsion_allocation_t']-1),years)
        lighter = json.loads(json.dumps(spec))
        lighter[f'{kind}_hardware'][0][1] -= 1/1.25
        landed_core_saving = ledger(kind,spec)['nonpropulsion_core_t']-ledger(kind,lighter)['nonpropulsion_core_t']
        result[kind] = dict(hybrid=dict(departure_t=chosen['departure_t'],fusion_t=chosen['loaded_fusion_t'],
                antimatter_t=chosen['loaded_antimatter_t'],primary_ZJ=chosen['primary_energy_loaded_fuel_ZJ']),
            fusion_same_burn=endpoint('fusion',burn,[0,0],s,years),
            fusion_sampled_optimum=optimise_endpoint('fusion',s,years),
            fusion_zero_reserve_sensitivity=optimise_endpoint('fusion',dict(s,reserve_fraction=0),years),
            fusion_fuel_only_no_hardware_no_reserve_t=ideal_fusion,
            antimatter_same_exhaust=endpoint('antimatter',burn,speeds,s,years),
            antimatter_sampled_optimum=optimise_endpoint('antimatter',s,years),
            hardware_sensitivities=changes,
            saved_per_tonne_orbital_core=dict(departure_t=chosen['departure_t']-one_less['departure_t'],
                antimatter_t=chosen['loaded_antimatter_t']-one_less['loaded_antimatter_t']),
            core_saved_per_tonne_landed_dry=landed_core_saving)
    lean = []
    for margin,reserve in [(.25,.05),(.15,.05),(.10,.05),(.25,.02),(.15,.02),(.10,.02)]:
        variant = json.loads(json.dumps(spec))
        variant['hardware_allowance'] = margin
        ships = {}
        for kind,years in [('crew',19.9),('cargo',39.9)]:
            ship = baseline[kind]
            selected = ship['selected']
            s = dict(ship['coefficients'],hardware_margin=margin,reserve_fraction=reserve,
                nonpropulsion_allocation_t=ledger(kind,variant)['nonpropulsion_core_t'])
            r = evaluate(selected['trajectory']['burn_years'],
                *[p['exhaust_c'] for p in selected['phases']],s,years)
            ships[kind] = {k:r[k] for k in ['departure_t','loaded_fusion_t','loaded_antimatter_t','primary_energy_loaded_fuel_ZJ']}
        fleet = {k:sum(x[k] for x in ships.values()) for k in ships['crew']}
        lean.append(dict(hardware_allowance=margin,main_fuel_reserve_fraction=reserve,
            ships=ships,fleet=fleet))
    return dict(status='Conditional comparison; no health or hardware qualification; antimatter-only means inert reaction mass accelerated by annihilation, not a photon rocket.',cases=result,
        lean_allowance_sensitivities=lean)


if __name__=='__main__':
    r = build_trade()
    (ROOT/'reports/fuel-substitution.json').write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps(r,indent=2))
