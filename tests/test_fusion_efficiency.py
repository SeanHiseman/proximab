import unittest

from calculations.depleted_staged_tanks import MIN_SPEED,calculate,optimise


class FusionEfficiencyTests(unittest.TestCase):
    def test_lower_coupling_requires_more_am_at_same_exhaust_profile(self):
        a=calculate(MIN_SPEED,.2,annihilation_coupling=.8)
        b=calculate(MIN_SPEED,.2,annihilation_coupling=.5)
        self.assertGreater(b['antimatter_t'],a['antimatter_t'])
        for r in [a,b]:
            self.assertAlmostEqual(r['departure_t'],500+r['tank_and_separation_t']+r['fusion_t']+2*r['antimatter_t'])

    def test_low_coupling_cap_case_reports_hardware_failure(self):
        r=optimise(20,annihilation_coupling=.02)
        self.assertLessEqual(r['antimatter_t'],20)
        self.assertLess(r['core_left_after_engine_and_hot_radiator_t'],0)

    def test_electrical_fusion_baseline_is_independent_of_am_coupling(self):
        a=calculate(MIN_SPEED,MIN_SPEED,electrical_fusion=True,annihilation_coupling=.8)
        b=calculate(MIN_SPEED,MIN_SPEED,electrical_fusion=True,annihilation_coupling=.02)
        self.assertAlmostEqual(a['fusion_t'],b['fusion_t'])
        self.assertEqual(a['antimatter_t'],0)
