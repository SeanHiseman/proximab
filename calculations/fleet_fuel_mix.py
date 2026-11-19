"""S6 staged fuel trade. Optimistic comparative physics, not flight qualification."""
import json
import math
from pathlib import Path

import numpy as np
from scipy.optimize import differential_evolution

from calculations.family_fleet_trade import C, trajectory
from calculations.onboard_energy_trade import Q, IGNITION_GAIN

ROOT = Path(__file__).resolve().parents[1]
HARDWARE_PER_W = 1.1*(1/(5e9*1000)+2.28e-5*5/(2*.9*5.670374419e-8*2000**4*1000))


def mix(fusion_fraction, a, photon=False, thrust_fraction=1.):
    """a: annihilated pair mass / massive feed; fusion fraction excludes pair. thrust_fraction: axial share of exhaust
    momentum (e.g. cos of a nozzle cant), applied to the effective exhaust velocity."""
    if photon:
        return dict(w=.8, source=1., fusion=0., inert=0., am=.5, tank=.2805)
    q = Q*fusion_fraction
    if a == 0:
        directed = q*(.8-1/(IGNITION_GAIN*.2*.4))
    else:
        ignition = q/IGNITION_GAIN
        if a < ignition:
            return None
        directed = .8*q+.8*(a-ignition)
    gamma = 1+directed/(1-q)
    if gamma <= 1:
        return None
    return dict(w=thrust_fraction*(1-q)*math.sqrt(gamma*gamma-1)/(1+a), source=(q+a)/(1+a),
        fusion=fusion_fraction/(1+a), inert=(1-fusion_fraction)/(1+a),
        am=a/(2*(1+a)), tank=1.1*(.01*(1+a/2)+.5*a/2)/(1+a))


def solve(core, years, burn, first, last):
    if first is None or last is None:
        return None
    tr = trajectory(years, burn)
    eta = math.atanh(tr['beta'])
    # Every segment mass is affine in the retained core; close peak-power sizing.
    A, B = 1., 0.
    segments = []
    retained = core
    for m in [last, first]:
        exponent = eta/(8*m['w'])
        if exponent >= math.log1p(1/m['tank']):
            return None
        growth = math.expm1(exponent)
        denom = 1-m['tank']*growth
        if denom <= 0:
            return None
        for _ in range(8):
            spent_a, spent_b = growth*A/denom, growth*(B+.11)/denom
            A += (1+m['tank'])*spent_a
            B += (1+m['tank'])*spent_b+.11
            power_factor = 1000*tr['acceleration_m_s2']*C*m['source']/m['w']
            slope, intercept = HARDWARE_PER_W*power_factor*A, HARDWARE_PER_W*power_factor*B
            if slope >= 1:
                return None
            retained = max(retained, (core+intercept)/(1-slope))
            segments.append((m, spent_a, spent_b, power_factor, A, B))
    fusion = inert = am = tanks = peak = 0.
    for m, sa, sb, pf, aa, bb in segments:
        spent = sa*retained+sb
        fusion += spent*m['fusion']
        inert += spent*m['inert']
        am += spent*m['am']
        tanks += spent*m['tank']+.11
        peak = max(peak, pf*(aa*retained+bb))
    return dict(fusion_t=fusion, inert_reaction_mass_t=inert, antimatter_t=am,
        ordinary_annihilation_reactant_t=am, tank_and_separation_t=tanks,
        retained_core_t=retained, nonpropulsion_core_t=core, departure_t=A*retained+B,
        engine_t=1.1*peak/5e12, radiator_t=HARDWARE_PER_W*peak-1.1*peak/5e12,
        primary_ZJ=(Q*fusion+4*am)*1000*C*C/1e21,
        trajectory=tr, effective_exhaust_c=[first['w'],last['w']])


def optimize(core, years, mode='hybrid', cap=None, efficiency=.5, seed=7, thrust_fraction=1.):
    # Hybrid endpoints use fusion feed; mixed additionally allows inert dilution.
    bounds = [(.2, years/2-.01)]
    if mode in ['hybrid', 'mixed', 'antimatter']:
        lower = math.log10(Q/IGNITION_GAIN) if mode == 'hybrid' else -10
        bounds += [(lower, 2), (lower, 2)]
    if mode == 'mixed':
        bounds += [(0,1), (0,1)]

    def evaluate(x):
        if mode == 'fusion':
            pair = [mix(1,0,thrust_fraction=thrust_fraction)]*2
        elif mode == 'photon':
            pair = [mix(0,0,True)]*2
        else:
            fractions = x[3:5] if mode == 'mixed' else [int(mode=='hybrid')]*2
            pair = [mix(f,10**a,thrust_fraction=thrust_fraction) for f,a in zip(fractions,x[1:3])]
        r = solve(core,years,x[0],*pair)
        if r:
            r['primary_ZJ'] = (Q*r['fusion_t']+2*r['antimatter_t']/efficiency)*1000*C*C/1e21
            r['parameters'] = list(x)
            r['mode'] = mode
        return r

    def objective(x):
        r = evaluate(x)
        if r is None:
            return 1e30
        if cap is not None and r['antimatter_t'] > cap:
            return 1e9+(r['antimatter_t']-cap)*1e6
        return r['primary_ZJ']

    result = differential_evolution(objective,bounds,seed=seed,popsize=14,
        maxiter=220,tol=2e-7,polish=True)
    r = evaluate(result.x)
    if r is None or (cap is not None and r['antimatter_t']>cap+1e-6):
        return None
    return r


