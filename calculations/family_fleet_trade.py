"""Conditional family-fleet accounting study; never updates viewer inputs.

All engineering coefficients are explicit speculative allocations. Optimisation
is over constant exhaust speed and symmetric constant-proper-acceleration burns.
"""
import json
import math
from pathlib import Path

from calculations.mission_calculations import C, G, YEAR

ROOT = Path(__file__).resolve().parent.parent
SIGMA = 5.670374419e-8
SCENARIOS = {
    'optimistic': dict(efficiency=.8, engine_W_kg=5e9, absorbed_fraction=1e-6,
                       tank_fraction=.03, containment_kg_kg=.5),
    'reference': dict(efficiency=.5, engine_W_kg=1e9, absorbed_fraction=1e-5,
                      tank_fraction=.05, containment_kg_kg=1),
    'stress': dict(efficiency=.3, engine_W_kg=2e8, absorbed_fraction=1e-4,
                   tank_fraction=.10, containment_kg_kg=2),
}


def trajectory(years, burn_years):
    """Two equal coordinate-time burns, constant proper acceleration."""
    lo, hi = 0., .999999
    for _ in range(60):
        beta = (lo+hi)/2
        gamma = 1/math.sqrt(1-beta*beta)
        distance = 2*burn_years*gamma*beta/(gamma+1) + beta*(years-2*burn_years)
        if distance < 4.24:
            lo = beta
        else:
            hi = beta
    beta = (lo+hi)/2
    gamma = 1/math.sqrt(1-beta*beta)
    acceleration = gamma*beta*C/(burn_years*YEAR)
    proper_years = 2*math.atanh(beta)*C/acceleration/YEAR+(years-2*burn_years)/gamma
    return dict(beta=beta, acceleration_m_s2=acceleration, proper_years=proper_years,
                burn_years=burn_years, years=years)


def exhaust(speed, efficiency):
    """Unused annihilation energy leaves isotropically in the ship frame.

    Per kg of massive exhaust, annihilated mass is (gamma-1)/efficiency.
    Include escaping waste energy in rest-mass loss; no division-only shortcut.
    """
    gamma = 1/math.sqrt(1-speed*speed)
    annihilated = (gamma-1)/efficiency
    total = 1+annihilated
    return dict(effective=gamma*speed/total, annihilated_fraction=annihilated/total,
                reaction_fraction=1/total)


