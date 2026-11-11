import math
import unittest

from calculations.mission_300_trade import build_target, nutrition, SIGMA


class Mission300Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.trade = build_target()

    def test_occupancy_uses_latest_descent_exception(self):
        p = self.trade['occupancy']
        for phase in ['departure','coast','arrival_braking']:
            self.assertEqual(p[phase+'_awake'],8)
        self.assertEqual(p['descent_awake'],32)
        self.assertEqual(self.trade['food']['transit']['kcal_day'],56000)
        self.assertEqual(self.trade['food']['descent_and_surface']['kcal_day'],80000)

    def test_food_macronutrient_energy_and_biomass_balance(self):
        for food in [nutrition(8,24),nutrition(32,0)]:
            self.assertAlmostEqual(food['protein_kg_day']*4000+food['lipid_kg_day']*9000+
                                   food['carbohydrate_kg_day']*4000,food['kcal_day'])
            b = food['protein_biomass_kg_day']
            self.assertAlmostEqual(.65*b,food['protein_kg_day'])
            self.assertAlmostEqual(.1*b+food['additional_lipid_kg_day'],food['lipid_kg_day'])
            self.assertAlmostEqual(.15*b+food['additional_carbohydrate_kg_day'],food['carbohydrate_kg_day'])

    def test_process_volumes_deliver_required_output(self):
        food = self.trade['food']
        keys = {'protein_biomass':'protein_biomass_kg_day','carbohydrate':'additional_carbohydrate_kg_day',
                'lipid':'additional_lipid_kg_day'}
        for key, output_key in keys.items():
            production = food['one_train_working_volume_L'][key]*food['productivity_g_L_h'][key]*24*.8/1000
            self.assertAlmostEqual(production,food['transit'][output_key])
            self.assertLessEqual(food['surface_operating_volume_L'][key],2*food['one_train_working_volume_L'][key])
        self.assertEqual(sum(food['hardware_allocation_kg'].values()),3000)
        self.assertLess(food['surface_process_volume_L']+1000,food['assumed_water_inventory_kg'])

    def test_radiator_capacity_area_and_mass_conventions(self):
        for loop in self.trade['thermal']['loops']:
            self.assertAlmostEqual(loop['emitting_area_m2'],2*loop['two_sided_panel_area_m2'])
            capacity = loop['emitting_area_m2']*.9*SIGMA*loop['temperature_K']**4
            self.assertAlmostEqual(capacity,loop['heat_W']*loop['area_factor'],places=5)
            self.assertAlmostEqual(loop['mass_kg'],loop['emitting_area_m2']*loop['kg_per_emitting_m2'])

    def test_relay_cap_includes_braking_fuel_and_all_hardware_allowance(self):
        r = self.trade['relay_chain']
        self.assertLessEqual(r['total_with_dry_allowance_kg'],100)
        self.assertAlmostEqual(r['braking_matter_plus_antimatter_kg']+r['dry_hardware_kg'],
                               r['count']*r['nominal_node_all_up_kg']+r['dispenser_kg'])
        self.assertAlmostEqual(r['dry_hardware_kg']*self.trade['hardware_margin_fraction'],r['dry_development_allowance_kg'])
        cases = r['receiver_cases']
        self.assertAlmostEqual(cases[-1]['detected_photons_s']/cases[-2]['detected_photons_s'],4)
        self.assertGreater(cases[-1]['bare_film_kg_at_1um'],r['node_dry_hardware_kg'])
        self.assertLess(cases[-1]['bare_film_kg_at_quarter_um'],r['node_dry_hardware_kg'])

    def test_full_mass_ledger_and_individual_equipment_allocations_close(self):
        t = self.trade
        self.assertAlmostEqual(sum(r['target_kg'] for r in t['items']),t['total_without_fuels_kg'])
        self.assertEqual(len(t['items']),len({r['id'] for r in t['items']}))
        self.assertAlmostEqual(t['dry_mass_kg']+t['unallocated_headroom_kg'],300000)
        self.assertGreater(t['dry_if_25_percent_allowance_kg'],300000)
        rows = {r['id']:r for r in t['items']}
        self.assertEqual(rows['bulkcontainment']['target_kg'],38000)
        self.assertEqual(rows['cruiseengine']['target_kg'],25000)
        self.assertEqual(sum(t['avionics_breakdown_kg'].values()),750)
        self.assertEqual(sum(t['spares_breakdown_kg'].values()),3000)


if __name__ == '__main__':
    unittest.main()
