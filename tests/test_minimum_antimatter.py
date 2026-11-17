import json
import unittest

from calculations.fleet_fuel_mix import ROOT, mix, solve


class MinimumAntimatterTests(unittest.TestCase):
    def test_caps_and_recomputed_solution(self):
        report=json.loads((ROOT/'reports/minimum-antimatter.json').read_text())
        for row in report['crew']:
            r=row['selected']
            self.assertLessEqual(r['fusion_t']+r['inert_reaction_mass_t'],row['feed_limit_t']+1e-5)
            # Selected cases are undiluted hybrid; recompute independently of optimizer.
            self.assertEqual(r['mode'],'hybrid')
            burn,a,b=r['parameters']
            check=solve(r['nonpropulsion_core_t'],19.9,burn,mix(1,10**a),mix(1,10**b))
            self.assertAlmostEqual(check['antimatter_t'],r['antimatter_t'],places=6)
            self.assertAlmostEqual(r['departure_t'],r['retained_core_t']+
                r['tank_and_separation_t']+r['fusion_t']+r['inert_reaction_mass_t']+2*r['antimatter_t'])
        self.assertEqual(report['cargo']['antimatter_t'],0)
        self.assertLess(report['cargo']['fusion_t'],100000)

    def test_minimum_repeated_across_seeds_and_feed_ceiling_not_binding(self):
        report=json.loads((ROOT/'reports/minimum-antimatter.json').read_text())
        r=report['crew'][-1]
        am=[x['antimatter_t'] for x in r['candidates'] if x['mode']=='hybrid']
        self.assertLess(max(am)-min(am),1e-5)
        self.assertLess(r['selected']['fusion_t'],50000)
        self.assertAlmostEqual(r['selected']['antimatter_t'],report['crew'][-2]['selected']['antimatter_t'],places=5)
