import unittest
from calculations.onboard_energy_trade import case, supplement_for_speed
from calculations.family_fleet_trade import C


class OnboardEnergyTests(unittest.TestCase):
    def test_mass_accounts_for_both_annihilation_reactants(self):
        for r in [case('electrical'),case('ignition'),case('supplement',supplement_for_speed(.2))]:
            self.assertAlmostEqual(r['departure_t'],r['retained_t']+r['fuel_t']+2*r['antimatter_t'])

    def test_manufacturing_not_annihilation_is_added_to_primary_energy(self):
        r=case('ignition')
        production=2*r['antimatter_t']*1000*C*C/.01
        self.assertAlmostEqual(r['antimatter_manufacturing_J']/production,1)
        self.assertAlmostEqual(r['primary_energy_excluding_construction_J']/(production+r['fusion_energy_J']),1)

    def test_processing_cost_does_not_vanish(self):
        r=case('electrical',processing_J_kg=1e12)
        self.assertAlmostEqual(r['prelaunch_energy_excluding_construction_J']/(r['fuel_t']*1000*1e12),1)

    def test_ignition_is_zero_boost_endpoint(self):
        self.assertEqual(case('ignition')['antimatter_t'],case('supplement',0)['antimatter_t'])
        self.assertAlmostEqual(case('supplement',supplement_for_speed(.2))['exhaust_c'],.2)

    def test_production_efficiency_changes_cost_not_rocket_performance(self):
        a=case('ignition',production_efficiency=.01)
        b=case('ignition',production_efficiency=.1)
        self.assertEqual(a['departure_t'],b['departure_t'])
        self.assertAlmostEqual(a['antimatter_manufacturing_J']/b['antimatter_manufacturing_J'],10)