def build_trade():
    baseline = json.loads((ROOT/'reports/lean-landing-plan.json').read_text())
    results = {}
    # Include fine small cargo allocations and complementary crew allocations.
    cargo_caps = [0,.005,.01,.02,.03,.05,.075,.1,.25,.5,1,2,3,5,10,15,20]
    caps = sorted(set(cargo_caps+[round(20-x,6) for x in cargo_caps]+[17,25,30,50,100]))
    for kind,years in [('crew',19.9),('cargo',39.9)]:
        core = baseline['ships'][kind]['ledger']['nonpropulsion_core_t']
        fusion = optimize(core,years,'fusion')
        rows = []
        for cap in caps:
            options = [fusion] if fusion else []
            if cap:
                options += [optimize(core,years,mode,cap) for mode in ['hybrid','mixed','antimatter']]
            options = [r for r in options if r]
            rows.append(dict(cap_t=cap, best=min(options,key=lambda r:r['primary_ZJ']) if options else None))
        endpoints = {mode:optimize(core,years,mode) for mode in ['hybrid','mixed','antimatter','photon']}
        results[kind] = dict(fusion_only=fusion,cap_trade=rows,unconstrained=endpoints)
        print(kind, 'completed', flush=True)
    splits = []
    for ca in cargo_caps:
        crew = next(x['best'] for x in results['crew']['cap_trade'] if abs(x['cap_t']-(20-ca))<1e-8)
        cargo = next(x['best'] for x in results['cargo']['cap_trade'] if x['cap_t']==ca)
        if crew and cargo:
            splits.append(dict(cargo_cap_t=ca,crew=crew,cargo=cargo,
                fleet={k:crew[k]+cargo[k] for k in ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ']}))
    sensitivity = []
    for efficiency in [.1,.5,1.]:
        ships = {}
        for kind, years in [('crew',19.9),('cargo',39.9)]:
            core = baseline['ships'][kind]['ledger']['nonpropulsion_core_t']
            options = [optimize(core,years,mode,efficiency=efficiency)
                       for mode in ['hybrid','mixed','antimatter','fusion']]
            ships[kind] = min([r for r in options if r],key=lambda r:r['primary_ZJ'])
        sensitivity.append(dict(efficiency=efficiency,ships=ships,
            fleet={k:sum(r[k] for r in ships.values()) for k in
                ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ']}))
    crew = next(x['best'] for x in results['crew']['cap_trade'] if x['cap_t']==19.99)
    cargo = optimize(baseline['ships']['cargo']['ledger']['nonpropulsion_core_t'],39.9,'hybrid',.01)
    simple = dict(crew=crew,cargo=cargo,fleet={k:crew[k]+cargo[k] for k in
        ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ']})
    return dict(ships=results,splits_20t=splits,manufacturing_sensitivity=sensitivity,
        simple_20t_comparator=simple,
        best_20t_split=min(splits,key=lambda r:r['fleet']['primary_ZJ']) if splits else None,
        assumptions=dict(hardware_allowance=.1,ordinary_tank_fraction=.01,AM_containment_kg_kg=.5,
            stages_per_burn=8,fusion_coupling=.8,annihilation_coupling=.8,AM_manufacturing_efficiency=.5,
            engine_W_kg=5e9,absorbed_heat_fraction=2.28e-5,main_reserve=0,
            capture_fuel_included=False,shielding_geometry_verified=False,
            photon_endpoint='Ideal 80% directed photon energy, no inert feed; not an engineered beamed-core model'),
        status='Numerical comparative search, not a global optimum or health-qualified mission; S6 baseline unchanged')


def write_summary(report):
    lines = ['# S6 comparative fleet fuel mixtures', '',
        'Comparative study only; the selected S6 design is unchanged. Reproduce with '
        '`python -m calculations.fleet_fuel_mix` (requires NumPy and SciPy). '
        'Machine-readable results: `reports/fleet-fuel-mix.json`.', '',
        'Crew transfer 19.9 years plus 0.1 year arrival operations; cargo 39.9 plus 0.1. '
        'Both retain the S6 nonpropulsion core. Capture/approach fuel and added fuel-shield '
        'layout hardware are still excluded. No shielding compliance is implied.', '',
        '## Model', '',
        'Eight tank drops per burn; 10% hardware allowance; ordinary tank fraction 1%; '
        'antimatter containment 0.5 kg/kg before allowance. Main-engine specific power '
        '5 GW/kg, 2000 K hot radiators and absorbed heat fraction 2.28e-5 remain optimistic. '
        'Engine and radiator mass feed back into fuel and power sizing. No main reserve.', '',
        'Fusion and annihilation directed-energy couplings are each assumed 80%. '
        'Fusion-only uses electrical ignition; nonzero-antimatter mixtures pay ignition '
        'energy before supplemental heating. Mixed designs can dilute fusion feed with '
        'inert reaction mass independently in each burn. Antimatter-only means zero fusion, '
        'not zero ordinary matter. An equal annihilation reactant mass is always included.', '',
        'Primary energy = fusion fuel × 0.00392 c² + 2 × antimatter × c² / manufacturing efficiency. '
        'Tables assume 50% pair-production efficiency, not current capability. '
        'Annihilation energy is not counted again. Fuel acquisition, construction and storage '
        'energy are unpriced. Search minimizes this energy under each AM cap, not departure mass. '
        'Caps are upper bounds: unused AM need not be manufactured. Differential-evolution '
        'search varies burn duration and mixtures; results are numerical candidates, not proofs '
        'of global optimality or infeasibility.', '']
    for kind, ship in report['ships'].items():
        lines += [f'## {kind.title()}', '',
            '| AM cap / endpoint | AM t | Fusion t | Inert feed t | Staged tanks t | Retained mass t | Departure t | Primary ZJ |',
            '|---|---:|---:|---:|---:|---:|---:|---:|']
        rows = [(str(x['cap_t']),x['best']) for x in ship['cap_trade']]
        rows += [(key+' unrestricted',r) for key,r in ship['unconstrained'].items()]
        for label,r in rows:
            if r is None:
                lines.append(f'| {label} | No closed candidate found | — | — | — | — | — | — |')
            else:
                keys = ['antimatter_t','fusion_t','inert_reaction_mass_t','tank_and_separation_t',
                        'retained_core_t','departure_t','primary_ZJ']
                lines.append('| '+label+' | '+' | '.join(f'{r[k]:,.3f}' for k in keys)+' |')
        lines.append('')
    lines += ['## Twenty-tonne fleet allocation', '',
        '| Crew AM cap t | Cargo AM cap t | Actual fleet AM t | Fusion t | Inert feed t | Departure t | Primary ZJ |',
        '|---|---:|---:|---:|---:|---:|---:|']
    for split in report['splits_20t']:
        f=split['fleet'];ca=split['cargo_cap_t']
        lines.append(f'| {20-ca:g} | {ca:g} | '+' | '.join(f'{f[k]:,.3f}' for k in
            ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ'])+' |')
    if report.get('simple_20t_comparator'):
        simple = report['simple_20t_comparator']['fleet']
        lines += ['', 'A lean comparator allocates 19.99 t AM to crew and 0.01 t to cargo, '
            'with fusion feed only and no additional inert reaction mass. Fleet fusion '
            f'{simple["fusion_t"]:,.3f} t; departure {simple["departure_t"]:,.3f} t; '
            f'primary energy {simple["primary_ZJ"]:.6f} ZJ. It avoids roughly 570 t of inert '
            'feed for only about 0.03% more primary energy than the best sampled allocation. '
            'This is a comparison, not an adopted change to S6.']
    lines += ['', '## Manufacturing efficiency sensitivity', '',
        'Mixtures reoptimized without the 20 t cap. These efficiencies are assumptions, '
        'not industrial capabilities.', '',
        '| Manufacturing efficiency | Fleet AM t | Fusion t | Inert feed t | Departure t | Primary ZJ |',
        '|---|---:|---:|---:|---:|---:|']
    for row in report.get('manufacturing_sensitivity',[]):
        f=row['fleet']
        lines.append(f'| {row["efficiency"]:.0%} | '+' | '.join(f'{f[k]:,.3f}' for k in
            ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ'])+' |')
    lines += ['', '## Endpoint and research qualifications', '',
        'The photon endpoint assumes 80% of all annihilation energy becomes directed photons, '
        'with no massive reaction feed. It is an idealized bound, not a demonstrated '
        'antiproton beamed-core engine. The same hardware coefficients are imposed for '
        'comparison; no photon-conversion hardware design supports them.', '',
        'NASA reports roughly 1–2% transfer into hydrogen for studied plasma concepts, '
        'not the 80% assumed here: https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf', '',
        'The original plasma study describes the coupling and radiation-loss limitations: '
        'https://ntrs.nasa.gov/citations/19890018329', '',
        'Beamed-core magnetic-nozzle momentum collimation is a different metric from '
        'whole-engine energy efficiency: https://arxiv.org/abs/1205.2281', '']
    (ROOT/'docs/FLEET_FUEL_MIX.md').write_text('\n'.join(lines),encoding='utf-8')


if __name__ == '__main__':
    report = build_trade()
    (ROOT/'reports/fleet-fuel-mix.json').write_text(json.dumps(report,indent=2)+'\n')
    write_summary(report)
    for kind,ship in report['ships'].items():
        print(kind)
        for row in ship['cap_trade']:
            r=row['best']
            print(row['cap_t'], {k:round(r[k],3) for k in ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ']} if r else None)
        for mode,r in ship['unconstrained'].items():
            print(mode, {k:round(r[k],3) for k in ['antimatter_t','fusion_t','inert_reaction_mass_t','departure_t','primary_ZJ']} if r else None)
    print('split',report['best_20t_split'])
