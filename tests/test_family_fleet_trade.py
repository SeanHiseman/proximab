import math
import unittest

from calculations.family_fleet_trade import (C, YEAR, SCENARIOS, build_study, evaluate,
                                             exhaust, ledger, optimise, trajectory)


class FamilyFleetTests(unittest.TestCase):
    def test_trajectory_distance_and_clock(self):
        for years in [20,30,40,60]:
            t = trajectory(years,2)
            b = t['beta']
            g = 1/math.sqrt(1-b*b)
            a = t['acceleration_m_s2']*YEAR/C
            self.assertAlmostEqual(2*(g-1)/a+b*(years-4),4.24,places=10)
            self.assertLess(t['proper_years'],years)

    def test_exhaust_energy_momentum(self):
        for eta in [.3,.5,1.]:
            u = .2
            ex = exhaust(u,eta)
            g = 1/math.sqrt(1-u*u)
            fuel = (g-1)/eta
            # Energy per kg massive exhaust, in c^2 units.
            self.assertAlmostEqual(1+fuel,g+(1-eta)*fuel)
            self.assertAlmostEqual(ex['effective']*(1+fuel),g*u)
            self.assertAlmostEqual(ex['reaction_fraction']+ex['annihilated_fraction'],1)

    def test_lossless_recovers_earlier_formula(self):
        for u in [.1,.3,.8]:
            ex = exhaust(u,1.)
            self.assertAlmostEqual(ex['effective'],u)
            self.assertAlmostEqual(ex['annihilated_fraction'],1-math.sqrt(1-u*u))

    def test_mass_and_fuel_closure(self):
        base = ledger('crew',40)
        item = evaluate(base,trajectory(40,3),.25,SCENARIOS['reference'])
        hardware = 1.25*sum(item[k] for k in ['engine_t','hot_radiator_t','tank_t','containment_t'])
        self.assertAlmostEqual(item['arrival_before_staging_t'],
                               base['base_arrival_t']+hardware+item['main_reserve_t'])
        spent = item['departure_t']-item['arrival_before_staging_t']
        self.assertAlmostEqual(spent,2*item['main_am_burned_t']+item['reaction_loaded_t']/1.05)
        self.assertAlmostEqual(item['departure_t'],base['base_arrival_t']+hardware+
                               2*item['main_am_loaded_t']+item['reaction_loaded_t'])

    def test_landing_tank_feedback(self):
        b = ledger('crew',40)
        from calculations.mission_calculations import G
        self.assertAlmostEqual(b['landing_hydrogen_t'],
                               1.1*math.expm1(6000/(1800*G))*b['landed_without_unused_reserves_t'])

    def test_impossible_hardware_rejected(self):
        bad = dict(SCENARIOS['reference'],engine_W_kg=1)
        self.assertIsNone(evaluate(ledger('crew',40),trajectory(40,3),.25,bad))

    def test_search_resolution(self):
        base = ledger('crew',40)
        a = optimise(base,SCENARIOS['reference'])
        b = optimise(base,SCENARIOS['reference'],grid=180)
        self.assertLess(abs(a['total_am_loaded_t']/b['total_am_loaded_t']-1),.001)

    def test_fixed_twenty_year_cargo_lead_and_fleet_totals(self):
        study = build_study()
        for scenario in study['scenarios'].values():
            for years,item in scenario['missions'].items():
                self.assertEqual(item['cargo_base']['years'],int(years)+20)
                if item['crew'] and item['cargo']:
                    self.assertAlmostEqual(item['fleet_am_t'],
                        item['crew']['total_am_loaded_t']+item['cargo']['total_am_loaded_t'])


if __name__ == '__main__':
    unittest.main()
