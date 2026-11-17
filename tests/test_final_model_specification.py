import json
import math
import unittest

from calculations.fleet_fuel_mix import ROOT
from calculations.integrated_specification import ledger


class FinalModelSpecificationTests(unittest.TestCase):
    def test_selected_sources_and_shield_envelope(self):
        a=json.loads((ROOT/'data/mission_architecture.json').read_text())
        s=json.loads((ROOT/a['selected_component_inputs']).read_text())
        self.assertEqual(s['revision'],'S7-frozen-model-redesign')
        g=s['geometry']
        self.assertGreater(g['crew_forward_shield_diameter_m'],2*g['envelope_radius_m'])
        shield=next(x for x in s['crew_hardware'] if x[0]=='Forward shield face and supports')
        self.assertAlmostEqual(shield[1],math.pi*10**2*.1+3)
        self.assertFalse(s['model_readiness']['engineering_finalized'])

    def test_stage_and_surface_mass_accounting(self):
        r=json.loads((ROOT/'reports/final-model-specification.json').read_text())
        s=json.loads((ROOT/'data/final_model_specification.json').read_text())
        for kind,x in r['ships'].items():
            book=ledger(kind,s,500 if kind=='crew' else 1000)
            p=x['propulsion']; stages=p['segments']
            self.assertEqual(len(stages),16)
            self.assertAlmostEqual(stages[-1]['after_drop_t'],p['retained_core_t'])
            for first,last in zip(stages,stages[1:]):
                self.assertAlmostEqual(first['after_drop_t'],last['before_t'])
            self.assertAlmostEqual(p['departure_t'],x['departure_dry_hardware_t']+
                book['fixed_inventory_t']+book['landing']['loaded_t']+p['fusion_t']+2*p['antimatter_t'])
            self.assertAlmostEqual(p['retained_core_t'],book['nonpropulsion_core_t']+
                p['engine_with_allowance_t']+p['hot_radiator_with_allowance_t'])
        self.assertAlmostEqual(r['ships']['crew']['propulsion']['antimatter_t'],20,places=5)
        self.assertEqual(r['ships']['cargo']['propulsion']['antimatter_t'],0)
        self.assertFalse(r['capture_fuel_included'])
