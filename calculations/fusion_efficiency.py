"""Selected 20 t AM study: distinguish energy conversion from fuel economy."""
import json

from calculations.family_fleet_trade import ROOT,C
from calculations.onboard_energy_trade import Q,IGNITION_GAIN
from calculations.depleted_staged_tanks import MIN_SPEED,calculate,optimise


def build_trade():
    fusion=calculate(MIN_SPEED,MIN_SPEED,electrical_fusion=True)
    cases=[]
    for coupling in [.8,.5,.2,.02]:
        r=optimise(20,annihilation_coupling=coupling)
        source_fusion=r['fusion_t']*1000*Q*C*C/1e21
        source_am=2*r['antimatter_t']*1000*C*C/1e21
        jet=.8*source_fusion+coupling*(source_am-source_fusion/IGNITION_GAIN)
        cases.append(dict(annihilation_coupling=coupling,ship=r,
            fusion_fuel_saving_fraction=1-r['fusion_t']/fusion['fusion_t'],
            primary_energy_saving_fraction=1-r['primary_ZJ']/fusion['primary_ZJ'],
            source_fusion_ZJ=source_fusion,source_annihilation_ZJ=source_am,
            summed_local_directed_exhaust_energy_ZJ=jet,
            source_to_jet_fraction=jet/(source_fusion+source_am),
            accounted_primary_to_local_jet_fraction=jet/r['primary_ZJ']))
    return dict(selected_antimatter_t=20,main_fuel_reserve_fraction=0,
        selected_case_index=0,selected_case_status='Optimistic target; no demonstrated 80% supplementary energy coupling',
        electrical_fusion_comparator=fusion,coupling_cases=cases,
        optional_zero_AM_cargo=json.loads((ROOT/'reports/depleted-staged-tanks.json').read_text())['optional_fusion_cargo'],
        comparison_scope='Same 500 t retained mass, eight tank drops per burn, 1.25 y burns, 20 y elapsed. Engine mass is checked against retained allocation, not automatically added. Spectra, nozzle and thermal losses are not independently solved. Coupling sensitivity is not validation.')


if __name__=='__main__':
    r=build_trade()
    (ROOT/'reports/fusion-efficiency.json').write_text(json.dumps(r,indent=2)+'\n')
    for c in r['coupling_cases']:
        s=c['ship']
        print(c['annihilation_coupling'],{k:s[k] for k in ['fusion_t','departure_t','primary_ZJ','exhaust_c','effective_exhaust_c','core_left_after_engine_and_hot_radiator_t']})
        print({k:v for k,v in c.items() if k!='ship'})
