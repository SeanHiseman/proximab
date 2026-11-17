import unittest

from calculations.protection_requirements import maximum_shelter_rate, water_shell, build_requirements


class ProtectionRequirementsTests(unittest.TestCase):
    def test_occupancy_budget_closes(self):
        rate = maximum_shelter_rate(7000, 600, .05, 1.04)
        self.assertAlmostEqual(7000*(.05*1.04+.95*rate), 600)
        self.assertLess(maximum_shelter_rate(7000, 600, .25, 1.04), 0)

    def test_dividing_volume_increases_shell_mass(self):
        self.assertGreater(water_shell(375,.2,2), water_shell(750,.2,1))

    def test_baseline_reproduced_without_dose_credit(self):
        r = build_requirements()
        self.assertIsNone(r['actual_transport_result_mSv'])
        self.assertAlmostEqual(r['fixed_profile_mass_sensitivity'][0]['fleet_antimatter_t'], 92.335151, places=4)
        self.assertGreater(r['fixed_profile_mass_sensitivity'][-1]['fleet_antimatter_t'], 160)
