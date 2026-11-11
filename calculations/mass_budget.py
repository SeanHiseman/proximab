"""Auditable planning mass/fuel estimate, NOT a demonstrated antimatter spacecraft.

All low/base/high values are sensitivity scenarios, not confidence intervals.
Run this file to write mass-budget.json and refresh the mass ledger in layout.
"""
import json
import math
from pathlib import Path
from calculations.mission_calculations import C, G, YEAR, trajectory, surface_power_bank

ROOT = Path(__file__).resolve().parent.parent
SOURCES = [
    {"title": "NASA Life Support Baseline Values and Assumptions Document (2018), tables 4-43 and 4-57", "url": "https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf", "use": "Dry food 0.617 kg/person/day; nominal food packaging 0.26 kg/person/day. Torpor physiology is not established."},
    {"title": "NASA artificial-gravity concept feasibility study (2019)", "url": "https://ntrs.nasa.gov/api/citations/20190000843/downloads/20190000843.pdf", "use": "Inflatable habitat mass is not negligible; cited TransHab/BEAM volumetric densities are context, not mass coefficients for this design."},
]


def build_budget(exhaust_fraction=0.5):
    if not 0 < exhaust_fraction <= 1:
        raise ValueError("Effective exhaust fraction must be in (0, 1]")
    reference = json.loads((ROOT / 'data/mass_reference_inputs.json').read_text(encoding='utf-8'))
    layout, habitat = reference['layout'], reference['habitat']
    r, depth, count = layout["disc_radius_m"], layout["disc_axial_depth_m"], habitat["disc_count"]
    radii = habitat["geometry_study_not_selected_dimensions"]["deck_floor_radii_m"]
    floor = count * 2 * math.pi * sum(radii) * 3.0
    pressure_area = count * (2 * math.pi * r*r + 2 * math.pi * r * depth)
    gross_volume = count * math.pi * r*r * depth
    gas = 70_000 * gross_volume / (287.05 * 293.15)
    days = 36 * 365.25 * 16.5  # 16 years + six months commissioning food.
    power = surface_power_bank()
    warm_area = power["ideal_total_emitting_area_m2"] * 1.25
    transit_power_am = 2e6 * 16 * YEAR / (2 * C*C * 0.4)
    rows = []

    def row(key, system, masses, basis, kind="hardware"):
        rows.append({"id": key, "system": system, "low_kg": masses[0], "mass_kg": masses[1], "high_kg": masses[2], "basis": basis, "kind": kind, "status": "Planning estimate; " + basis})

    row("membranes", "Habitat pressure membranes, insulation and restraint", [pressure_area*x for x in (6, 10, 18)], f"{pressure_area:.1f} m² full-disc surface ×6/10/18 kg/m²; advanced laminate assumptions, excluding separate radiation shielding")
    row("floors", "Folding composite floors", [floor*x for x in (10, 18, 30)], f"{floor:.1f} m² gross deck area ×10/18/30 kg/m²; load ratings and folding joints unqualified")
    row("habframes", "Habitat deployment frames, hatches and cabin partitions", [30_000, 50_000, 90_000], "Two large deployable pressure structures; allowances include partitions, access and frame hardware")
    row("bearings", "Hubs, bearings, spin motors and balance equipment", [12_000, 24_000, 45_000], "Two independently driven hubs; no validated bearing or transfer design")
    row("furnishings", "Cabins, wardrooms, lounge, hygiene and exercise fittings", [12_000, 22_000, 38_000], "18 shared cabins; common rooms sized for all36 awake; excludes medical systems and life-support plant")
    row("structure", "Service spine, engine mounts and attachment structure", [30_000, 55_000, 100_000], "281m ship and target1.2g thrust; advanced composite/metal allowance, no structural analysis")
    row("landing", "Landing supports, restraints and habitat transport covers", [20_000, 38_000, 75_000], "Permanent horizontal landing baseline; distributed supports and full-scale packing racks")
    shield_area = layout["forward_shield_height_m_study"] * layout["forward_shield_width_m_study"]
    row("dustshield", "Forward dust/gas shield stack and supports", [shield_area*x for x in (50, 100, 250)], f"{shield_area:.0f} m² frontal area ×50/100/250 kg/m²; sensitivity only, no demonstrated0.26c dust/gas protection")
    row("radiationshield", "Crew refuge radiation shielding", [15_000, 30_000, 70_000], "Dedicated shielding allowance beyond distributed water/food; dose transport unresolved")
    row("engine", "Direct and hydrogen-thermal engine hardware", [35_000, 80_000, 180_000], "Speculative coils, nozzle, cooling, chambers and feed system; target exhaust/thrust not demonstrated")
    row("containment", "Main antimatter storage and cryogenic hardware", [40_000, 120_000, 350_000], "Speculative allocation only; no known design stores calculated tonnes of antimatter, no demonstrated mass scaling")
    row("refuge", "Rigid 36-person descent refuge and airlocks", [12_000, 22_000, 40_000], "108m³ minimum pressure-volume allocation at3m³/person; seats, medical interfaces and emergency systems")
    row("eclss", "Redundant life support and water/waste processing", [15_000, 28_000, 50_000], "36-person full-awake design; duplicated critical functions and spares in separate row")
    row("medical", "36 torpor beds, medical systems and embryo storage", [14_000, 27_000, 50_000], "36 medical beds ×250/500/900kg plus clinical/cryogenic equipment; safe repeated torpor unproven")
    row("power", "10MWe power conversion, distribution and startup storage", [20_000, 40_000, 85_000], "Two isolated conversion trains, switchgear, cables, backup battery/solar starter kit; speculative AM heat source")
    row("warmradiators", "Service/surface radiators and heat-recovery loops", [warm_area*x for x in (2.5, 4, 7)], f"{warm_area:.1f} m² emitting area including25% area allowance ×2.5/4/7 kg/m²;600K/330K ideal loops, terrain/view factors unresolved")
    row("avionics", "Avionics, navigation, communications and sensors", [4_000, 8_000, 16_000], "Independent navigation/control and high-gain communication; beam link budget unresolved")
    row("factory", "Advanced fabrication, chemistry and resource-processing seed", [30_000, 65_000, 150_000], "Complete local production assumed; numerical machinery allowance is not a self-replicating factory demonstration")
    row("farm", "Inflatable farm, eight bays and 2,000 m2 crop hardware", [12_000, 25_000, 50_000], "Carried envelopes, racks, LEDs, pumps, seed/biological stock; eight 18 x 13 m bay envelopes; 2,016 m2 depicted tray area; ideal 833 m2 rack/access footprint is a lower bound;600t local regolith excluded")
    row("rover", "Reused pressurised rover module, chassis and7-day stores", [6_000, 10_000, 18_000], "Cabin counted once, reused from cruise;2 occupants, battery, chassis, suits and consumables")
    row("spares", "Repair stock, tools, EVA suits and replacement units", [15_000, 35_000, 75_000], "16-year spares allowance beyond already counted redundant installed hardware")
    row("gas", "Initial habitat atmosphere and gas makeup", [gas+2_000, gas+5_000, gas+12_000], f"Full-disc gross volume{gross_volume:.1f}m³ at70kPa/293K; air-equivalent gas constant; makeup allowance, packaging tanks below", "consumable")
    row("water", "Water/oxygen-cycle buffers and process starting inventory", [15_000, 25_000, 45_000], "Regenerative water/oxygen systems assumed; starting water plus loss/contingency stock, no16-year open-loop water budget", "consumable")
    row("food", "Dry food plus food packaging,16years +6months commissioning", [days*(.617+.15), days*(.617+.26), days*(.75+.31)], f"{days:.0f} person-days; no torpor metabolic discount; nominal NASA0.617kg dry food +0.26kg packaging/person/day; all waste retained conservatively", "consumable")
    row("consumables", "Medical, hygiene, nutrient and general consumables", [12_000, 25_000, 50_000], "16-year specialist consumables allocation; safe drug/food shelf life and nutrient renewal unresolved", "consumable")
    row("processtanks", "Atmosphere, water and process tank hardware", [5_000, 10_000, 20_000], "Reusable ordinary-material pressure tanks; thermal hydrogen tank sized separately")
    row("crew", "36 crew and personal effects", [36*90, 36*100, 36*120], "Includes people and personal effects; no births during transit", "crew")
    row("exploration", "Remote exploration complete allocation", [450, 450, 450], "Strict user allocation below500kg; carrier feasibility unproven; conservatively retained throughout fuel sizing", "payload")
    row("powerfuel", "Surface and transit power antimatter plus matching matter", [2+2*transit_power_am]*3, f"1kg surface antimatter +1kg matter; separate2MWe/16-year transit supply at40% efficiency({transit_power_am:.4f}kg antimatter)", "consumable")

    mission = trajectory(16)
    eta = mission["rapidity"]
    thermal_ve = 1800 * G
    thermal_ratio = math.exp(1025 / thermal_ve)
    arrival_ratio = math.exp(12_000 / (exhaust_fraction*C))
    burn_ratio = math.exp(eta / exhaust_fraction)
    direct_ratio = burn_ratio**2 * arrival_ratio
    total_ratio = thermal_ratio * direct_ratio
    # 50% of annihilation rest energy heats hydrogen; nonrelativistic kinetic term.
    thermal_am_per_hydrogen = thermal_ve**2 / (4*.5*C*C)
    hydrogen_per_landed = (thermal_ratio-1)/(1+2*thermal_am_per_hydrogen)
    direct_consumed_per_landed = (direct_ratio-1)*thermal_ratio
    reserve_per_landed = .05 * direct_consumed_per_landed
    flux = .9 * 5.670374419e-8 * 1500**4
    cases = []
    for index, name in enumerate(("low", "base", "high")):
        field = ("low_kg", "mass_kg", "high_kg")[index]
        margin = (.15, .25, .4)[index]
        tank_coeff = (.08, .12, .2)[index]
        absorbed_fraction = (1e-8, 1e-7, 3e-7)[index]
        radiator_areal = (3, 5, 8)[index]
        hardware = sum(x[field] for x in rows if x["kind"] == "hardware")
        other = sum(x[field] for x in rows if x["kind"] != "hardware")
        fixed = hardware*(1+margin)+other
        thermal_feedback = (1+margin)*radiator_areal*absorbed_fraction*(1.2*G)*C/(exhaust_fraction*flux)*total_ratio
        tank_feedback = (1+margin)*tank_coeff*hydrogen_per_landed
        denominator = 1-thermal_feedback-tank_feedback-reserve_per_landed
        if denominator <= 0:
            raise ValueError("No finite mass solution for assumed engine heat interception and radiator mass")
        landed = fixed/denominator
        departure = landed*total_ratio
        hydrogen = landed*hydrogen_per_landed
        thermal_am = hydrogen*thermal_am_per_hydrogen
        direct_fuel = landed*direct_consumed_per_landed
        reserve = direct_fuel*.05
        tank = hydrogen*tank_coeff
        initial_thrust = departure*1.2*G
        power_w = initial_thrust*C/exhaust_fraction
        hot_area = power_w*absorbed_fraction/flux
        hot_radiator = hot_area*radiator_areal
        extra_hardware = tank+hot_radiator
        margin_kg = (hardware+extra_hardware)*margin
        # 2 cases of equal rest-mass antimatter/matter direct propulsion.
        planned_fuel = direct_fuel + hydrogen + 2*thermal_am
        assert abs(departure-landed-planned_fuel) < 1e-6
        assert abs(landed-(hardware+other+extra_hardware+margin_kg+reserve)) < 1e-6
        cases.append({
            "name": name, "status": "Conditional planning solution; antimatter containment, engine and shield not validated",
            "fixed_hardware_kg": hardware, "other_retained_kg": other,
            "hydrogen_tank_kg": tank, "engine_hot_radiator_kg": hot_radiator,
            "hardware_margin_fraction": margin, "hardware_margin_kg": margin_kg,
            "retained_direct_propellant_reserve_kg": reserve,
            "final_retained_mass_kg": landed, "departure_mass_kg": departure,
            "thermal_hydrogen_kg": hydrogen, "thermal_antimatter_kg": thermal_am,
            "thermal_matching_matter_kg": thermal_am,
            "direct_propellant_consumed_kg": direct_fuel,
            "direct_antimatter_consumed_kg": direct_fuel/2,
            "direct_matching_matter_consumed_kg": direct_fuel/2,
            "propulsion_antimatter_loaded_kg": (direct_fuel+reserve)/2+thermal_am,
            "propulsion_matching_matter_loaded_kg": (direct_fuel+reserve)/2+thermal_am,
            "surface_antimatter_reserved_kg": 1.0, "transit_power_antimatter_kg": transit_power_am,
            "initial_thrust_MN": initial_thrust/1e6,
            "initial_annihilation_power_PW": power_w/1e15,
            "engine_absorbed_fraction": absorbed_fraction,
            "engine_absorbed_heat_MW": power_w*absorbed_fraction/1e6,
            "engine_radiator_emitting_area_m2": hot_area,
            "service_radiator_emitting_area_m2": warm_area,
            "total_radiator_emitting_area_m2": hot_area+warm_area,
            "engine_radiator_temperature_K": 1500,
            "engine_radiator_kg_per_emitting_m2": radiator_areal,
            "thermal_mass_feedback_coefficient": thermal_feedback,
            "hydrogen_tank_mass_feedback_coefficient": tank_feedback,
            "direct_reserve_mass_feedback_coefficient": reserve_per_landed,
            "critical_engine_absorbed_fraction_no_finite_mass_solution": absorbed_fraction*(1-tank_feedback-reserve_per_landed)/thermal_feedback,
            "nominal_phase_masses_kg": {
                "departure": departure,
                "after_acceleration": departure/burn_ratio,
                "before_interstellar_braking": departure/burn_ratio,
                "after_interstellar_braking": departure/burn_ratio**2,
                "after_direct_arrival_braking": landed*thermal_ratio,
                "after_hydrogen_touchdown": landed,
            },
        })
    base = cases[1]
    for key, system, values, basis in [
        ("hydrogentank", "Thermal hydrogen tank and insulation", [x["hydrogen_tank_kg"] for x in cases], "8/12/20% of calculated hydrogen mass; tank reused after landing"),
        ("engineradiator", "Engine hot radiator system", [x["engine_hot_radiator_kg"] for x in cases], "Sized from initial1.2g power;10^-8/10^-7/3×10^-7 intercepted fraction at1500K; conditional closed-form mass feedback"),
        ("margin", "Hardware development mass allowance", [x["hardware_margin_kg"] for x in cases], "15/25/40% hardware-only allowance including fuel-dependent tank and hot radiator"),
        ("fuelreserve", "Unburned direct propulsion reserve, matter + antimatter", [x["retained_direct_propellant_reserve_kg"] for x in cases], "5% of nominal direct fuel consumed; retained at landing, not counted as burn mass"),
    ]:
        row(key, system, values, basis, "derived")
    exhaust_sensitivity = []
    for fraction in (.3, .5):
        ratio_direct = math.exp(2*eta/fraction + 12_000/(fraction*C))
        ratio_total = thermal_ratio*ratio_direct
        for index, case in enumerate(cases):
            margin = case["hardware_margin_fraction"]
            rad_feedback = (1+margin)*case["engine_radiator_kg_per_emitting_m2"]*case["engine_absorbed_fraction"]*(1.2*G)*C/(fraction*flux)*ratio_total
            reserve_feedback = .05*(ratio_direct-1)*thermal_ratio
            denominator = 1-rad_feedback-case["hydrogen_tank_mass_feedback_coefficient"]-reserve_feedback
            result = {"case": case["name"], "effective_exhaust_fraction_c": fraction, "mass_feedback_denominator": denominator, "finite_solution": denominator > 0}
            if denominator > 0:
                retained = (case["fixed_hardware_kg"]*(1+margin)+case["other_retained_kg"])/denominator
                consumed_direct = retained*(ratio_direct-1)*thermal_ratio
                h2 = retained*hydrogen_per_landed
                result.update({"retained_kg": retained, "departure_kg": retained*ratio_total, "thermal_hydrogen_kg": h2, "propulsion_antimatter_loaded_kg": consumed_direct*1.05/2+h2*thermal_am_per_hydrogen, "status": "Conditional numerical solution; hardware remains unvalidated"})
            else:
                result["status"] = "No finite solution at1.2g for these heat-interception, reserve and radiator assumptions; no mass is reported."
            exhaust_sensitivity.append(result)
    return {
        "status": "Complete numerical planning ledger; no null masses. Not a physically closed or flight-qualified design.",
        "geometry": {"gross_floor_area_m2": floor, "assumed_usable_floor_width_m": 3.0, "net_floor_fraction_assumed": .65, "net_floor_area_m2_assumed": floor*.65, "full_disc_pressure_area_m2": pressure_area, "full_disc_gross_pressure_volume_m3": gross_volume, "pressure_Pa": 70_000, "gas_temperature_K": 293.15},
        "assumptions": {"mission_onboard_years": 16, "crew": 36, "effective_direct_exhaust_fraction_c": exhaust_fraction, "interstellar_rapidity_each_burn": eta, "arrival_direct_delta_v_km_s_allowance": 12, "hydrogen_terminal_delta_v_km_s": 1.025, "thermal_Isp_s_unproven": 1800, "thermal_heating_efficiency_assumed": .5, "direct_propellant_reserve_fraction": .05, "food_crew_person_days": days, "torpor_metabolic_discount": 0, "surface_commissioning_food_years": .5, "main_burn_target_acceleration_g": 1.2, "service_radiator_area_m2": warm_area, "food_and_waste_mass_policy": "Food converted to retained water, nutrients and stored carbon/waste; complete oxygen regeneration from CO2 assumed, no expelled mass credit. Power fuel mass-energy loss <0.1kg ignored in phase masses conservatively.", "local_resource_mass_excluded": "Regolith, building material, later process water and all surface-manufactured expansion; accessible suitable resources assumed."},
        "components": rows, "cases": cases, "nominal": base,
        "totals": {"low_retained_kg": cases[0]["final_retained_mass_kg"], "retained_kg": base["final_retained_mass_kg"], "high_retained_kg": cases[2]["final_retained_mass_kg"], "low_departure_kg": cases[0]["departure_mass_kg"], "departure_kg": base["departure_mass_kg"], "high_departure_kg": cases[2]["departure_mass_kg"]},
        "limitations": ["Main antimatter storage and0.5c effective engine performance are unresolved technologies: numerical allowances do not prove their feasibility.", "Shield areal mass is a sensitivity, not a demonstrated0.26c dust/gas or radiation design.", "Engine absorbed fraction is an exceptionally stringent assumption, not demonstrated isolation. Above the reported feedback threshold this model has no finite mass solution at1.2g.", "Hot engine radiators cannot share cold life-support loops;1500K systems, pumps, fluids and radiation tolerance remain unqualified.", "Full-disc cylinder approximates the outer envelope and bounds gross gas volume; actual compartmentalised membrane area can be larger and gas volume smaller. Reconstruct lobes and partitions before structural sizing.", "Six-month commissioning food reserve is provisional;16-year food/drug shelf life, torpor recovery and food synthesis require qualification.", "Long cold cruise and hydrogen zero-boiloff hardware are included only by allocation; storage losses need a designed system.", "No high-specific-power, tonnes-scale antimatter bank design exists; containment hardware does not yet scale with fuel capacity.", "Arrival12km/s is an allowance, not an integrated orbital/terrain/exhaust trajectory.16-year transfer excludes extra operational time.", "All36 may be awake; redundancy and margins are planning allowances, not reliability proof.", "Low/base/high are combined design sensitivities, not statistical confidence bounds."],
        "sources": SOURCES, "exhaust_sensitivity": exhaust_sensitivity,
    }


def write_outputs():
    result = build_budget()
    (ROOT / "reports/mass-reference-budget.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps({"totals": result["totals"], "nominal": result["nominal"]}, indent=2))


if __name__ == "__main__":
    write_outputs()
