import json
from pathlib import Path
import unittest

from calculations.compact_ship_audit import build_audit


class CompactShipAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.audit = build_audit()

    def test_baseline_matches_current_viewer_and_departure_ledger_closes(self):
        viewer = json.loads(Path('mission-viewer/dist/design-data.json').read_text())['reference_design']['nominal']
        for key in ['departure_mass_kg', 'final_retained_mass_kg']:
            self.assertAlmostEqual(self.audit['baseline'][key], viewer[key], places=6)
        self.assertAlmostEqual(sum(self.audit['departure_ledger_kg'].values()), viewer['departure_mass_kg'], places=6)

    def test_every_scenario_closes_release_and_propellant_mass_balance(self):
        for case in self.audit['scenarios']:
            n = case['result']
            self.assertAlmostEqual(n['departure_mass_kg'], n['final_retained_mass_kg']+
                n['early_release_mass_kg']+n['late_engine_stage_release_mass_kg']+
                n['thermal_hydrogen_kg']+2*n['thermal_antimatter_kg']+
                n['direct_propellant_consumed_kg'], places=6)

    def test_geometry_retains_radius_and_programme_includes_all_berths(self):
        geometry = self.audit['proposed_geometry']
        self.assertEqual(geometry['outer_radius_m'], 19.5)
        self.assertLess(sum(self.audit['proposed_area_programme_m2'].values()), geometry['assumed_net_floor_area_m2'])
        self.assertEqual(self.audit['proposed_area_programme_m2']['32 convertible torpor/sleep berths, equipment footprint'], 80)
        for case in self.audit['scenarios']:
            self.assertTrue({'medical', 'radiationshield', 'dustshield', 'foodfactory', 'spares', 'water'}.isdisjoint(case['component_reductions_kg']))
            self.assertEqual(case['additional_components_kg'], {'surface_expansion': 6000, 'rim_access': 2000})

    def test_audit_does_not_mutate_selected_design(self):
        paths = [Path(p) for p in ['data/mission_config.json', 'data/spacecraft_layout.json', 'data/habitat_layout.json']]
        before = [p.read_bytes() for p in paths]
        build_audit()
        self.assertEqual(before, [p.read_bytes() for p in paths])


if __name__ == '__main__':
    unittest.main()
