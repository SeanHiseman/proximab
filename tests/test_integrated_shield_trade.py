import math
import unittest

from calculations.family_fleet_trade import SCENARIOS, trajectory
from calculations.integrated_shield_trade import (OPTIONS, hydrogen_shell,
    integrated_base, integrated_case, optimise_integrated)


class IntegratedShieldTests(unittest.TestCase):
    def case(self, option='compact_20_hydrogen', reserve=1):
        o = OPTIONS[option]
        return integrated_case(integrated_base(40,o),trajectory(40,2.5),.23,
                               SCENARIOS['reference'],o,reserve)

    def test_column_survives_entire_nominal_braking(self):
        for option in OPTIONS:
            item = self.case(option)
            target = OPTIONS[option]['column']/10
            profile = item['braking_profile']
            self.assertGreaterEqual(min(p['coverage_g_cm2'] for p in profile),target-1e-9)
            self.assertTrue(all(a['available_water_t'] >= b['available_water_t']
                                for a,b in zip(profile,profile[1:])))

    def test_conservative_case_does_not_spend_reserve_twice(self):
        item = self.case(reserve=0)
        self.assertGreaterEqual(item['end_column_after_using_all_main_reserve_g_cm2'],20-1e-9)
        self.assertGreater(item['extra_retained_water_t'],self.case()['extra_retained_water_t'])

    def test_retained_water_and_tank_feedback(self):
        item = self.case('compact_20')
        base = integrated_base(40,OPTIONS['compact_20'])
        extra = item['extra_retained_water_t']+item['extra_water_tanks_with_allowance_t']
        self.assertAlmostEqual(item['arrival_before_staging_t']*(1-item['feedback_fraction']),
                               base['base_arrival_t']+extra)
        self.assertAlmostEqual(item['extra_water_tanks_with_allowance_t'],
                               1.25*.05*item['extra_retained_water_t'])

    def test_landing_water_and_tanks_are_carried(self):
        base = integrated_base(40,OPTIONS['compact_20_hydrogen'])
        from calculations.mission_calculations import G
        self.assertEqual(base['changes']['retained_surface_water_t'],40)
        self.assertAlmostEqual(base['landing_hydrogen_t'],
                               1.1*math.expm1(6000/(1800*G))*base['landed_without_unused_reserves_t'])

    def test_hydrogen_volume_and_radial_column(self):
        shell = hydrogen_shell(150)
        t = shell['thickness_m']
        radii = [(v/(2*math.pi))**(1/3)+.2 for v in [1600,800]]
        volume = sum(math.pi*((r+t)**2*(2*r+2*t)-2*r**3) for r in radii)
        self.assertAlmostEqual(volume*70.8/1000,150)
        self.assertAlmostEqual(shell['column_kg_m2'],70.8*t)
        # Curvature prevents crediting all shell mass as a flat inner-area wall.
        inner_area = sum(6*math.pi*r*r for r in radii)
        self.assertLess(shell['column_kg_m2']*inner_area/1000,150)

    def test_hydrogen_is_not_created_or_double_counted(self):
        item = self.case()
        base = item['base']
        self.assertLess(item['hydrogen_column_mass_credit_t'],base['landing_hydrogen_t'])
        self.assertAlmostEqual(item['end_braking_column_g_cm2'],100/1280*(
            item['extra_retained_water_t']+item['retained_surface_water_t']+4+
            item['hydrogen_column_mass_credit_t']+item['nominal_reserve_water_t']))

    def test_resolution_at_water_constraint(self):
        args = (40,SCENARIOS['reference'],OPTIONS['compact_20_hydrogen'])
        a = optimise_integrated(*args)
        b = optimise_integrated(*args,grid=140)
        self.assertLess(abs(a['total_am_loaded_t']/b['total_am_loaded_t']-1),.002)


if __name__ == '__main__':
    unittest.main()
