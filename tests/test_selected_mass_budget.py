import json
import unittest
from pathlib import Path
from calculations.selected_mass_budget import build_selected

class SelectedMassTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.b=build_selected()
    def test_selected_component_and_species_balance(self):
        n=self.b['nominal'];self.assertAlmostEqual(sum(r['mass_kg'] for r in self.b['components']),n['total_unburned_mass_kg'],places=6)
        self.assertAlmostEqual(n['departure_mass_kg']-n['final_retained_mass_kg']-n['flight_hardware_and_stocks_left_behind_kg'],n['direct_propellant_consumed_kg']+n['thermal_hydrogen_kg']+2*n['thermal_antimatter_kg'],places=6)
        self.assertAlmostEqual(n['propulsion_antimatter_loaded_kg'],n['direct_antimatter_consumed_kg']+n['retained_direct_propellant_reserve_kg']/2+n['thermal_antimatter_kg'],places=6)
        self.assertAlmostEqual(n['propulsion_matching_matter_loaded_kg'],n['propulsion_antimatter_loaded_kg'])
    def test_no_unsupported_nutrition_or_storage_discount(self):
        a=self.b['assumptions'];self.assertEqual(a['torpor_nutrition_discount'],0)
        food=next(r for r in self.b['components'] if r['id']=='food');self.assertAlmostEqual(food['mass_kg'],1020)
        self.assertEqual(self.b['nominal']['surface_antimatter_reserved_kg'],1)
        self.assertAlmostEqual(a['spare_food_endurance_days_at_full_crew'],1000/(32*.617))
        self.assertEqual(a['transit_power_MWe'],2)
    def test_time_budget_reserves_arrival_and_full_braking(self):
        a=self.b['assumptions'];self.assertAlmostEqual(a['interstellar_transfer_years']+a['arrival_time_allowance_years'],20)
        self.assertEqual(a['main_acceleration_g'],1.2)
        phases=self.b['nominal']['nominal_phase_masses_kg'];values=list(phases.values());self.assertTrue(all(x>=y for x,y in zip(values,values[1:])))
    def test_geometry_matches_selection_and_budgets(self):
        layout=json.loads(Path('data/reference/spacecraft_layout.json').read_text());habitat=json.loads(Path('data/reference/habitat_layout.json').read_text())
        self.assertEqual(layout['disc_radius_m'],19.5);self.assertEqual(habitat['disc_count'],2)
        self.assertEqual(habitat['geometry_study_not_selected_dimensions']['deck_floor_radii_m'],[17.5,13.5,9.5])
        self.assertLessEqual(2*sum(habitat['usable_area_allocations_per_disc_m2'].values()),self.b['geometry']['net_floor_area_m2_assumed'])
        shield=next(r for r in self.b['components'] if r['id']=='dustshield');self.assertEqual(shield['mass_kg'],layout['forward_shield_height_m_study']*layout['forward_shield_width_m_study']*layout['shield_areal_mass_kg_m2_sensitivity'])
    def test_lower_exhaust_is_not_assumed_free(self):
        slow,fast=self.b['exhaust_sensitivity'];self.assertTrue(slow['finite_solution']);self.assertGreater(slow['departure_mass_kg'],fast['departure_mass_kg'])
        self.assertAlmostEqual(self.b['nominal']['hardware_margin_kg']/self.b['nominal']['hardware_before_margin_kg'],.25)


class ReductionTests(unittest.TestCase):
    def test_100km_s_reserve_reconstructs_the_requested_delta_v(self):
        from math import log
        from calculations.mission_calculations import C
        b=build_selected();n=b['nominal'];reserve=n['retained_direct_propellant_reserve_kg'];mass=n['nominal_phase_masses_kg']['after_capture_before_separation'];dry=mass-reserve
        self.assertAlmostEqual(.5*C*log(mass/dry),100000,places=6)
    def test_planned_cruise_loads_fit_the_new_generator_target(self):
        systems=json.loads(Path('data/settlement_systems.json').read_text())
        self.assertLessEqual(sum(systems['power']['cruise_load_allocations_MWe'].values()),systems['power']['carried_generator_target_MWe'])
        self.assertEqual(systems['power']['carried_generator_target_MWe'],2)
    def test_longer_journey_saves_fuel_and_food_inventory_is_distinct(self):
        b=build_selected();fast,slow=b['mass_reduction_comparison']
        self.assertGreater(fast['departure_mass_kg'],slow['departure_mass_kg'])
        self.assertGreater(fast['propulsion_antimatter_loaded_kg'],slow['propulsion_antimatter_loaded_kg'])
        rows={r['id']:r for r in b['components']}
        self.assertNotIn('farm',rows);self.assertEqual(rows['foodfactory']['mass_kg'],10000)
        self.assertEqual(rows['foodloop_inventory']['mass_kg'],1000)
        self.assertEqual(b['crew'],32);self.assertEqual(b['couples'],16)
        cases=b['food_factory_sensitivity']
        self.assertTrue(all(a['departure_mass_kg']<c['departure_mass_kg'] for a,c in zip(cases,cases[1:])))
    def test_separation_manifest_and_surface_equipment_balance(self):
        b=build_selected();n=b['nominal'];m=b['delivery_manifest']
        self.assertAlmostEqual(sum(r['mass_kg'] for r in m['surface']),n['final_retained_mass_kg'],places=6)
        self.assertAlmostEqual(sum(r['mass_kg'] for r in m['left_in_orbit']),n['flight_hardware_and_stocks_left_behind_kg'],places=6)
        orbit={r['id'] for r in m['left_in_orbit']};land={r['id'] for r in m['surface']}
        self.assertTrue({'dustshield','bearings','cruiseengine','bulkcontainment','flightstructure','engineradiator','spacescouts','fuelreserve'}<=orbit)
        self.assertTrue({'engine','containment','landingradiator','membranes','floors','medical','factory','rover','power','foodfactory'}<=land)
        old=b['whole_ship_comparison'];self.assertLess(n["final_retained_mass_kg"],old["final_retained_mass_kg"]-165000)  # the whole-ship case also lands the (now 31 t) dust shield
        self.assertLess(n['thermal_hydrogen_kg'],9000)
        # The flight module is carried through interstellar braking, not removed at departure.
        import math
        from calculations.mission_calculations import C
        post_main=n['nominal_phase_masses_kg']['after_interstellar_braking']
        self.assertAlmostEqual(n['departure_mass_kg']/post_main,math.exp(2*b['trajectory']['rapidity']/.5))
        self.assertGreater(post_main-n['mass_after_separation_kg'],n['flight_hardware_and_stocks_left_behind_kg'])
    def test_roster_and_population_match_32_people(self):
        from calculations.mission_calculations import paired_roster
        roster=paired_roster();self.assertEqual(roster['minimum_awake'],8);self.assertEqual(roster['maximum_awake'],8)
        self.assertEqual(roster['pair_start_interval_hours'],42)
        habitat=json.loads(Path('data/reference/habitat_layout.json').read_text())
        self.assertEqual(habitat['people_per_disc'],16);self.assertEqual(habitat['couples_per_disc'],8)
        self.assertEqual(len(habitat['cabin_bay_layout']),8)

if __name__=='__main__': unittest.main()
