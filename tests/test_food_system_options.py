import json
import unittest
from pathlib import Path
from calculations.food_system_options import build_food_options

class FoodOptionTests(unittest.TestCase):
    def test_options_do_not_change_selected_design_and_keep_reserve_cases_separate(self):
        path=Path('reports/mass-budget.json');before=path.read_bytes();b=build_food_options();self.assertEqual(path.read_bytes(),before)
        self.assertEqual(len(b['cases']),6)
        self.assertAlmostEqual(b['edible_food_energy_W'],3874.074074074074)
        self.assertTrue(all(x['stored_food_kg']>0 for x in b['cases']))
        for hardware in [10000,20000,30000]:
            long=next(x for x in b['cases'] if x['factory_hardware_target_kg']==hardware and x['stored_edible_food_kg']>1000)
            short=next(x for x in b['cases'] if x['factory_hardware_target_kg']==hardware and x['stored_edible_food_kg']==1000)
            self.assertAlmostEqual(short['stored_food_kg'],1020)
            self.assertGreater(long['departure_mass_kg'],short['departure_mass_kg'])
    def test_greater_hardware_targets_cost_more_including_fuel(self):
        b=build_food_options()
        for reserve in sorted({x['stored_edible_food_kg'] for x in b['cases']}):
            cases=[x for x in b['cases'] if x['stored_edible_food_kg']==reserve]
            self.assertTrue(all(a['departure_mass_kg']<c['departure_mass_kg'] for a,c in zip(cases,cases[1:])))
            self.assertTrue(all(a['propulsion_antimatter_loaded_kg']<c['propulsion_antimatter_loaded_kg'] for a,c in zip(cases,cases[1:])))

if __name__=='__main__':unittest.main()
