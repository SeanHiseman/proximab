import json
import unittest

from calculations.antimatter_cap import MIN_SPEED, fleet
from calculations.family_fleet_trade import ROOT
from calculations.staged_baseline import evaluate


class AntimatterCapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline=json.loads((ROOT/'reports/integrated-specification.json').read_text())

    def test_ignition_endpoint_is_included_and_mass_closes(self):
        s=self.baseline['crew']['coefficients']
        r=evaluate(1,MIN_SPEED,.22,s,32.9)
        self.assertIsNotNone(r)
        self.assertAlmostEqual(r['departure_t'],r['arrival_t']+r['discarded_t']+
            sum(p['spent_t'] for p in r['phases']))
        self.assertAlmostEqual(r['loaded_antimatter_t'],1.02*r['antimatter_t'])

    def test_32_year_candidate_obeys_cap_and_launch_lead(self):
        r=fleet(self.baseline,32,'primary_energy_loaded_fuel_ZJ')
        self.assertLess(r['totals']['antimatter_t'],10)
        self.assertEqual(r['cargo_years']-r['crew_years'],20)
        self.assertAlmostEqual(r['totals']['antimatter_t'],sum(x['antimatter_t'] for x in r['ships'].values()))
        self.assertGreater(r['ships']['crew']['proper_years'],31)
