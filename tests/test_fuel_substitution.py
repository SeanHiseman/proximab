import json
import unittest

from calculations.family_fleet_trade import ROOT
from calculations.fuel_substitution import endpoint, endpoint_mix


class FuelSubstitutionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline = json.loads((ROOT/'reports/integrated-specification-s2.json').read_text())

    def test_general_closure_reproduces_both_hybrid_ships(self):
        for name,years in [('crew',19.9),('cargo',39.9)]:
            ship = self.baseline[name]
            selected = ship['selected']
            r = endpoint('hybrid',selected['trajectory']['burn_years'],
                [p['exhaust_c'] for p in selected['phases']],ship['coefficients'],years)
            self.assertAlmostEqual(r['departure_t'],selected['departure_t'],places=7)
            self.assertAlmostEqual(r['primary_ZJ'],selected['primary_energy_loaded_fuel_ZJ'],places=8)
            self.assertAlmostEqual(r['antimatter_t'],selected['loaded_antimatter_t'],places=8)

    def test_annihilation_only_energy_and_mass(self):
        s = self.baseline['crew']['coefficients']
        r = endpoint('antimatter',1.25,[.25,.48],s,19.9)
        self.assertEqual(r['fusion_t'],0)
        self.assertGreater(r['inert_reaction_mass_t'],0)
        self.assertGreater(r['antimatter_t'],self.baseline['crew']['selected']['loaded_antimatter_t'])

    def test_fusion_endpoint_has_no_antimatter(self):
        s = self.baseline['cargo']['coefficients']
        r = endpoint('fusion',1,[0,0],s,39.9)
        self.assertEqual(r['antimatter_t'],0)
        self.assertLess(endpoint_mix('fusion',0,s)['exhaust_c'],.08)

    def test_unclosed_crew_fusion_does_not_return_negative_mass(self):
        s = self.baseline['crew']['coefficients']
        self.assertIsNone(endpoint('fusion',1.25,[0,0],s,19.9))
