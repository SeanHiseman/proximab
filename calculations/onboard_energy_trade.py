"""Conditional primary-energy comparison; no complete vehicle mass closure.

Fusion energy is counted once. Onboard electrical ignition recirculates fusion
energy; manufacturing antimatter is counted instead of counting annihilation twice.
Fuel processing and construction are explicit unpriced terms, not free resources.
"""
import json
import math
from calculations.family_fleet_trade import ROOT, C

Q=.00392
FUSION_COUPLING=.8
IGNITION_GAIN=1000
DRIVER_EFFICIENCY=.2
GENERATOR_EFFICIENCY=.4


def case(kind,am_per_fuel=0,production_efficiency=.01,processing_J_kg=0):
    beta=4.24/20
    ignition_am=Q/IGNITION_GAIN if kind!='electrical' else 0
    if kind=='electrical':
        # Conservative allocation: recirculation is deducted from jet energy;
        # none of the delivered ignition energy is recovered as directed exhaust.
        directed=Q*(FUSION_COUPLING-1/(IGNITION_GAIN*DRIVER_EFFICIENCY*GENERATOR_EFFICIENCY))
        a=0
    else:
        a=max(ignition_am,am_per_fuel)
        directed=Q*FUSION_COUPLING+.5*(a-ignition_am)
    gamma=1+directed/(1-Q)
    u=math.sqrt(1-1/gamma**2)
    w=(1-Q)*math.sqrt(gamma**2-1)/(1+a)
    ratio=math.exp(2*math.atanh(beta)/w)
    fuel_kg=300000*(ratio-1)/(1+a)
    am_kg=a*fuel_kg/2
    fusion_J=Q*fuel_kg*C*C
    production_J=2*am_kg*C*C/production_efficiency
    return dict(kind=kind,exhaust_c=u,effective_exhaust_c=w,fuel_t=fuel_kg/1000,
        antimatter_t=am_kg/1000,departure_t=ratio*300,retained_t=300,
        fusion_energy_J=fusion_J,antimatter_manufacturing_J=production_J,
        fusion_fuel_processing_J=fuel_kg*processing_J_kg,
        primary_energy_excluding_construction_J=fusion_J+production_J+fuel_kg*processing_J_kg,
        prelaunch_energy_excluding_construction_J=production_J+fuel_kg*processing_J_kg)


def supplement_for_speed(u):
    gamma=1/math.sqrt(1-u*u)
    return Q/IGNITION_GAIN+max(0,((gamma-1)*(1-Q)-Q*FUSION_COUPLING)/.5)


def build_trade():
    comparison=[case('electrical'),case('ignition'),case('supplement',supplement_for_speed(.2))]
    sensitivity=[]
    for efficiency in [.001,.01,.1,1]:
        choices=[case('supplement',Q/IGNITION_GAIN+i*.00001,efficiency) for i in range(10001)]
        best=min(choices,key=lambda r:r['primary_energy_excluding_construction_J'])
        sensitivity.append(dict(am_production_efficiency=efficiency,best_hybrid=best,
            electrical=case('electrical',production_efficiency=efficiency),
            ignition=case('ignition',production_efficiency=efficiency)))
    e,h=comparison[0],comparison[2]
    threshold=(h['primary_energy_excluding_construction_J']-e['primary_energy_excluding_construction_J'])/((e['fuel_t']-h['fuel_t'])*1000)
    return dict(status=__doc__,assumptions=dict(retained_t=300,years=20,beta=.212,
        instantaneous_burns=True,fusion_fraction=Q,fusion_jet_coupling=FUSION_COUPLING,
        electrical_target_gain=IGNITION_GAIN,annihilation_to_fusion_gain=IGNITION_GAIN,
        gains_are_different_quantities_and_both_assumed=True,driver_efficiency=DRIVER_EFFICIENCY,
        generator_efficiency=GENERATOR_EFFICIENCY,antimatter_production_efficiency=.01,
        fusion_processing_J_kg=0,processing_zero_is_unpriced_not_demonstrated=True),
        comparison=comparison,sensitivity=sensitivity,
        processing_J_kg_for_fixed_0_2c_hybrid_to_equal_electrical=threshold,
        complete_vehicle_or_industrial_energy_budget=None)


if __name__=='__main__':
    r=build_trade()
    (ROOT/'reports/onboard-energy-trade.json').write_text(json.dumps(r,indent=2)+'\n')
    for c in r['comparison']:
        print(c['kind'],{k:c[k] for k in ['fuel_t','antimatter_t','departure_t','fusion_energy_J','antimatter_manufacturing_J','primary_energy_excluding_construction_J']})
    for s in r['sensitivity']:
        b=s['best_hybrid'];print('efficiency',s['am_production_efficiency'],'best exhaust',b['exhaust_c'],'energy',b['primary_energy_excluding_construction_J'],'AM',b['antimatter_t'])
    print('fuel processing crossover J/kg',r['processing_J_kg_for_fixed_0_2c_hybrid_to_equal_electrical'])
