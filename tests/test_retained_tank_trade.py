import math
import unittest
from calculations.retained_tank_trade import mixture, solve, optimise
from calculations.family_fleet_trade import trajectory


class RetainedTankTests(unittest.TestCase):
    beta=trajectory(19.9,1)['beta']

    def test_retained_and_staged_mass_and_burns_close(self):
        f,l=mixture(.03),mixture(.15)
        for staged in [False,True]:
            r=solve(f,l,.1,self.beta,staged)
            self.assertIsNotNone(r)
            p1,p2=[p['spent_t'] for p in r['phases']]
            self.assertAlmostEqual(r['departure_t'],r['arrival_t']+p1+p2+r['discarded_t'])
            self.assertAlmostEqual(p1+p2,r['fusion_t']+2*r['antimatter_t'])
            before_brake=r['arrival_t']+p2
            self.assertAlmostEqual(math.log(before_brake/r['arrival_t'])*l['effective_exhaust_c'],math.atanh(self.beta))
            after_accel=before_brake+r['discarded_t']
            self.assertAlmostEqual(math.log(r['departure_t']/after_accel)*f['effective_exhaust_c'],math.atanh(self.beta))

    def test_zero_tanks_zero_stage_kit_agrees_with_no_staging(self):
        m=mixture(.03,0,0)
        a=solve(m,m,.1,self.beta)
        b=solve(m,m,.1,self.beta,True,stage_kit_t=0)
        self.assertAlmostEqual(a['departure_t'],b['departure_t'])

    def test_storage_cannot_be_hidden_in_fixed_payload(self):
        m=mixture(.1)
        r=solve(m,m,.1,self.beta)
        expected=.03*(r['fusion_t']+r['ordinary_annihilation_reactant_t'])+r['antimatter_t']
        self.assertAlmostEqual(r['all_storage_t'],expected)
        self.assertAlmostEqual(r['arrival_t'],300+expected)

    def test_fusion_tank_runaway_and_staged_recovery(self):
        m=mixture(None)
        self.assertIsNone(solve(m,m,.1,self.beta))
        self.assertIsNotNone(solve(m,m,.1,self.beta,True))

    def test_material_matched_comparison_delivers_required_mass(self):
        m=mixture(.1)
        r=solve(m,m,.1,self.beta,True,arrival_floor_t=500)
        self.assertAlmostEqual(r['arrival_t'],500)
        self.assertGreaterEqual(r['base_t'],300)

    def test_optimizer_beats_example_and_does_not_spend_tanks_as_fuel(self):
        r=optimise(.1,self.beta)
        m=mixture(.1)
        self.assertLessEqual(r['primary_energy_ZJ'],solve(m,m,.1,self.beta)['primary_energy_ZJ'])
        self.assertEqual(r['discarded_t'],0)
        self.assertGreater(r['retained_storage_t'],0)
