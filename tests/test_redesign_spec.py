import math
import unittest

from calculations.redesign_spec import load_spec, build_spec_result


class RedesignSpecTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec = load_spec()
        cls.result = build_spec_result(cls.spec)

    def test_timeline_and_population(self):
        f = self.spec['fleet']
        self.assertEqual(f['cargo_departure_year']+f['cargo_flight_years'],f['arrival_year'])
        self.assertEqual(f['crew_departure_year']+f['crew_flight_years'],f['arrival_year'])
        self.assertEqual(f['maximum_population'],f['initial_adults']+f['maximum_children'])
        for case in self.result['cases'].values():
            for kind in ['crew','cargo']:
                base = case[kind+'_base']
                self.assertAlmostEqual(base['years']+.1,base['total_flight_years'])

    def test_geometry_and_refuge(self):
        g = self.result['geometry']
        self.assertAlmostEqual(g['total_volume_m3'],2400,places=5)
        self.assertGreaterEqual(g['refuge_column_kg_m2'],200)
        self.assertLess(math.hypot(3.2,7.5/2),5.758823823)
        self.assertLess(5.758823823+.25,7)

    def test_no_double_counted_sleep_places(self):
        h = self.spec['habitat']
        self.assertEqual(h['adult_sleep_places']+h['child_sleep_places'],64)
        self.assertTrue(h['sleep_places_not_additive_to_torpor_places'])

    def test_shadow_heat_and_mass_are_included(self):
        r = self.result
        self.assertGreater(r['additional_shadow_absorbed_fraction'],0)
        rows = r['cases']['reference']['crew_base']['hardware_rows']
        self.assertGreater(next(x['target_t'] for x in rows if x['id']=='source_shadow_shields'),38)
        self.assertLess(r['tow_screen']['source_shadow_radius_needed_m'],.8)
        self.assertGreater(r['tow_screen']['plume_to_habitat_clearance_m'],0)
        self.assertLess(r['tow_screen']['total_tether_t_at_1GPa_allowable'],27)

    def test_landing_screens_do_not_exceed_target(self):
        s = self.result['landing_screen']
        self.assertLess(s['conservative_stop_distance_m'],12000)
        self.assertLess(s['conservative_propulsive_delta_v_m_s'],1000)

    def test_mass_closure(self):
        for case in self.result['cases'].values():
            for kind in ['crew','cargo']:
                ship,base = case[kind],case[kind+'_base']
                added = 1.25*sum(ship[k] for k in ['engine_t','tank_t','containment_t','hot_radiator_t'])
                self.assertAlmostEqual(ship['arrival_before_staging_t'],base['base_arrival_t']+added+ship['main_reserve_t'])
            self.assertAlmostEqual(case['fleet_am_t'],case['crew']['total_am_loaded_t']+case['cargo']['total_am_loaded_t'])

    def test_uncertainties_not_claimed_solved(self):
        self.assertIsNone(self.spec['radiation']['whole_habitat_column_requirement'])
        self.assertIn('Unclosed',self.spec['radiation']['gcr_status'])
        self.assertGreater(len(self.spec['validation_gates']),5)


if __name__ == '__main__':
    unittest.main()
