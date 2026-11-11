import unittest
from calculations.mass_budget import build_budget
from calculations.mass_optimisation import build_optimisation

class OptimisationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.audit=build_optimisation()
    def test_reference_reproduces_existing_budget(self):
        for key in ['final_retained_mass_kg','departure_mass_kg','propulsion_antimatter_loaded_kg','thermal_hydrogen_kg']:
            self.assertAlmostEqual(self.audit['scenarios'][0][key],build_budget()['nominal'][key],places=6)
    def test_all_alternatives_balance_and_preserve_propulsion_assumptions(self):
        reference=self.audit['scenarios'][0]
        for row in self.audit['scenarios']:
            self.assertAlmostEqual(row['hardware_with_margin_kg']+row['stocks_people_kg']+row['retained_direct_propellant_reserve_kg'],row['final_retained_mass_kg'],places=6)
            self.assertAlmostEqual(row['departure_mass_kg']/row['final_retained_mass_kg'],reference['departure_mass_kg']/reference['final_retained_mass_kg'])
            self.assertAlmostEqual(row['hardware_margin_kg']/row['hardware_before_margin_kg'],.25)
            self.assertEqual(row['propulsion_antimatter_loaded_kg'],row['propulsion_matching_matter_loaded_kg'])
    def test_compact_area_and_crew_programme_fit_allocated_net_area(self):
        geometry=self.audit['compact_geometry'];self.assertEqual(geometry['disc_count'],2)
        self.assertEqual(geometry['all_awake_occupants_per_disc'],18)
        self.assertEqual(geometry['area_allocations_per_disc_m2']['private_cabins'],9*12)
        self.assertLessEqual(2*sum(geometry['area_allocations_per_disc_m2'].values()),geometry['net_floor_area_m2_assumed'])
        self.assertAlmostEqual(geometry['spin_rpm'],4.9840279533,places=8)
    def test_stock_and_farm_cases_do_not_hide_metabolism_credit(self):
        scenarios=self.audit['scenarios'];normal=scenarios[4];farm=scenarios[5];torpor=scenarios[7]
        food=lambda row:next(r['mass_kg'] for r in row['components_before_derived'] if r['id']=='food')
        self.assertAlmostEqual(food(normal),36*16.5*365.25*(.617+.1))
        self.assertAlmostEqual(food(farm),36*2*365.25*(.617+.1))
        self.assertTrue(any(r['id']=='flightfarm_startup' and r['mass_kg']==15000 for r in farm['components_before_derived']))
        self.assertLess(food(torpor),food(normal));self.assertTrue(torpor['speculative'])

if __name__=='__main__': unittest.main()
