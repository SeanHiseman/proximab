import math
import unittest

from calculations.mission_calculations import C, G, trajectory
from calculations.ship_design import (SIGMA, build_design, shadow_shield, storage, surface_inflatables,
                                      truss_sizing, W_MU_RHO_4MEV, TUNGSTEN_DENSITY)


class ShipDesignTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = build_design()

    def test_stage_ledgers_and_departure_mass_close(self):
        n, rows = self.d['nominal'], self.d['components']
        for stage, key in [('surface', 'final_retained_mass_kg'), ('orbit', 'early_release_mass_kg'),
                           ('handover', 'late_engine_stage_release_mass_kg')]:
            self.assertAlmostEqual(sum(r['mass_kg'] for r in rows if r['release_stage'] == stage), n[key], places=3)
        burned = n['direct_propellant_consumed_kg'] + n['thermal_hydrogen_kg'] + 2 * n['thermal_antimatter_kg']
        self.assertAlmostEqual(sum(r['mass_kg'] for r in rows) + burned, n['departure_mass_kg'], places=3)
        self.assertEqual(len({r['id'] for r in rows}), len(rows))

    def test_rocket_equation_matches_the_slower_trajectory(self):
        n, t = self.d['nominal'], self.d['trajectory']
        self.assertAlmostEqual(t['rapidity'], trajectory(19.9, acceleration_g=n['main_acceleration_g'])['rapidity'])
        phases = n['phase_masses_kg']
        self.assertAlmostEqual(phases['departure'] / phases['after_interstellar_braking'], math.exp(2 * t['rapidity'] / 0.5))
        self.assertGreater(t['each_burn_onboard_days'], 300)
        self.assertAlmostEqual(2 * t['each_burn_onboard_days'] / 365.25 + t['cruise_onboard_years'], 19.9)

    def test_lighter_than_the_three_deck_reference(self):
        t = self.d['totals']
        self.assertLess(t['departure_kg'], 0.6 * t['reference_departure_kg'])
        self.assertLess(t['landed_kg'], 0.5 * t['reference_landed_kg'])
        self.assertLess(t['dry_hardware_with_allowance_kg'], 300_000)

    def test_disc_geometry_spin_and_masses(self):
        h = self.d['habitat']
        self.assertAlmostEqual(h['spin_rad_s']**2 * h['floor_radius_m'] / G, h['gravity_at_floor_g'])
        self.assertAlmostEqual(h['gross_floor_area_m2'], 2 * 2 * math.pi * sum(h['deck_floor_radii_m']) * (h['axial_depth_m'] - 0.2))
        self.assertAlmostEqual(h['membranes_kg'], 6 * h['pressure_envelope_area_m2'])
        self.assertLess(h['pressure_envelope_area_m2'], 0.3 * h['reference_comparison']['pressure_envelope_area_m2'])
        self.assertGreater(h['deck_floor_radii_m'][-1] - 3, 2.2, 'inner deck has standing height below the hub')

    def test_inflatable_restraint_follows_hoop_load(self):
        s = self.d['surface_inflatables']
        self.assertAlmostEqual(s['hoop_load_kN_m'], 70 * s['radius_m'])
        self.assertAlmostEqual(s['restraint_kg_m2']['cylinder'], 1.5 * 70_000 * s['radius_m'] / (s['restraint_allowable_MPa'] * 1e6) * 1400)
        self.assertAlmostEqual(s['hardware_kg'], s['count'] * (s['per_module_kg']['total'] + s['tunnel_kg_each']))
        self.assertAlmostEqual(s['bale_mass_kg'] * s['packed_bales'], s['hardware_kg'])
        ledger = next(r for r in self.d['components'] if r['id'] == 'surfacekit')
        self.assertAlmostEqual(ledger['mass_kg'], s['hardware_kg'])
        gas = next(r for r in self.d['components'] if r['id'] == 'gas')
        self.assertGreater(gas['mass_kg'], s['fill_gas_kg'] + self.d['habitat']['atmosphere_kg'])

    def test_storage_holds_the_propellant(self):
        s, n = self.d['storage'], self.d['nominal']
        self.assertAlmostEqual(s['antimatter_kg'], (n['direct_propellant_consumed_kg'] + n['retained_correction_propellant_kg']) / 2)
        self.assertGreaterEqual(s['hydrogen_tank']['volume_m3'] * 70.8 * 0.97, s['matching_hydrogen_kg'] - 1e-6)
        layout = dict(logs_per_layer=31, logs_per_dome=19)
        capacity = s['antimatter_store']['layers'] * layout['logs_per_layer'] + 2 * layout['logs_per_dome']
        self.assertGreaterEqual(capacity, s['electrostatic_levitation']['log_count'])
        self.assertLess(s['ice_fill_fraction'], 0.5)
        powers = [row['wall_annihilation_power_W'] for row in s['sublimation']]
        self.assertEqual(powers, sorted(powers))
        self.assertLess(powers[0], 1)
        self.assertGreater(s['charged_storage']['volume_needed_m3'], 1e12)

    def test_shadow_shield_attenuation_and_shadow_geometry(self):
        s = self.d['shadow_shield']
        factor = math.exp(W_MU_RHO_4MEV * TUNGSTEN_DENSITY * s['primary_only_thickness_m'])
        self.assertAlmostEqual(factor / s['attenuation_needed'], 1, places=9)
        cone_at_tanks = s['source_radius_m'] + (s['radius_m'] - s['source_radius_m']) * s['boom_length_m'] / s['shield_distance_m']
        self.assertAlmostEqual(cone_at_tanks, s['protected_radius_m'])
        self.assertGreater(s['heat_gap_factor'], 1e3, 'heat rejection is reported as open, not hidden')
        study = dict(source_to_nearest_crew_m=275, dose_allocation_Gy=0.01, buildup_factor=100, source_radius_m=0.5,
                     protected_radius_m=12.7, shield_distance_m=4.5, boom_length_m=170)
        thicker = shadow_shield(1e23, 1e15, study)['thickness_m'] - shadow_shield(1e22, 1e15, study)['thickness_m']
        self.assertAlmostEqual(thicker, math.log(10) / (W_MU_RHO_4MEV * TUNGSTEN_DENSITY))

    def test_structure_sets_the_burn_acceleration(self):
        s = self.d['structure']
        self.assertEqual(s['design_acceleration_g'], self.d['nominal']['main_acceleration_g'])
        self.assertLess(s['design_acceleration_g'], s['governing_limit_g'])
        self.assertLess(s['governing_limit_g'], s['previous_acceleration_g'], 'the earlier 1.2 g exceeds what the structure carries')
        self.assertTrue(all(c['margin_at_design'] > 1 for c in s['checks']))
        t = self.d['truss']
        self.assertGreaterEqual(t['boom_euler_safety_factor'], 2 - 1e-9)
        self.assertLessEqual(t['boom_stress_MPa'], 300 + 1e-9)
        self.assertGreater(truss_sizing(2 * t['peak_thrust_MN'] * 1e6, 1e6, dict(shadow_shield_study=dict(boom_length_m=170), spine_length_m=110))['boom_kg'], t['boom_kg'])

    def test_engine_and_interstellar_flow_arithmetic(self):
        e, n, f = self.d['engine'], self.d['nominal'], self.d['interstellar_flow']
        self.assertAlmostEqual(e['initial_thrust_MN'] * 1e6, n['departure_mass_kg'] * n['main_acceleration_g'] * G)
        self.assertAlmostEqual(e['annihilation_power_PW'] * 1e15, e['initial_thrust_MN'] * 1e6 * C / 0.5, delta=1e6)
        self.assertLess(e['momentum_efficiency_needed'], 1)
        gamma = 1 / math.sqrt(1 - f['speed_c']**2)
        self.assertAlmostEqual(f['proton_kinetic_MeV'], (gamma - 1) * 938.272)
        self.assertAlmostEqual(f['kinetic_power_W_m2'], f['proton_flux_m2_s'] * f['proton_kinetic_MeV'] * 1.602176634e-13)
        self.assertGreater(f['unscreened']['coast_dose_Sv'], 100)
        self.assertLess(f['screen']['residual_coast_dose_mSv']['total'], f['screen']['allocation_mSv'])

    def test_viewer_geometry_is_ordered_and_radiators_are_sufficient(self):
        g = self.d['geometry']
        self.assertLess(g['screen']['x'], g['screen']['catcher_x'])
        self.assertLess(g['hydrogen_tank']['x1'], g['antimatter_store']['x0'])
        self.assertLess(g['antimatter_store']['x1'], g['boom']['x0'])
        self.assertLess(g['boom']['x1'], g['source_x'])
        self.assertAlmostEqual(g['source_x'] - g['boom']['x0'], g['cone']['boom_length_m'])
        self.assertGreaterEqual(g['service_fins']['effective_emitting_m2'], g['service_fins']['required_emitting_m2'])
        self.assertAlmostEqual(g['hot_fins']['required_emitting_m2'], self.d['nominal']['peak_thrust_N'] * C / 0.5 * 1e-7 / (0.9 * SIGMA * 1500**4))

    def test_open_items_are_stated(self):
        text = ' '.join(self.d['open_items'])
        for word in ['Engine heat', 'Shadow shield heat', 'Cosmic rays', 'Antimatter storage']:
            self.assertIn(word, text)
        self.assertGreater(self.d['cosmic_rays']['exceedance_factor'], 10)


if __name__ == '__main__':
    unittest.main()
