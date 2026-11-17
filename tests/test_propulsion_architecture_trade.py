import json
import math
import unittest
from calculations.family_fleet_trade import ROOT, C
from calculations.propulsion_architecture_trade import build_trade, photon_launch_energy


class PropulsionArchitectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report=build_trade()

    def test_propellant_accounting_closes_for_both_architectures(self):
        for row in self.report['cases']:
            for key in ['onboard','hybrid']:
                r=row[key]
                self.assertAlmostEqual(r['initial_t'],r['retained_t']+r['reaction_mass_t']+2*r['antimatter_t'])
            self.assertLess(row['hybrid']['antimatter_t'],row['onboard']['antimatter_t'])

    def test_fusion_one_burn_ratio_squared_equals_two_burn_ratio(self):
        for row in self.report['cases']:
            for r in row['fusion']:
                self.assertAlmostEqual(r['external_launch_braking_mass_ratio']**2/r['full_rocket_mass_ratio'],1)

    def test_photon_energy_exceeds_payload_kinetic_energy(self):
        beta=.212
        kinetic=100000*C*C*(1/math.sqrt(1-beta*beta)-1)
        self.assertGreater(photon_launch_energy(100,beta),kinetic)
        self.assertEqual(photon_launch_energy(100,0),0)

    def test_fleet_and_capacity_requirements(self):
        a=json.loads((ROOT/'data/mission_architecture.json').read_text())
        self.assertEqual(a['crew_departure_year']-a['cargo_departure_year'],20)
        self.assertEqual(a['crew_departure_year']+a['crew_flight_earth_years'],a['arrival_year'])
        self.assertEqual(a['cargo_departure_year']+a['cargo_flight_earth_years'],a['arrival_year'])
        self.assertEqual(a['crew'],a['adult_berths'])
        self.assertEqual(a['crew'],a['descent_places'])
        self.assertEqual(a['children_in_transit'],0)
        self.assertIsNone(a['complete_dry_mass_t'])
        self.assertIsNone(a['complete_fleet_antimatter_t'])
