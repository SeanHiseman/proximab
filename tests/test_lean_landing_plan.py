import json
import unittest
from pathlib import Path

from calculations.arrival_redesign import closed
from calculations.depleted_staged_tanks import MIN_SPEED
from calculations.integrated_specification import ledger

ROOT = Path(__file__).resolve().parents[1]


class LeanLandingPlanTests(unittest.TestCase):
    def test_inventory_removal_and_landing_saving_are_distinct(self):
        old = json.loads((ROOT/'data/arrival_redesign.json').read_text())
        new = json.loads((ROOT/'data/lean_landing_plan.json').read_text())
        a, b = ledger('crew', old), ledger('crew', new, 500)
        self.assertAlmostEqual(a['fixed_inventory_t']-b['fixed_inventory_t'], 36)
        self.assertEqual(a['hardware_rows'], b['hardware_rows'])
        self.assertAlmostEqual(b['landing']['loaded_t'], 30.1969934874)
        self.assertAlmostEqual(b['landing']['entry_t']-b['landing']['burned_t'],
                               b['landing']['touchdown_t'])
        self.assertEqual(ledger('cargo', old), ledger('cargo', new))

    def test_recomputed_propulsion_and_dry_mass_conservation(self):
        report = json.loads((ROOT/'reports/lean-landing-plan.json').read_text())
        spec = json.loads((ROOT/'data/lean_landing_plan.json').read_text())
        for kind, row in report['ships'].items():
            p = row['propulsion']
            book = ledger(kind, spec, 500 if kind == 'crew' else 1000)
            speeds = p['exhaust_c'] if kind == 'crew' else [MIN_SPEED, MIN_SPEED]
            check = closed(*speeds, core_t=book['nonpropulsion_core_t'],
                burn_years=p['trajectory']['burn_years'],
                transfer_years=p['trajectory']['years'], electrical_fusion=kind=='cargo')
            self.assertAlmostEqual(check['departure_t'], p['departure_t'], places=6)
            self.assertAlmostEqual(p['departure_t'], row['departure_dry_hardware_t']
                +book['fixed_inventory_t']+book['landing']['loaded_t']
                +p['fusion_t']+2*p['antimatter_t'])
            self.assertEqual(p['retained_propulsion_fuel_t'], 0)
        self.assertLessEqual(report['fleet']['antimatter_t'], 20)
        self.assertFalse(report['qualifications']['radiation_verified'])
        self.assertFalse(report['qualifications']['arrival_capture_fuel_included'])

    def test_handover_target_has_idealized_delta_v_headroom(self):
        spec = json.loads((ROOT/'data/lean_landing_plan.json').read_text())
        mass = ledger('crew', spec, 500)['landing']['entry_t']*1000
        g = spec['landing']['planet_gravity_screen_m_s2']
        net = 3*spec['landing']['crew_thrust_MN_each']*1e6/mass-g
        speed = spec['landing']['crew_powered_handover_target_m_s']
        self.assertLess(speed*(1+g/net), 500)
