import math
import unittest

from calculations.depleted_staged_tanks import calculate,MIN_SPEED
from calculations.retained_tank_trade import mixture,solve
from calculations.onboard_energy_trade import Q,IGNITION_GAIN


class DepletedTankTests(unittest.TestCase):
    def test_segment_mass_momentum_and_total_ledger_close(self):
        r=calculate(MIN_SPEED,.16)
        self.assertEqual(r['retained_propulsion_fuel_t'],0)
        self.assertAlmostEqual(r['departure_t'],500+r['tank_and_separation_t']+r['fusion_t']+2*r['antimatter_t'])
        for segment in r['segments']:
            self.assertAlmostEqual(segment['before_t']-segment['after_burn_t'],segment['spent_t'])
            self.assertAlmostEqual(segment['after_burn_t']-segment['after_drop_t'],segment['tank_and_separation_t'])
            u=r['exhaust_c'][segment['phase']]
            a=Q/IGNITION_GAIN+((1/math.sqrt(1-u*u)-1)*(1-Q)-.8*Q)/.8
            w=mixture(a,.01,.5,.8,.8)['effective_exhaust_c']
            self.assertAlmostEqual(math.log(segment['before_t']/segment['after_burn_t'])*w,
                math.atanh(r['trajectory']['beta'])/8)
        self.assertAlmostEqual(r['segments'][-1]['after_drop_t'],500)

    def test_massless_tank_case_matches_existing_rocket_solver(self):
        u,v=MIN_SPEED,.16
        mixes=[]
        for speed in [u,v]:
            a=Q/IGNITION_GAIN+((1/math.sqrt(1-speed*speed)-1)*(1-Q)-.8*Q)/.8
            mixes.append(mixture(a,0,0,.8,.8))
        r=calculate(u,v,tanks=False)
        old=solve(*mixes,.5,r['trajectory']['beta'],False,500)
        self.assertAlmostEqual(r['departure_t'],old['departure_t'],places=6)
        self.assertAlmostEqual(r['antimatter_t'],old['antimatter_t'],places=6)

    def test_discarding_empty_modules_earlier_saves_fuel(self):
        one=calculate(MIN_SPEED,.16,stages=1)
        eight=calculate(MIN_SPEED,.16,stages=8)
        self.assertLess(eight['fusion_t'],one['fusion_t'])
        self.assertEqual(len(eight['segments']),16)

    def test_electrical_fusion_cargo_uses_no_antimatter(self):
        r=calculate(MIN_SPEED,MIN_SPEED,core_t=260,burn_years=.75,transfer_years=39.9,electrical_fusion=True)
        self.assertEqual(r['antimatter_t'],0)
        self.assertEqual(r['ignition_antimatter_t'],0)
