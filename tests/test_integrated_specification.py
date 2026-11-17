import math
import unittest
from calculations.integrated_specification import build_specification, load_spec, landing
from calculations.mission_calculations import G
from calculations.staged_baseline import ASSUMPTIONS, evaluate


class IntegratedSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result=build_specification()

    def test_landing_rocket_equation_includes_tanks_and_retained_reserve(self):
        s=load_spec()
        r=landing(300,1000,s['landing'])
        self.assertAlmostEqual(math.log(r['entry_t']/r['touchdown_t'])*450*G,1000)
        self.assertAlmostEqual(r['loaded_t'],1.1*r['burned_t'])
        self.assertAlmostEqual(r['tank_with_margin_t'],.1*r['loaded_t'])

    def test_integrated_dry_and_wet_ledgers_close(self):
        for key in ['crew','cargo']:
            r=self.result[key];s=r['selected'];book=r['ledger']
            expected=r['dry_departure_t']+book['fixed_inventory_t']+book['landing']['loaded_t']+s['loaded_fusion_t']+2*s['loaded_antimatter_t']
            self.assertAlmostEqual(s['departure_t'],expected,places=6)
            self.assertTrue(r['arrival_checks']['capture_fits_reserve'])
            self.assertLess(r['arrival_checks']['constant_mass_propulsive_delta_v_for_stop'],1000)
            self.assertLess(r['arrival_checks']['one_engine_out_stop_distance_m'],12000)
            self.assertGreater(r['extra_source_heat_fraction'],0)

    def test_fleet_sums_and_launch_lead(self):
        r=self.result
        self.assertAlmostEqual(r['fleet']['loaded_antimatter_t'],sum(r[k]['selected']['loaded_antimatter_t'] for k in ['crew','cargo']))
        self.assertAlmostEqual(r['cargo']['selected']['trajectory']['years']-r['crew']['selected']['trajectory']['years'],20)

    def test_lean_coefficients_apply_to_every_propulsion_component(self):
        spec=load_spec()
        for key in ['crew','cargo']:
            r=self.result[key];s=r['selected'];h=s['hardware']
            self.assertEqual(r['coefficients']['hardware_margin'],.1)
            self.assertEqual(r['coefficients']['reserve_fraction'],.02)
            self.assertAlmostEqual(h['retained_reserve_t'],.02*sum(p['spent_t'] for p in s['phases']))
            self.assertAlmostEqual(r['arrival_checks']['braking_reserve_t'],.02*s['phases'][1]['spent_t'])
            self.assertAlmostEqual(r['ledger']['landing']['tank_with_margin_t'],.088*r['ledger']['landing']['loaded_t'])
            expected=r['ledger']['nonpropulsion_core_t']+1.1*(h['engine_t']+h['radiator_t'])+h['retained_reserve_t']+h['retained_reserve_storage_with_margin_t']
            self.assertAlmostEqual(s['base_t'],expected,places=6)

    def test_surface_transfer_conserves_base_hardware_and_removes_shield_from_lander(self):
        import json
        from calculations.family_fleet_trade import ROOT
        old=json.loads((ROOT/'data/integrated_specification_s2.json').read_text())
        new=load_spec()
        for s in [old,new]:
            self.assertAlmostEqual(sum(r[1] for k in ['crew','cargo'] for r in s[f'{k}_hardware']),481.2824)
        self.assertFalse(any(r[0]=='Independent initial exploration and repair' for r in new['crew_hardware']))
        self.assertIn(['Transferred initial surface exploration and repair',8,True],new['cargo_hardware'])
        shield=next(r for r in new['crew_hardware'] if r[0]=='Forward shield face and supports')
        self.assertFalse(shield[2])
        self.assertTrue(new['arrival_operations']['cargo_lands_first'])

    def test_no_false_health_or_optimality_claim(self):
        self.assertIsNone(self.result['feasible_health_constrained_optimum'])
        self.assertIsNone(self.result['radiation']['actual_interstellar_dose_Sv'])
        self.assertFalse(self.result['radiation']['health_requirement_verified'])
        self.assertGreater(self.result['radiation']['proxy_to_target_ratio'],10)

    def test_power_branch_envelope_handles_stage_and_zero_core_comparator(self):
        sc=dict(ASSUMPTIONS,nonpropulsion_allocation_t=600,absorbed_power_fraction=2.28e-5)
        for staged in [True,False]:
            for a,b in [(.16,.5),(.3,.2),(.4,.4)]:
                r=evaluate(1.25,a,b,sc,staged=staged)
                if r:
                    h=r['hardware']
                    expected=600+1.25*(h['engine_t']+h['radiator_t'])+h['retained_reserve_t']+h['retained_reserve_storage_with_margin_t']
                    self.assertAlmostEqual(r['base_t'],expected,places=5)
