import copy
import json
import math
import unittest

from calculations.fleet_fuel_mix import ROOT
from calculations.integrated_specification import ledger
from calculations import tandem_redesign as t


class TandemRedesignTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.r = json.loads((ROOT/'reports/tandem-redesign.json').read_text())
        cls.inputs = json.loads((ROOT/'data/tandem_redesign.json').read_text())

    def test_shield_mass_is_converged_with_the_frontal_envelope(self):
        r, fs = self.r, self.inputs['forward_shield']
        self.assertAlmostEqual(r['forward_shield']['nominal_t'], r['frontal']['area_m2']*fs['areal_mass_kg_m2']/1000+fs['supports_nominal_t'], delta=.02)
        self.assertLess(abs(r['iterations'][-1]['shield_nominal_t']-r['forward_shield']['nominal_t']), 1e-3)
        e, g, t_ = r['envelope'], r['layout'], r['shell']['thickness_m']
        self.assertAlmostEqual(r['frontal']['width_m'], 2*(e['radius_m']+t_)+2*fs['margin_beyond_envelope_m'])
        # The corridor rides above the top wall and the rim gap stays clear between the two discs' outer walls.
        self.assertAlmostEqual(g['top_m'], e['depth_m']/2+t_+e['corridor_height_m'])
        self.assertAlmostEqual(g['disc_centres_x_m'][1]-2*(e['radius_m']+t_), e['rim_gap_m'])
        # The shield row used by the ledger is the converged value.
        spec = json.loads((ROOT/'data/final_model_specification.json').read_text())
        row = next(x for x in spec['crew_hardware'] if x[0] == t.SHIELD_ROW)
        self.assertAlmostEqual(row[1], math.pi*10**2*.1+3, msg='S7 inputs stay untouched')

    def test_shell_nests_braking_modules_last_consumed_innermost(self):
        sh, e, st = self.r['shell'], self.r['envelope'], self.inputs['storage']
        self.assertTrue(sh['all_braking_fuel'])
        self.assertEqual([l['index'] for l in sh['layers']], [7, 6, 5, 4, 3, 2, 1, 0])
        for inner, outer in zip(sh['layers'], sh['layers'][1:]):
            self.assertAlmostEqual(inner['outer_offset_m'], outer['inner_offset_m'])
        for l in sh['layers']:
            vd, vh = t.species_volumes(l['fusion_t'], st)
            self.assertAlmostEqual(t.wall_volume(e, l['outer_offset_m'])-t.wall_volume(e, l['inner_offset_m']), vd+vh, places=4)
        braking = [s for s in self.r['ships']['crew']['propulsion']['segments'] if s['phase'] == 1]
        self.assertAlmostEqual(sh['mass_t'], sum(s['fusion_t'] for s in braking))

    def test_lower_target_wraps_only_the_last_consumed_modules(self):
        braking = [s for s in self.r['ships']['crew']['propulsion']['segments'] if s['phase'] == 1]
        inputs = copy.deepcopy(self.inputs); inputs['shielding']['target_areal_density_g_cm2'] = 10
        sh = t.shell(self.r['envelope'], braking, inputs)
        self.assertFalse(sh['all_braking_fuel'])
        self.assertGreaterEqual(sh['mass_t']*1000/sh['inner_area_m2']/10, 10)
        self.assertEqual([l['index'] for l in sh['layers']], list(range(7, 7-len(sh['layers']), -1)))

    def test_crew_ledger_closes_with_the_resized_shield(self):
        spec = json.loads((ROOT/'data/final_model_specification.json').read_text())
        next(x for x in spec['crew_hardware'] if x[0] == t.SHIELD_ROW)[1] = self.r['forward_shield']['nominal_t']
        next(x for x in spec['crew_hardware'] if x[0] == t.SHADOW_ROW)[1] = self.r['engine_shadow_shield']['nominal_t']
        spec['crew_hardware'].extend([list(x) for x in self.inputs['added_crew_hardware']])
        spec['crew_hardware'].append([t.STRIP_ROW, self.r['radiator_strips']['crew']['nominal_t'], False])
        for k, (table, name) in t.TOW_ROWS.items():
            next(x for x in spec[table] if x[0] == name)[1] = self.r['tow'][k]['nominal_t']
        x = self.r['ships']['crew']; p = x['propulsion']; book = ledger('crew', spec, 500)
        self.assertAlmostEqual(p['departure_t'], x['departure_dry_hardware_t']+book['fixed_inventory_t']+book['landing']['loaded_t']+p['fusion_t']+2*p['antimatter_t'], places=4)
        self.assertAlmostEqual(p['retained_core_t'], book['nonpropulsion_core_t']+p['engine_with_allowance_t']+p['hot_radiator_with_allowance_t'], places=4)
        self.assertAlmostEqual(p['antimatter_t'], self.inputs['crew_antimatter_t'], places=5)
        self.assertEqual(self.r['ships']['cargo']['propulsion']['antimatter_t'], 0)

    def test_stacks_use_liquid_density_and_cover_every_module(self):
        r = self.r
        self.assertEqual(len(r['crew_stack'])+len(r['shell']['layers']), 16)
        self.assertEqual(len(r['cargo_stack']), 16)
        st = self.inputs['storage']
        for m in r['crew_stack']+r['cargo_stack']:
            self.assertAlmostEqual(m['volume_m3'], m['fusion_t']/r['mixture_density_t_m3'])
            # Domed cylindrical tanks hold exactly each species' liquid volume and fit the frame.
            k = m['tanks']; n = k['tanks_y']*k['tanks_z']
            for name, v in zip(['deuterium', 'helium3'], t.species_volumes(m['fusion_t'], st)):
                tk = k[name]; self.assertAlmostEqual(n*(math.pi*tk['radius_m']**2*tk['cylinder_m']+4/3*math.pi*tk['radius_m']**3), v, places=4)
        for m in r['crew_stack']:
            k = m['tanks']; self.assertLessEqual(2*k['deuterium']['radius_m']*k['tanks_y'], r['frame']['width_m'])
            self.assertLessEqual(2*k['deuterium']['radius_m']*k['tanks_z'], r['frame']['height_m'])
        self.assertFalse(r['radiation_verified']); self.assertFalse(r['tow_dynamics_sized']); self.assertTrue(r['cant_loss_charged'])

    def test_nozzle_cant_is_the_smallest_that_clears_the_ship_and_its_loss_is_charged(self):
        r, tw = self.r, self.inputs['tow']
        half = math.hypot(r['frame']['width_m'], r['frame']['height_m'])/2
        cant = math.radians(r['tow']['crew']['nozzle_cant_deg'])
        # Plume edge at the ship: pod offset + L tan(cant) - L tan(edge half-angle) = half size + margin.
        edge = min(abs(y) for y in tw['pod_offsets_y_m'])-tw['nozzle_exit_radius_m']+tw['length_m']*(math.tan(cant)-math.tan(math.radians(tw['plume_edge_half_angle_deg'])))
        self.assertAlmostEqual(edge, half+tw['plume_clearance_margin_m'], delta=.05)
        # The ledger carries the loss: effective exhaust velocity is scaled by cos(cant).
        from calculations.final_model_specification import build
        spec = json.loads((ROOT/'data/final_model_specification.json').read_text())
        plain = build(spec)['ships']['cargo']['propulsion']['departure_t']
        canted = build(spec, thrust_fraction={'cargo': .99})['ships']['cargo']['propulsion']['departure_t']
        self.assertGreater(canted, plain)

    def test_tow_is_sized_in_tension_at_departure_thrust(self):
        tw, inp = self.r['tow'], self.inputs['tow']
        per = inp['safety_factor']*inp['fibre_density_kg_m3']/(inp['fibre_strength_GPa']*1e9)/1000
        for k in t.TOW_ROWS:
            p = self.r['ships'][k]['propulsion']; thrust = p['departure_t']*1000*p['trajectory']['acceleration_m_s2']
            self.assertAlmostEqual(tw[k]['thrust_MN'], thrust/1e6)
            self.assertAlmostEqual(tw[k]['tethers_t'], thrust*per*inp['length_m'])
            self.assertLess(abs(tw[k]['total_t']-tw[k]['nominal_t']), .02, 'tow mass converged into the ledger')
        # Each strap carries only what hangs below it (the crew habitats hang at the bottom), so the straps weigh less than
        # one full-thrust strap down the whole stack.
        p = self.r['ships']['crew']['propulsion']
        stack_len = sum(m['length_m'] for m in self.r['crew_stack'])
        self.assertLess(tw['crew']['stack_straps_t'], p['departure_t']*1000*p['trajectory']['acceleration_m_s2']*per*stack_len)
        self.assertEqual([m['index'] for m in self.r['crew_stack']], list(range(8)), 'first-dropped module at the top')

    def test_surface_solar_field_is_in_the_cargo_ledger(self):
        r, s = self.r['surface_solar'], self.inputs['surface_solar']
        self.assertAlmostEqual(r['area_m2']*r['flux_W_m2']*r['incidence']*r['net_efficiency'], r['design_kW']*1000, delta=1)
        self.assertLess(r['average_kW'], r['peak_kW'])
        self.assertAlmostEqual(r['design_kW'], r['peak_kW']*(1+s['capacity_margin']))
        self.assertAlmostEqual(r['total_t'], r['array_t']+r['battery_t']+r['coolers_t']+r['switchyard_t']);self.assertLessEqual(r['battery_t'], 5)
        row = next(x for x in self.r['ships']['cargo']['ledger']['hardware_rows'] if x[0] == t.POWER_ROW)
        self.assertAlmostEqual(row[1], r['total_t'])

    def test_engine_fits_the_single_dust_shield_and_the_feed_is_sized(self):
        r, i = self.r, self.inputs
        # The dust shield's radiator strips are in the ledger at the shield's areal mass.
        for k in ['crew', 'cargo']:
            st = r['radiator_strips'][k]; self.assertAlmostEqual(st['nominal_t'], st['area_m2']*i['forward_shield']['areal_mass_kg_m2']/1000, delta=.03); self.assertGreater(st['fin_reach_m'], 5)
        # One dust shield moves to the leading end, so the engine's pod row must fit inside its outline.
        self.assertLessEqual(r['engine_half_span_m']['crew'], r['frontal']['width_m']/2)
        self.assertLessEqual(r['engine_half_span_m']['cargo'], r['cargo_envelope_radius_m'])
        for k in ['crew', 'cargo']:
            ys, ex = t.pods(i, k); ys = sorted(ys)
            self.assertLessEqual(ex, r['frontal']['height_m']/2)
            self.assertTrue(all(b-a > 2*ex for a, b in zip(ys, ys[1:])), 'nozzles do not touch')
        for kind in ['crew', 'cargo']:
            self.assertGreater(r['fuel_feed'][kind]['peak_kg_s'], 0); self.assertLess(r['fuel_feed'][kind]['line_inner_diameter_m'], .2)
        p = r['ships']['crew']['propulsion']
        self.assertAlmostEqual(r['fuel_feed']['crew']['peak_kg_s'], p['departure_t']*1000*p['trajectory']['acceleration_m_s2']/(p['effective_exhaust_c'][0]*299792458))

    def test_engine_shadow_shields_are_removed_from_the_ledger(self):
        sh = self.r['engine_shadow_shield']
        self.assertEqual(sh['nominal_t'], 0); self.assertTrue(sh['removed'])


if __name__ == '__main__':
    unittest.main()