def ledger(kind, years, shield_multiplier=1., landing_isp=1800):
    # Tonnes before a 25% hardware allowance. Land flag indicates descent load.
    # Areas are explicit allocation envelopes, not a selected visual geometry.
    if kind == 'crew':
        rows = [
            ('1600 m3 gravity rooms + 800 m3 common rooms: envelope/floors', 60, True),
            ('Spin structure, hubs, transfers and deployment', 20, True),
            ('64-person furnishings, school, play, hygiene and exercise', 14, True),
            ('Radiation material retained for surface refuge', 40*shield_multiplier, True),
            ('Removable cruise radiation material, discarded after braking', 320*shield_multiplier, False),
            ('Forward shield: 20 m diameter at 100 kg/m2 plus 5 t support', math.pi*10**2*.1+5, False),
            ('64-person refuge, airlocks, descent frame and landing engine', 28, True),
            ('Life support and two independent full-population food trains', 24, True),
            ('Medical, embryo bank, maternity and 64 convertible berths', 22, True),
            ('Habitat power, service radiators and distribution', 15, True),
            ('Avionics, communications and autonomy', 3, True),
            ('Initial surface exploration, repair tools and suits', 8, True),
            ('Main engine standoff, feed and fixed containment equipment', 20, False),
        ]
        supplies = 22 + .25*years + .3*20
        # Includes 4.5 t body/growth material, 8 t process water, 3 t gases,
        # 3 t emergency food, 3.5 t loop/personal inventories; 0.25 t/year
        # adult mission plus 0.3 t/year for a 20-year family phase of make-up
        # and replacement inventory. No mass credit for child torpor.
        power_W = 500000
    else:
        rows = [
            ('Surface industry, heavy exploration and habitat expansion', 70, True),
            ('Surface power, food and life-support backup hardware', 15, True),
            ('Landing frame, engine and cargo deployment', 12, True),
            ('Forward shield: 6 m diameter at 100 kg/m2 plus 2 t support', math.pi*3**2*.1+2, False),
            ('Long spine, avionics, services and autonomous maintenance', 10, False),
            ('Main engine standoff, feed and fixed containment equipment', 15, False),
        ]
        supplies = 20 + .1*years
        power_W = 50000
    dry = 1.25*sum(m for _,m,_ in rows)
    landed_dry = 1.25*sum(m for _,m,land in rows if land)
    # One year's stored food is not provided; both ships assume closed food loops.
    # Power bank covers transit plus 20 surface years at the same allocated load.
    power_am = power_W*(years+20)*YEAR/(.4*2*C*C)/1000
    landed = landed_dry+supplies+2*power_am
    # 6 km/s total descent allowance, hypothetical 1800 s Isp; 10% fuel reserve.
    landing_factor = 1.1*math.expm1(6000/(landing_isp*G))
    # Descent tanks are 8% of loaded hydrogen and themselves land.
    hydrogen = landing_factor*landed/(1-.08*landing_factor)
    landing_tanks = .08*hydrogen
    landing_am = hydrogen*(landing_isp*G)**2/(4*.5*C*C) if landing_isp > 450 else 0.
    return dict(kind=kind, years=years, hardware_rows=[dict(name=n,tonnes=m,lands=l) for n,m,l in rows],
                fixed_dry_t=dry, supplies_t=supplies, landing_hydrogen_t=hydrogen,
                landing_isp_s=landing_isp,
                landing_tanks_t=landing_tanks, landing_am_t=landing_am,
                auxiliary_am_t=power_am+landing_am,
                landed_without_unused_reserves_t=landed+landing_tanks,
                base_arrival_t=dry+supplies+2*power_am+hydrogen+landing_tanks+2*landing_am)


def evaluate(base, traj, speed, scenario, direct=False):
    ex = (dict(effective=speed,annihilated_fraction=1.,reaction_fraction=0.)
          if direct else exhaust(speed, scenario['efficiency']))
    ratio = math.exp(2*math.atanh(traj['beta'])/ex['effective'])
    spent = ratio-1
    reserve = .05
    # Per tonne retained at end of main braking, before landing/staging.
    am = .5*ex['annihilated_fraction']*spent
    reaction = ex['reaction_fraction']*spent
    peak_W_per_t = ratio*1000*traj['acceleration_m_s2']*C*ex['annihilated_fraction']/ex['effective']
    # Radiator planform emits from two faces, 2000 K, emissivity .9, 5 kg/m2.
    radiator_kg_per_W = scenario['absorbed_fraction']*5/(2*.9*SIGMA*2000**4)
    power_hardware = peak_W_per_t*(1/scenario['engine_W_kg']+radiator_kg_per_W)/1000
    tanks = scenario['tank_fraction']*(1+reserve)*reaction
    containment = scenario['containment_kg_kg']*(1+reserve)*am
    # 25% allowance on new hardware, not on fuel. Reserve fuel is carried
    # throughout and counted in final mass, so the equation closes exactly.
    feedback = reserve*spent+1.25*(power_hardware+tanks+containment)
    if feedback >= 1:
        return None
    arrival = base['base_arrival_t']/(1-feedback)
    peak = peak_W_per_t*arrival
    return dict(exhaust_c=speed, effective_exhaust_c=ex['effective'], **traj,
                mass_ratio=ratio, feedback_fraction=feedback,
                arrival_before_staging_t=arrival, departure_t=ratio*arrival,
                main_am_burned_t=am*arrival, main_am_loaded_t=(1+reserve)*am*arrival,
                total_am_loaded_t=(1+reserve)*am*arrival+base['auxiliary_am_t'],
                reaction_loaded_t=(1+reserve)*reaction*arrival,
                main_reserve_t=reserve*spent*arrival,
                engine_t=peak/scenario['engine_W_kg']/1000,
                hot_radiator_t=peak*radiator_kg_per_W/1000,
                tank_t=tanks*arrival, containment_t=containment*arrival,
                dry_t=base['fixed_dry_t']+base['landing_tanks_t']+1.25*(power_hardware+tanks+containment)*arrival,
                peak_annihilation_TW=peak/1e12,
                heat_rejected_GW=peak*scenario['absorbed_fraction']/1e9,
                peak_thrust_MN=ratio*arrival*1000*traj['acceleration_m_s2']/1e6)


