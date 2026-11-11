import math
from pathlib import Path
import unittest
from calculations.engine_reuse_options import build_engine_options
from calculations.mission_calculations import C,G
from calculations.selected_mass_budget import mission_config

class EngineReuseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.b=build_engine_options()
    def test_release_state_and_propellant_balances(self):
        for c in self.b['cases']:
            spent=c['direct_propellant_consumed_kg']+c['thermal_hydrogen_kg']+2*c['thermal_antimatter_kg']
            remaining=c['final_retained_mass_kg']+c['early_release_mass_kg']+c['late_engine_stage_release_mass_kg']
            self.assertAlmostEqual(c['departure_mass_kg'],spent+remaining,places=6)
            self.assertAlmostEqual(c['propulsion_antimatter_loaded_kg'],(c['direct_propellant_consumed_kg']+c['retained_correction_propellant_kg'])/2+c['thermal_antimatter_kg'],places=6)
            p=c['phase_masses_kg'];self.assertAlmostEqual(p['before_engine_release']-p['after_engine_release'],c['late_engine_stage_release_mass_kg'],places=6)
            values=list(p.values());self.assertTrue(all(x>=y for x,y in zip(values,values[1:])))
    def test_hot_radiator_can_support_both_thrust_phases(self):
        cfg=mission_config();flux=.9*5.670374419e-8*1500**4
        for c in self.b['cases']:
            capacity=c['engine_hot_radiator_kg']/5*flux
            for mass,accel in [(c['departure_mass_kg'],cfg['main_acceleration_g']*G),(c['phase_masses_kg']['after_early_release'],cfg['landing_proper_acceleration_earth_g_study']*G)]:
                absorbed=mass*accel*C/.5*1e-7
                self.assertGreaterEqual(capacity+1e-6,absorbed)
    def test_conservative_one_km_case_and_unpowered_stage_clearance(self):
        c=self.b['cases'][-1];old=self.b['previous_selected']
        self.assertEqual(c['thermal_hardware_allowance_kg'],10000)
        self.assertLess(c['final_retained_mass_kg'],old['final_retained_mass_kg'])
        self.assertGreater(c['final_retained_mass_kg'],370000)
        self.assertLess(c['thermal_hydrogen_kg'],old['thermal_hydrogen_kg'])
        self.assertGreater(c['late_engine_stage_release_mass_kg'],120000)
        self.assertLess(c['unpowered_stage_ground_time_seconds'],c['ideal_terminal']['thermal_burn_seconds'])
        self.assertGreater(c['instantaneous_lateral_delta_v_for_1km_offset_m_s'],140)
    def test_study_does_not_change_selected_configuration(self):
        paths=[Path('data/mission_config.json'),Path('reports/mass-budget.json')];before=[p.read_bytes() for p in paths]
        build_engine_options();self.assertEqual([p.read_bytes() for p in paths],before)

if __name__=='__main__':unittest.main()
