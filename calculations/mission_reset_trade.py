"""Ideal rocket benchmark, not a spacecraft mass estimate or global optimum.

Instantaneous acceleration/braking, no reserves, constant massive exhaust speed,
50% annihilation-to-exhaust kinetic efficiency. Retained mass includes everything
left after braking. Ordinary annihilation reactant is additional to reaction mass.
"""
import json
import math

from calculations.family_fleet_trade import ROOT, exhaust


def benchmark(years, retained_t=100):
    beta = 4.24/years
    best = None
    for i in range(100,9999):
        speed = i/10000
        ex = exhaust(speed,.5)
        ratio = math.exp(2*math.atanh(beta)/ex['effective'])
        lost = retained_t*(ratio-1)
        am = lost*ex['annihilated_fraction']/2
        if best is None or am < best['antimatter_t']:
            best = dict(years=years,cruise_c=beta,exhaust_c=speed,
                retained_t=retained_t,antimatter_t=am,ordinary_annihilation_reactant_t=am,
                reaction_mass_t=lost*ex['reaction_fraction'],departure_t=ratio*retained_t)
    return best


if __name__ == '__main__':
    rows = [benchmark(years) for years in [15,20,25,30,40]]
    for row in rows:
        assert math.isclose(row['departure_t'],row['retained_t']+2*row['antimatter_t']+row['reaction_mass_t'])
    assert all(a['antimatter_t'] > b['antimatter_t'] for a,b in zip(rows,rows[1:]))
    report = dict(status=__doc__,cases=rows)
    (ROOT/'reports'/'mission-reset-trade.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
