import unittest
from calculations.staged_baseline import ASSUMPTIONS, build_baseline, evaluate


class StagedBaselineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r=build_baseline()['selected']

    def test_loaded_mass_closes_with_retained_reserves(self):
        r=self.r
        self.assertAlmostEqual(r['departure_t'],r['dry_hardware_and_nonpropulsion_allocation_t']+
            r['loaded_fusion_t']+2*r['loaded_antimatter_t'])
        self.assertAlmostEqual(r['departure_t'],r['arrival_t']+r['discarded_t']+
            sum(p['spent_t'] for p in r['phases']))
        self.assertAlmostEqual(r['hardware']['retained_reserve_t'],.05*sum(p['spent_t'] for p in r['phases']))

    def test_fixed_point_includes_engine_radiator_and_reserve_tanks(self):
        r=self.r;h=r['hardware']
        expected=300+1.25*(h['engine_t']+h['radiator_t'])+h['retained_reserve_t']+h['retained_reserve_storage_with_margin_t']
        self.assertAlmostEqual(r['base_t'],expected,places=5)
        self.assertAlmostEqual(h['engine_t']*1000*ASSUMPTIONS['engine_W_kg'],h['peak_power_TW']*1e12,delta=1)

    def test_factory_efficiency_changes_energy_not_flight_mass(self):
        x=evaluate(1.25,.24,.47,dict(ASSUMPTIONS,manufacturing_efficiency=.8))
        self.assertAlmostEqual(x['departure_t'],self.r['departure_t'])
        self.assertLess(x['primary_energy_loaded_fuel_ZJ'],self.r['primary_energy_loaded_fuel_ZJ'])

    def test_excess_heat_can_prevent_mass_closure(self):
        self.assertIsNone(evaluate(1.25,.24,.47,dict(ASSUMPTIONS,absorbed_power_fraction=.001)))

    def test_only_empty_acceleration_storage_and_kit_are_discarded(self):
        r=self.r
        self.assertAlmostEqual(r['discarded_t'],r['phases'][0]['tank_hardware_t']+5*1.25)
        self.assertAlmostEqual(r['arrival_t'],r['base_t']+r['phases'][1]['tank_hardware_t'])
