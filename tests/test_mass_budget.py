"""Conservation and accounting checks for the conditional mass model."""
import math
import unittest
from calculations.mass_budget import build_budget


class MassBudgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.budget = build_budget()

    def test_complete_numeric_component_ledger_reconciles_all_cases(self):
        components = self.budget['components']
        self.assertEqual(len({x['id'] for x in components}), len(components))
        for case, field in zip(self.budget['cases'], ['low_kg', 'mass_kg', 'high_kg']):
            for row in components:
                self.assertTrue(math.isfinite(row[field]) and row[field] >= 0)
            self.assertAlmostEqual(sum(row[field] for row in components), case['final_retained_mass_kg'], places=6)
            self.assertGreater(case['departure_mass_kg'], case['final_retained_mass_kg'])

    def test_rest_mass_and_propellant_species_balance(self):
        for case in self.budget['cases']:
            consumed = case['direct_propellant_consumed_kg']+case['thermal_hydrogen_kg']+case['thermal_antimatter_kg']+case['thermal_matching_matter_kg']
            self.assertAlmostEqual(case['departure_mass_kg']-case['final_retained_mass_kg'], consumed, places=6)
            self.assertEqual(case['direct_antimatter_consumed_kg'], case['direct_matching_matter_consumed_kg'])
            self.assertAlmostEqual(case['propulsion_antimatter_loaded_kg']-case['direct_antimatter_consumed_kg']-case['thermal_antimatter_kg'], case['retained_direct_propellant_reserve_kg']/2, places=7)
            self.assertEqual(case['surface_antimatter_reserved_kg'], 1)
            self.assertAlmostEqual(case['hydrogen_tank_kg']/case['thermal_hydrogen_kg'], [.08,.12,.2][self.budget['cases'].index(case)])

    def test_phase_masses_are_monotone_and_retain_reserve(self):
        for case in self.budget['cases']:
            phases = list(case['nominal_phase_masses_kg'].values())
            self.assertTrue(all(a >= b for a,b in zip(phases, phases[1:])))
            self.assertEqual(phases[0], case['departure_mass_kg'])
            self.assertEqual(phases[-1], case['final_retained_mass_kg'])
            self.assertGreater(case['retained_direct_propellant_reserve_kg'], 0)

    def test_food_and_geometry_have_no_torpor_discount(self):
        food = next(x for x in self.budget['components'] if x['id'] == 'food')
        self.assertAlmostEqual(food['mass_kg'], 36*16.5*365.25*(.617+.26))
        self.assertEqual(self.budget['assumptions']['torpor_metabolic_discount'], 0)
        self.assertAlmostEqual(self.budget['geometry']['gross_floor_area_m2'], 2*2*math.pi*(28+24+20+16+12+8)*3)

    def test_hot_radiator_feedback_reconciles_and_detects_divergence(self):
        for case in self.budget['cases']:
            source = case['initial_annihilation_power_PW']*1e15
            self.assertAlmostEqual(source*case['engine_absorbed_fraction']/1e6, case['engine_absorbed_heat_MW'])
            self.assertGreater(case['critical_engine_absorbed_fraction_no_finite_mass_solution'], case['engine_absorbed_fraction'])
            self.assertGreater(case['total_radiator_emitting_area_m2'], case['service_radiator_emitting_area_m2'])
        blocked = next(x for x in self.budget['exhaust_sensitivity'] if x['case']=='high' and x['effective_exhaust_fraction_c']==.3)
        self.assertFalse(blocked['finite_solution'])
        self.assertNotIn('departure_kg', blocked)
        base_slow = next(x for x in self.budget['exhaust_sensitivity'] if x['case']=='base' and x['effective_exhaust_fraction_c']==.3)
        self.assertGreater(base_slow['departure_kg'], self.budget['nominal']['departure_mass_kg'])

    def test_invalid_exhaust_is_rejected(self):
        for fraction in [0,-.5,1.1]:
            with self.assertRaises(ValueError): build_budget(fraction)


if __name__ == '__main__':
    unittest.main()
