import unittest

from calculations.cosmic_ray_exposure import (build_exposure, cube_water_shell,
                                               cylinder_shell_water_mass, disc_sky_fraction, exposure_sv)


class CosmicRayExposureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = build_exposure()

    def test_units_and_time_weighting(self):
        self.assertAlmostEqual(exposure_sv(1,0,1,0),.36525)
        o = self.result['occupancy']
        self.assertAlmostEqual(o['awake_years']+o['torpor_years'],o['adult_proper_exposure_years'])
        self.assertGreater(o['adult_awake_fraction'],.25)

    def test_perfect_bay_cannot_remove_awake_exposure(self):
        r = self.result
        self.assertGreater(r['limits']['perfect_torpor_bay_adult_sv'],.4)
        self.assertLess(r['limits']['perfect_torpor_bay_adult_sv'],r['scenarios']['20']['adult_reference_sv'])

    def test_shell_edges_are_not_omitted(self):
        self.assertAlmostEqual(cube_water_shell(4,.2),42.368)
        self.assertGreater(cube_water_shell(4,.2),2*6*4**2*.2)
        self.assertGreater(cube_water_shell(4,.4),cube_water_shell(4,.2))

    def test_directional_shield_not_omnidirectional(self):
        self.assertAlmostEqual(disc_sky_fraction(7,35),.009709662154539944)
        self.assertLess(disc_sky_fraction(7,51),disc_sky_fraction(7,19))

    def test_material_inventory_is_depleted(self):
        s = self.result['shielding']
        self.assertGreater(s['main_reaction_departure_t'],s['main_reaction_coast_t'])
        self.assertGreater(s['main_reaction_coast_t'],s['main_reaction_after_nominal_braking_t'])
        self.assertLess(s['main_reaction_after_nominal_braking_t'],s['full_envelope_20cm_water_mass_t'])

    def test_proxy_not_claimed_as_actual(self):
        self.assertIsNone(self.result['actual_ship_GCR_dose_sv'])
        self.assertIsNone(self.result['validated_GCR_reduction_fraction'])
        self.assertIn('NOT child',self.result['source']['dose_quantity'])

    def test_refuge_finite_shell_corrects_thin_layer_estimate(self):
        s = self.result['shielding']
        t = s['refuge_exact_uniform_water_thickness_cm']/100
        self.assertAlmostEqual(cylinder_shell_water_mass(3.2,7.5,t),44)
        self.assertLess(s['refuge_exact_uniform_water_column_g_cm2'],20)
        self.assertGreater(s['refuge_water_needed_for_exact_20cm_t'],44)


if __name__ == '__main__':
    unittest.main()
