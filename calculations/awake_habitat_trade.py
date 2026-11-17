"""Conditional occupancy and shielding screens; not interstellar transport."""
import json
import math

from calculations.cosmic_ray_exposure import build_exposure, SOURCE
from calculations.family_fleet_trade import ROOT


def sphere_shell(volume, thickness, count=1):
    radius = (3*volume/(4*math.pi))**(1/3)
    return count*4*math.pi/3*((radius+thickness)**3-radius**3)


def build_trade():
    years = build_exposure()['occupancy']['adult_proper_exposure_years']
    days = years*365.25
    rows = []
    for fraction in [.5,.25,.125,.0625,0]:
        rows.append(dict(awake_fraction=fraction,mean_awake_adults=32*fraction,
            passive_reference_sv=days*(fraction*1.04+(1-fraction)*1.03)/1000,
            perfect_torpor_reference_sv=days*fraction*1.04/1000,
            max_torpor_rate_mSv_day_for_1_2Sv=(1200/days-fraction*1.04)/(1-fraction)))
    shells = []
    for count,volume in [(1,400),(2,200),(2,300),(2,800)]:
        shells.append(dict(count=count,internal_volume_each_m3=volume,
            water_10cm_t=sphere_shell(volume,.1,count),
            water_20cm_t=sphere_shell(volume,.2,count),
            water_40cm_t=sphere_shell(volume,.4,count)))
    return dict(status='No feasible passive solution among examined dose-rate cases',
        actual_interstellar_dose_sv=None,source=SOURCE,proper_years=years,
        children='Remain awake for baseline; adult dose factors are not child dosimetry',
        adult_budget_sv=1.2,budget_assumption='Optimistic: entire lifetime budget assigned to transit GCR',
        required_average_mSv_day=1200/days,
        required_average_with_0_6Sv_transit_budget_mSv_day=600/days,
        max_awake_fraction_perfect_torpor=1200/(days*1.04),
        occupancy_cases=rows,water_shell_geometry_lower_bounds=shells,
        child_20_year_adult_reference_at_20g_sv=20*365.25*1.04/1000,
        material_caveat='Water geometry masses cannot be assigned polyethylene dose rates without transport',
        geometry_caveat='Spheres minimize area at fixed volume; fit, gravity floors, access and tanks are unvalidated')


if __name__ == '__main__':
    result = build_trade()
    (ROOT/'reports'/'awake-habitat-trade.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
