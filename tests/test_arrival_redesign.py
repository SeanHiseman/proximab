import unittest

from calculations.arrival_redesign import build_redesign


class ArrivalRedesignTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r=build_redesign()

    def test_orbital_transfer_does_not_delete_cruise_inventory(self):
        a,b=self.r['crew_ledger_before'],self.r['crew_ledger_after']
        self.assertEqual(a['fixed_inventory_t'],b['fixed_inventory_t'])
        self.assertAlmostEqual(sum(x[1] for x in a['hardware_rows']),sum(x[1] for x in b['hardware_rows']))
        self.assertAlmostEqual(self.r['nonpropulsion_core_saving_t'],
            sum(a['landing'][k]-b['landing'][k] for k in ['loaded_t','tank_with_margin_t']))
        self.assertAlmostEqual(a['landing']['base_t']-b['landing']['base_t'],52.5)

    def test_lander_inventory_and_touchdown_close(self):
        b=self.r['crew_ledger_after'];l=b['landing']
        self.assertAlmostEqual(l['touchdown_t'],235.1919811972)
        self.assertAlmostEqual(l['loaded_t'],1.1*l['burned_t'])
        self.assertAlmostEqual(l['entry_t']-l['burned_t'],l['touchdown_t'])

    def test_engine_and_radiator_mass_not_hidden_in_fixed_allocation(self):
        for r in [self.r['sampled_minimum_AM_component_closed_crew'],self.r['component_closed_cargo']]:
            self.assertAlmostEqual(r['retained_core_t'],r['nonpropulsion_core_t']+
                r['engine_with_allowance_t']+r['hot_radiator_with_allowance_t'])
            self.assertAlmostEqual(r['departure_t'],r['retained_core_t']+r['tank_and_separation_t']+
                r['fusion_t']+2*r['antimatter_t'])
        self.assertFalse(self.r['component_closed_20t_candidate_found'])
        self.assertLessEqual(self.r['fixed_allocation_comparator']['antimatter_t'],20)