def optimise(base, scenario, grid=90):
    best = None
    # Exhaust range spans all minima of the explored cases. Burn interval is
    # deliberately bounded: 0.1 year to 49% mission for EACH burn.
    def search(blo,bhi,ulo,uhi,n):
        nonlocal best
        for i in range(n+1):
            burn = blo+(bhi-blo)*i/n
            traj = trajectory(base['years'],burn)
            for j in range(n+1):
                u = ulo+(uhi-ulo)*j/n
                item = evaluate(base,traj,u,scenario)
                if item and (best is None or item['total_am_loaded_t'] < best['total_am_loaded_t']):
                    best = item
    search(.1,base['years']*.49,.025,.95,grid)
    if best:
        for step in [.01,.002]:
            search(max(.1,best['burn_years']-base['years']*step),
                   min(base['years']*.49,best['burn_years']+base['years']*step),
                   max(.025,best['exhaust_c']-step*2),min(.95,best['exhaust_c']+step*2),35)
    return best


def build_study():
    results = {}
    for name,scenario in SCENARIOS.items():
        cargo_base = ledger('cargo',60)
        cargo = optimise(cargo_base,scenario)
        crews = {}
        for years in [40,30,20]:
            pair_cargo_base = ledger('cargo',years+20)
            pair_cargo = optimise(pair_cargo_base,scenario)
            base = ledger('crew',years)
            crew = optimise(base,scenario)
            crews[str(years)] = dict(base=base,crew=crew,cargo_base=pair_cargo_base,cargo=pair_cargo,
                fleet_am_t=crew['total_am_loaded_t']+pair_cargo['total_am_loaded_t'] if crew and pair_cargo else None,
                fleet_departure_t=crew['departure_t']+pair_cargo['departure_t'] if crew and pair_cargo else None)
        results[name] = dict(assumptions=scenario,cargo_base=cargo_base,cargo=cargo,missions=crews)
    sensitivities = {}
    for multiplier in [.5,2]:
        sensitivities[str(multiplier)] = optimise(ledger('crew',40,multiplier),SCENARIOS['reference'])
    thermal = {}
    for fraction in [1e-6,1e-4,1e-3,.01]:
        scenario = dict(SCENARIOS['reference'], absorbed_fraction=fraction)
        thermal[str(fraction)] = optimise(ledger('crew',40),scenario)
    direct = {}
    for u in [.5,.7,1.]:
        ships = {}
        for kind,years in [('crew',40),('cargo',60)]:
            candidates = [evaluate(ledger(kind,years),trajectory(years,.1+(years*.49-.1)*i/500),
                                   u,SCENARIOS['reference'],direct=True) for i in range(501)]
            candidates = [x for x in candidates if x]
            ships[kind] = min(candidates,key=lambda x:x['total_am_loaded_t']) if candidates else None
        direct[str(u)] = ships
    landing = {}
    for isp in [450,900,1800]:
        landing[str(isp)] = {kind:optimise(ledger(kind,years,landing_isp=isp),SCENARIOS['reference'])
                             for kind,years in [('crew',40),('cargo',60)]}
    return dict(status='Conditional allocations, not engineering feasibility or a global minimum',
                scenarios=results,crew_40_shield_mass_sensitivity=sensitivities,
                crew_40_thermal_sensitivity=thermal,direct_annihilation_40_60=direct,
                landing_isp_sensitivity=landing)


if __name__ == '__main__':
    result = build_study()
    (ROOT/'reports'/'family-fleet-trade.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    for name,data in result['scenarios'].items():
        for years,item in data['missions'].items():
            c = item['crew']
            print(name,years,'fleet AM',item['fleet_am_t'],'fleet departure',item['fleet_departure_t'],
                  'crew dry',c['dry_t'] if c else None)
