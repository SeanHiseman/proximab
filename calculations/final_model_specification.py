"""Freeze S7 concept inputs and export chronological tank-stage mass ledgers."""
import json
import math

from calculations.fleet_fuel_mix import ROOT, optimize, Q, IGNITION_GAIN
from calculations.arrival_redesign import closed
from calculations.depleted_staged_tanks import MIN_SPEED
from calculations.integrated_specification import ledger


def build(spec=None, thrust_fraction=1.):
    """thrust_fraction: axial share of exhaust momentum (cos of a nozzle cant): one value, or a dict per ship kind."""
    spec=spec or json.loads((ROOT/'data/final_model_specification.json').read_text())
    ships={}
    for kind,years in [('crew',19.9),('cargo',39.9)]:
        tf=thrust_fraction.get(kind,1.) if isinstance(thrust_fraction,dict) else thrust_fraction
        book=ledger(kind,spec,500 if kind=='crew' else 1000)
        selected=optimize(book['nonpropulsion_core_t'],years,'hybrid' if kind=='crew' else 'fusion',
                          cap=spec['propulsion_selection']['crew_antimatter_t'] if kind=='crew' else None,
                          thrust_fraction=tf)
        if kind=='crew':
            speeds=[]
            for loga in selected['parameters'][1:3]:
                gamma=1+(.8*Q+.8*(10**loga-Q/IGNITION_GAIN))/(1-Q)
                speeds.append(math.sqrt(1-1/gamma**2))
        else:speeds=[MIN_SPEED,MIN_SPEED]
        p=closed(*speeds,core_t=book['nonpropulsion_core_t'],
            burn_years=selected['trajectory']['burn_years'],transfer_years=years,
            electrical_fusion=kind=='cargo',thrust_fraction=tf)
        assert abs(p['departure_t']-selected['departure_t'])<1e-5
        dry=book['fixed_dry_with_margin_t']+p['engine_with_allowance_t']+p['hot_radiator_with_allowance_t']
        ships[kind]=dict(ledger=book,propulsion=p,retained_dry_hardware_t=dry,
            departure_dry_hardware_t=dry+p['tank_and_separation_t'],
            landed_dry_hardware_t=sum(row[1] for row in book['hardware_rows'] if row[2])*1.1+
                book['landing']['tank_with_margin_t'])
    return dict(revision=spec['revision'],ships=ships,
        fleet={key:sum(s['propulsion'][key] for s in ships.values()) for key in
            ['departure_t','fusion_t','antimatter_t','ordinary_annihilation_matter_t','primary_ZJ']},
        concept_frozen=True,engineering_finalized=False,capture_fuel_included=False,
        radiation_verified=False,tank_geometry_closed=False)


if __name__=='__main__':
    report=build()
    (ROOT/'reports/final-model-specification.json').write_text(json.dumps(report,indent=2)+'\n')
    for kind,s in report['ships'].items():
        print(kind,{k:s['propulsion'][k] for k in ['fusion_t','antimatter_t','departure_t','retained_core_t','trajectory']})
        print('dry',s['departure_dry_hardware_t'],s['retained_dry_hardware_t'])
