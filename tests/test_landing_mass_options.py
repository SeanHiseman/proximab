import unittest
from calculations.landing_mass_options import build_landing_options

class LandingOptionTests(unittest.TestCase):
    def test_switching_later_reduces_hydrogen_and_ignition_mass(self):
        cases=build_landing_options()['cases']
        for old,new in zip(cases,cases[1:]):
            self.assertGreater(old['thermal_hydrogen_kg'],new['thermal_hydrogen_kg'])
            self.assertGreater(old['final_retained_mass_kg']+old['thermal_hydrogen_kg'],new['final_retained_mass_kg']+new['thermal_hydrogen_kg'])
        one=cases[-1]
        self.assertAlmostEqual(one['ideal_terminal']['thermal_burn_seconds'],18.4994790671,places=6)
        self.assertGreater(one['thermal_delta_v_km_s_budget'],one['ideal_terminal']['thermal_delta_v_km_s_no_reserves'])
        self.assertLess(one['thermal_hydrogen_kg'],14000)
    def test_every_case_preserves_staged_ship_and_species_balance(self):
        for c in build_landing_options()['cases']:
            self.assertAlmostEqual(c['departure_mass_kg']-c['final_retained_mass_kg']-c['flight_hardware_and_stocks_left_behind_kg'],c['direct_propellant_consumed_kg']+c['thermal_hydrogen_kg']+2*c['thermal_antimatter_kg'],places=6)
            self.assertAlmostEqual(c['propulsion_antimatter_loaded_kg'],c['propulsion_matching_matter_loaded_kg'])
            self.assertGreater(c['final_retained_mass_kg'],350000)
            self.assertGreater(c['flight_hardware_and_stocks_left_behind_kg'],170000)
