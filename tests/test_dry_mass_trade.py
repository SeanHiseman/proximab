import math
from pathlib import Path
import unittest

from calculations.dry_mass_trade import box_shield_mass, build_trade


class DryMassTradeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.trade = build_trade()

    def test_full_ledger_closes_without_duplicate_items(self):
        rows = self.trade['items']
        self.assertEqual(len(rows), len({r['id'] for r in rows}))
        for field, totals in self.trade['totals'].items():
            hardware = sum(r[field] for r in rows if r['kind']=='hardware')
            margin = next(r[field] for r in rows if r['id']=='margin')
            self.assertAlmostEqual(margin, .25*hardware)
            self.assertAlmostEqual(sum(r[field] for r in rows), totals['total_without_fuels_kg'])

    def test_shield_volume_includes_corners_and_does_not_double_count_water(self):
        self.assertAlmostEqual(box_shield_mass([4,4.8,2.6],.2)*2,37440)
        shielding = self.trade['shielding']
        for case in shielding['cases']:
            self.assertGreater(case['full_shell_water_kg'],case['thin_shell_water_kg'])
        water = next(r['target_kg'] for r in self.trade['items'] if r['id']=='water')
        self.assertEqual(water,sum(self.trade['water_inventory_kg'].values()))
        self.assertEqual(water,shielding['credited_existing_mass_kg'])
        self.assertEqual(next(r['target_kg'] for r in self.trade['items'] if r['id']=='radiationshield'),40000)

    def test_programme_and_shield_bay_fit_envelope_screen(self):
        g = self.trade['geometry']
        self.assertLess(sum(self.trade['area_programme_m2'].values()),g['assumed_net_floor_area_m2'])
        self.assertAlmostEqual(g['spin_centre_radius_m']+g['pod_radius_m'],g['maximum_outer_radius_m'])
        # A rectangular 20 cm water shell must fit the circular pressure section;
        # this is only an envelope check, not a complete room or shield design.
        self.assertLess(math.hypot(4.8+.4,2.6+.4),2*g['pod_radius_m'])

    def test_study_preserves_configuration_and_excludes_fuel(self):
        paths = [Path(p) for p in ['data/mission_config.json','data/spacecraft_layout.json','data/habitat_layout.json']]
        before = [p.read_bytes() for p in paths]
        build_trade()
        self.assertEqual(before,[p.read_bytes() for p in paths])
        self.assertNotIn('powerfuel',{r['id'] for r in self.trade['items']})
        held = {'power','warmradiators','cruiseengine','bulkcontainment','hotradiators','hydrogentank','dustshield'}
        for r in self.trade['items']:
            if r['id'] in held:
                self.assertEqual(r['baseline_kg'],r['target_kg'])


if __name__ == '__main__':
    unittest.main()
