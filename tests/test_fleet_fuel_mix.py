import json
import unittest
from pathlib import Path

from calculations.arrival_redesign import closed
from calculations.depleted_staged_tanks import MIN_SPEED
from calculations.fleet_fuel_mix import mix, solve
from calculations.onboard_energy_trade import Q, IGNITION_GAIN


class FleetFuelMixTests(unittest.TestCase):
    def test_hybrid_matches_existing_staged_model(self):
        speeds = [MIN_SPEED,.31167897249379833]
        mixtures = []
        for u in speeds:
            a = Q/IGNITION_GAIN+((1/(1-u*u)**.5-1)*(1-Q)-.8*Q)/.8
            mixtures.append(mix(1,a))
        old = closed(*speeds,core_t=428.1849689143086,burn_years=1.75)
        new = solve(428.1849689143086,19.9,1.75,*mixtures)
        for key in ['fusion_t','antimatter_t','departure_t','retained_core_t','tank_and_separation_t','primary_ZJ']:
            self.assertAlmostEqual(new[key],old[key],places=6)

    def test_mass_and_hardware_close_for_each_endpoint(self):
        for m in [mix(1,0),mix(.5,.05),mix(0,.1),mix(0,0,True)]:
            r=solve(239.24905098668958,39.9,2,m,m)
            self.assertIsNotNone(r)
            self.assertAlmostEqual(r['departure_t'],r['retained_core_t']+
                r['tank_and_separation_t']+r['fusion_t']+r['inert_reaction_mass_t']+2*r['antimatter_t'])
            self.assertAlmostEqual(r['retained_core_t'],r['nonpropulsion_core_t']+r['engine_t']+r['radiator_t'])

    def test_endpoints_do_not_hide_fuel(self):
        self.assertEqual(mix(1,0)['am'],0)
        self.assertEqual(mix(0,.1)['fusion'],0)
        photon=mix(0,0,True)
        self.assertEqual(photon['inert'],0)
        self.assertEqual(photon['am'],.5)
        for m in [mix(.5,.01),mix(0,0,True)]:
            self.assertAlmostEqual(m['fusion']+m['inert']+2*m['am'],1)

    def test_low_exhaust_cannot_carry_its_tanks(self):
        m=mix(0,1e-10)
        self.assertIsNone(solve(400,19.9,1,m,m))

    def test_saved_trade_conserves_mass_and_obeys_caps(self):
        r=json.loads((Path(__file__).resolve().parents[1]/'reports/fleet-fuel-mix.json').read_text())
        for ship in r['ships'].values():
            for row in ship['cap_trade']:
                x=row['best']
                if x is None:
                    continue
                self.assertLessEqual(x['antimatter_t'],row['cap_t']+1e-6)
                self.assertAlmostEqual(x['departure_t'],x['retained_core_t']+
                    x['tank_and_separation_t']+x['fusion_t']+x['inert_reaction_mass_t']+
                    2*x['antimatter_t'],places=6)
        self.assertLessEqual(r['simple_20t_comparator']['fleet']['antimatter_t'],20+1e-6)
        self.assertEqual(r['simple_20t_comparator']['fleet']['inert_reaction_mass_t'],0)
