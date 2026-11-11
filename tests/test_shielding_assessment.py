import json
import math
from pathlib import Path
import unittest

from calculations.shielding_assessment import (
    C, G, GAMMA_FRACTION, W_DENSITY, build_assessment, photon_screen, shadow_rectangle,
    rectangle_solid_angle,
)


class ShieldingAssessmentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = json.loads((Path(__file__).resolve().parent.parent / 'mission-viewer/dist/design-data.json').read_text(encoding='utf-8'))
        cls.result = build_assessment(cls.data)

    def test_mass_evolution_matches_selected_phase_ledger(self):
        self.assertAlmostEqual(self.result['mission']['after_braking_kg'],
            self.data['reference_design']['nominal']['phase_masses_kg']['after_interstellar_braking'])

    def test_burn_integral_agrees_with_independent_numerical_power_integral(self):
        cfg = self.data['mission_config']
        m = self.result['mission']['initial_mass_kg']
        duration = self.data['reference_trajectory']['each_burn_onboard_days'] * 86400
        rate = cfg['main_acceleration_g'] * G / (cfg['effective_exhaust_fraction_c'] * C)
        energy, steps = 0, 20000
        h = duration / steps
        for _ in range(2):
            # Midpoint quadrature and exact exponential mass stepping.
            for _ in range(steps):
                mid_mass = m * math.exp(-rate*h/2)
                energy += mid_mass * rate * C*C * GAMMA_FRACTION * h
                m *= math.exp(-rate*h)
        self.assertLess(abs(energy/self.result['mission']['two_burn_prompt_gamma_J']-1), 1e-9)

    def test_photon_thickness_reaches_only_the_requested_primary_proxy(self):
        r = photon_screen(1e20, 100, .04747, .01566, .01)
        transmitted = r['unshielded_water_kerma_proxy_Gy'] * math.exp(-.04747*W_DENSITY*r['narrow_beam_W_cm'])
        self.assertAlmostEqual(transmitted, .01)
        self.assertAlmostEqual(r['W_areal_kg_m2'], r['narrow_beam_W_cm']*193)

    def test_point_source_scaling(self):
        a = photon_screen(1e20, 100, .04747, .01566, .01)
        b = photon_screen(1e20, 1000, .04747, .01566, .01)
        self.assertAlmostEqual(a['unshielded_water_kerma_proxy_Gy']/b['unshielded_water_kerma_proxy_Gy'], 100)
        self.assertAlmostEqual(a['distance_only_proxy_m'], b['distance_only_proxy_m'])

    def test_point_source_shadow_solid_angle_is_independent_of_plane_distance(self):
        a = shadow_rectangle(84.5, 0, 5, 19.5, 7)
        b = shadow_rectangle(84.5, 0, 50, 19.5, 7)
        self.assertAlmostEqual(b[0]/a[0], 10)
        self.assertAlmostEqual(b[1]/a[1], 10)
        cases = [r for r in self.result['shadow_cases'] if r['source_radius_m'] == 0]
        self.assertAlmostEqual(cases[0]['central_point_incident_gamma_TW'], cases[-1]['central_point_incident_gamma_TW'])

    def test_finite_source_requires_a_larger_geometric_shield(self):
        point = shadow_rectangle(84.5, 0, 5, 19.5, 7)
        finite = shadow_rectangle(84.5, 1, 5, 19.5, 7)
        self.assertGreater(finite[0]*finite[1], point[0]*point[1])

    def test_budget_and_units(self):
        self.assertEqual(sum(self.result['proposed_20yr_budget_mSv_not_a_NASA_allocation'].values()), 600)
        self.assertEqual(self.result['forward_shield']['current_areal_g_cm2'], 5)
        self.assertAlmostEqual(self.result['forward_shield']['incoming_proton_MeV'], 21.49305, places=4)
        self.assertGreater(self.result['SPE_20g_cm2_mass_screen']['both_wheels_thin_layer_tonnes_lower_estimate'], 1100)

    def test_thermal_distances_satisfy_only_the_stated_heat_constraint(self):
        power = self.result['mission']['initial_prompt_gamma_PW']*1e15
        thermal = self.result['thermal_distance_screen']
        for row in thermal['cases']:
            h, w = shadow_rectangle(row['habitat_centre_to_source_m'], 0, 5, 19.5, 7)
            heat = power*rectangle_solid_angle(h, w, 5)/(4*math.pi)*row['deposited_fraction']
            self.assertAlmostEqual(heat/thermal['assumed_available_heat_W'], 1, places=9)


if __name__ == '__main__':
    unittest.main()
