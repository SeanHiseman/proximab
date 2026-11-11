"""Idealised mission calculations; engineering feasibility is not implied.

Run with Python 3. All masses include mass-energy expelled by propulsion.
Effective exhaust fraction means thrust / (ship mass-loss rate * c),
including losses, not merely the speed of a selected exhaust particle.
"""

import json
import math

C = 299_792_458
G = 9.80665
YEAR = 365.25 * 86400


def trajectory(onboard_years, distance_ly=4.2465, acceleration_g=1.2):
    a = acceleration_g * G * YEAR / C
    # Rapidity eta: proper burn time = eta/a; beta = tanh(eta).
    max_eta = a * onboard_years / 2
    max_distance = 2 * (math.cosh(max_eta) - 1) / a
    if distance_ly > max_distance:
        raise ValueError("Distance cannot be reached in the allotted proper time")
    low, high = 0.0, max_eta
    for _ in range(100):
        eta = (low + high) / 2
        cruise = onboard_years - 2 * eta / a
        distance = 2 * (math.cosh(eta) - 1) / a + cruise * math.sinh(eta)
        if distance < distance_ly:
            low = eta
        else:
            high = eta
    eta = (low + high) / 2
    burn = eta / a
    cruise = onboard_years - 2 * burn
    earth = 2 * math.sinh(eta) / a + cruise * math.cosh(eta)
    reconstructed_distance = (
        2 * (math.cosh(eta) - 1) / a + cruise * math.sinh(eta)
    )
    assert abs(reconstructed_distance - distance_ly) < 1e-10
    assert abs(2 * burn + cruise - onboard_years) < 1e-12
    return {
        "onboard_transfer_years": onboard_years,
        "rapidity": eta,
        "peak_speed_c": math.tanh(eta),
        "each_burn_onboard_days": burn * 365.25,
        "cruise_onboard_years": cruise,
        "earth_transfer_years": earth,
        "awake_years_if_all_awake_during_burns": 2 * burn + cruise / 4,
        "torpor_years_if_all_awake_during_burns": cruise * 3 / 4,
        "awake_years_continuous_transit_roster_before_descent": onboard_years / 4,
        "torpor_years_continuous_transit_roster_before_descent": onboard_years * 3 / 4,
        "cruise_cycles_per_person": cruise * 365.25 / 28,
    }


def propulsion_case(mission, retained_tonnes, exhaust_fraction):
    ratio = math.exp(2 * mission["rapidity"] / exhaust_fraction)
    departure = retained_tonnes * ratio
    thrust = departure * 1000 * 1.2 * G
    # Local initial power associated with annihilating all expelled rest mass.
    # This special case assumes equal matter/antimatter consumption, no ballast.
    annihilation_power = thrust * C / exhaust_fraction
    absorbed = annihilation_power * 1e-6
    emitting_area = absorbed / (0.9 * 5.670374419e-8 * 1500**4)
    return {
        "retained_tonnes_including_future_fuel": retained_tonnes,
        "effective_exhaust_fraction": exhaust_fraction,
        "mass_ratio": ratio,
        "departure_tonnes": departure,
        "expended_mass_tonnes": departure - retained_tonnes,
        "antimatter_tonnes_if_equal_mass_pure_annihilation": (
            departure - retained_tonnes
        ) / 2,
        "initial_thrust_MN": thrust / 1e6,
        "initial_annihilation_power_PW": annihilation_power / 1e15,
        "emitting_area_m2_at_one_millionth_absorbed_1500K": emitting_area,
    }


def paired_roster():
    # One pair starts every 42 hours: four pairs in their awake week.
    starts = [i * 28 / 16 for i in range(16)]
    events = sorted({0.0, 28.0, *starts, *((s + 7) % 28 for s in starts)})
    populations = []
    for begin, end in zip(events, events[1:]):
        time = (begin + end) / 2
        awake = 2 * sum((time - start) % 28 < 7 for start in starts)
        populations.append((awake, end - begin))
    average = sum(count * duration for count, duration in populations) / 28
    assert min(count for count, _ in populations) == max(count for count, _ in populations) == 8
    return {"minimum_awake": 8, "maximum_awake": 8, "average_awake": average,
            "pair_start_interval_hours": 42, "pair_start_days": starts}


def proxima_b_reference():
    # Mass conditional on coplanarity (Suarez Mascareno et al. 2025).
    # Radius is an explicit rocky-world assumption, NOT a measurement.
    mass_earth, radius_earth = 1.44, 1.10
    mu = 3.986004418e14 * mass_earth
    radius = 6_371_000 * radius_earth
    altitude = 200_000
    gravity = mu / radius**2
    return {
        "conditional_mass_earth": mass_earth,
        "assumed_radius_earth_not_measured": radius_earth,
        "derived_surface_gravity_g": gravity / G,
        "assumed_parking_altitude_km": altitude / 1000,
        "circular_orbit_speed_km_s": math.sqrt(mu / (radius + altitude)) / 1000,
        "surface_escape_speed_km_s": math.sqrt(2 * mu / radius) / 1000,
        "thrust_kN_per_starting_tonne_at_local_TWR_1_5": 1.5 * gravity,
        "descent_cases_no_atmospheric_credit": [
            {"delta_v_km_s": dv, "assumed_Isp_seconds": isp,
             "wet_to_landed_mass_ratio": math.exp(dv * 1000 / (isp * G)),
             "propellant_tonnes_per_100_tonnes_landed": (
                 math.exp(dv * 1000 / (isp * G)) - 1
             ) * 100}
            for dv in (9, 10, 12)
            for isp in (450, 900, 1500, 1800, 2000)
        ],
    }


def coupled_mass_sensitivity(mission):
    # Every tonne burned during landing first completes the interstellar trip.
    interstellar_ratio = math.exp(2 * mission["rapidity"] / 0.5)
    descent_ratio = math.exp(10_000 / (1800 * G))
    return {
        "status": "Sensitivity cases, not component mass estimates",
        "interstellar_effective_exhaust_fraction": 0.5,
        "descent_delta_v_km_s": 10,
        "descent_Isp_seconds": 1800,
        "departure_tonnes_per_extra_landed_tonne": interstellar_ratio * descent_ratio,
        "departure_tonnes_per_extra_orbital_tonne": interstellar_ratio,
        "mass_cases": [
            {
                "landed_tonnes_including_descent_hardware": landed,
                "orbital_tonnes_including_future_fuel": orbital,
                "descent_propellant_tonnes": landed * (descent_ratio - 1),
                "retained_at_interstellar_braking_end_tonnes": (
                    landed * descent_ratio + orbital
                ),
                "departure_tonnes": (
                    landed * descent_ratio + orbital
                ) * interstellar_ratio,
            }
            for landed, orbital in ((100, 50), (200, 100), (300, 100))
        ],
        "shield_sensitivity_not_protection_specification": [
            {
                "illustrative_projected_area_m2": 270,
                "assumed_areal_mass_kg_m2": areal,
                "shield_tonnes": 270 * areal / 1000,
                "departure_tonnes_if_shield_retained_in_orbit": (
                    270 * areal / 1000 * interstellar_ratio
                ),
            }
            for areal in (100, 500, 1000)
        ],
        "omissions": [
            "Staging and separate orbital capture manoeuvres",
            "Time-dependent consumable losses and engine/tank scaling",
            "Integrated descent gravity losses and reserve validation",
            "Component mass and protection adequacy estimates",
        ],
    }


def whole_vehicle_landing_sensitivity():
    # All examples use 1000 t final landed mass INCLUDING all flight hardware.
    # The direct mode assumes unchanged whole-engine u_eff; it is not a landing
    # engine demonstration. Thermal mode is a separate, unproven engine mode.
    landed_kg = 1_000_000
    dv = 10_000
    u_direct = 0.5 * C
    direct_ratio = math.exp(dv / u_direct)
    thermal_ratio = math.exp(dv / (1800 * G))
    thrust_per_tonne = proxima_b_reference()[
        "thrust_kN_per_starting_tonne_at_local_TWR_1_5"
    ]
    one_MN = 1_000_000
    return {
        "status": "Ideal comparison; no surface-operating feasibility established",
        "selected_mode": "Hybrid candidate: direct antimatter braking followed by hydrogen-thermal touchdown; rows here are full-mode comparisons",
        "final_landed_mass_tonnes_including_engine": landed_kg / 1000,
        "assumed_descent_delta_v_km_s": dv / 1000,
        "direct_mode_effective_exhaust_fraction": 0.5,
        "direct_mode_total_expended_mass_kg": landed_kg * (direct_ratio - 1),
        "direct_mode_antimatter_kg_if_equal_mass_pure_annihilation": (
            landed_kg * (direct_ratio - 1) / 2
        ),
        "direct_mode_annihilation_power_TW_per_MN_thrust": (
            one_MN * C / 0.5 / 1e12
        ),
        "thermal_mode_target_Isp_seconds": 1800,
        "thermal_mode_propellant_tonnes": landed_kg * (thermal_ratio - 1) / 1000,
        "thermal_mode_exhaust_kinetic_power_GW_per_MN_thrust": (
            0.5 * one_MN * 1800 * G / 1e9
        ),
        "local_TWR_at_1_2g_proper_acceleration": (
            1.2 / proxima_b_reference()["derived_surface_gravity_g"]
        ),
        "target_initial_thrust_kN_per_wet_tonne_at_local_TWR_1_5": thrust_per_tonne,
    }


def hybrid_landing_sensitivity():
    ve = 1800 * G
    gravity = proxima_b_reference()["derived_surface_gravity_g"] * G
    # Ideal local, constant-g vertical model, starting at rest at cutoff height.
    # Coast then brake at constant proper acceleration a = 1.5g; no atmosphere.
    # For this model delta-v = sqrt(2*h*g*a/(a-g)) = sqrt(6*h*g).
    return {
        "status": "Hybrid sizing study, not a solved trajectory or radiation-safe approach",
        "terminal_Isp_seconds_unproven": 1800,
        "terminal_budget_cases": [
            {
                "thermal_delta_v_km_s_including_losses_and_reserves": dv,
                "hydrogen_tonnes_per_100_tonnes_landed": (
                    math.exp(dv * 1000 / ve) - 1
                ) * 100,
            }
            for dv in (0.5, 1, 2, 3, 5)
        ],
        "constant_gravity_vertical_examples_no_reserves": [
            {
                "height_at_direct_engine_cutoff_km": height,
                "assumed_velocity_at_cutoff_m_s": 0,
                "thermal_thrust_to_local_weight": 1.5,
                "thermal_delta_v_km_s": math.sqrt(6 * height * 1000 * gravity) / 1000,
                "hydrogen_tonnes_per_100_tonnes_landed": (
                    math.exp(math.sqrt(6 * height * 1000 * gravity) / ve) - 1
                ) * 100,
            }
            for height in (10, 50, 100)
        ],
        "omissions": [
            "Direct-engine cutoff altitude and radiation transport constraints",
            "Actual orbital approach, stellar/planetary motion and terrain",
            "Atmosphere, drag and heating",
            "Variable gravity and real thrust, throttle and switching limits",
            "Abort, hover and hazard-avoidance reserves in vertical examples",
            "Engine, tank, shielding and cooling mass",
        ],
    }


def vertical_thermal_descent(height_km, surface_thrust_to_weight=1.5, intervals=512):
    """Variable-gravity radial model; initial rest, coast, constant-a brake.

    No atmosphere, horizontal motion, rotation, throttle limits or reserves.
    This solves only the terminal boundary-value problem, not orbital approach.
    """
    mu = 3.986004418e14 * 1.44
    radius = 6_371_000 * 1.10
    top = radius + height_km * 1000
    acceleration = surface_thrust_to_weight * mu / radius**2
    # Energy fixes ignition altitude for zero velocity at the surface.
    ignition_height = mu * (top - radius) / (radius * top * acceleration)
    ignition = radius + ignition_height

    def integrate(function, upper):
        step = upper / intervals
        total = function(0) + function(upper)
        for i in range(1, intervals):
            total += (4 if i % 2 else 2) * function(i * step)
        return total * step / 3

    # Substitutions remove the endpoint singularities at rest and touchdown.
    coast_time = integrate(
        lambda x: math.sqrt(2 * top * (top - x*x) / mu),
        math.sqrt(top - ignition),
    )
    burn_time = integrate(
        lambda x: math.sqrt(2 / (acceleration - mu / (radius * (radius + x*x)))),
        math.sqrt(ignition_height),
    )
    delta_v = acceleration * burn_time
    ignition_speed = math.sqrt(2 * mu * (top - ignition) / (ignition * top))
    energy_residual = ignition_speed**2 + 2 * mu * (
        ignition - radius
    ) / (radius * ignition) - 2 * acceleration * ignition_height
    assert abs(energy_residual) < max(1e-4, ignition_speed**2 * 1e-10)
    return {
        "direct_cutoff_height_km_not_radiation_approved": height_km,
        "assumed_speed_at_cutoff_m_s": 0,
        "thermal_surface_thrust_to_weight": surface_thrust_to_weight,
        "thermal_ignition_height_km": ignition_height / 1000,
        "speed_at_thermal_ignition_km_s": ignition_speed / 1000,
        "coast_seconds": coast_time,
        "thermal_burn_seconds": burn_time,
        "total_terminal_seconds": coast_time + burn_time,
        "thermal_delta_v_km_s_no_reserves": delta_v / 1000,
        "hydrogen_tonnes_per_100_tonnes_landed_no_reserves": (
            math.expm1(delta_v / (1800 * G)) * 100
        ),
        "planet_sky_fraction_isotropic_geometric_benchmark": (
            1 - math.sqrt(1 - (radius / top)**2)
        ) / 2,
    }


def continuous_terminal_sensitivity():
    # A continuous vertical braking segment, not a solved orbital approach.
    # Initial velocity at 100 km is chosen to reach rest exactly at the surface
    # at constant 1.5-local-weight proper acceleration. There is no hover/coast.
    mu, radius = 3.986004418e14 * 1.44, 6_371_000 * 1.10
    acceleration = 1.5 * mu / radius**2
    def remaining_burn(height_m):
        steps = 512
        upper = math.sqrt(height_m)
        step = upper / steps
        def integrand(x):
            return math.sqrt(2 / (acceleration - mu / (radius * (radius + x*x))))
        total = integrand(0) + integrand(upper)
        for i in range(1, steps):
            total += (4 if i % 2 else 2) * integrand(i * step)
        return total * step / 3
    def speed(height_m):
        return math.sqrt(2 * height_m * (acceleration - mu / (radius * (radius + height_m))))
    return {
        "status": "Continuous terminal braking example; no safe direct-exhaust cutoff established",
        "initial_height_km": 100,
        "initial_downward_speed_km_s": speed(100_000) / 1000,
        "proper_acceleration_earth_g": acceleration / G,
        "total_segment_burn_seconds": remaining_burn(100_000),
        "switch_cases": [
            {
                "height_km": height,
                "downward_speed_at_switch_km_s": speed(height * 1000) / 1000,
                "thermal_burn_seconds": remaining_burn(height * 1000),
                "thermal_delta_v_km_s_no_reserves": acceleration * remaining_burn(height * 1000) / 1000,
                "hydrogen_tonnes_per_100_tonnes_landed_no_reserves": math.expm1(
                    acceleration * remaining_burn(height * 1000) / (1800 * G)
                ) * 100,
            }
            for height in (1, 5, 10, 25, 50)
        ],
    }


def prompt_gamma_benchmark():
    # Unshielded isotropic benchmark, not a radiation-transport calculation.
    # 0.38 prompt gamma fraction approximates NASA's 710/1880 MeV energy split.
    thrust = 1_000_000 * 1.2 * G  # 1000 t instantaneous mass at 1.2 Earth g
    source_power = thrust * C / 0.5
    gamma_power = 0.38 * source_power
    return {
        "instantaneous_vehicle_mass_tonnes": 1000,
        "proper_acceleration_earth_g": 1.2,
        "whole_engine_effective_exhaust_fraction": 0.5,
        "assumed_unattenuated_isotropic_prompt_gamma_fraction": 0.38,
        "annihilation_power_PW": source_power / 1e15,
        "prompt_gamma_power_PW": gamma_power / 1e15,
        "distance_cases": [
            {"source_distance_km": distance,
             "gamma_energy_flux_W_m2": gamma_power / (4 * math.pi * (distance * 1000)**2),
             "ten_MeV_water_dose_proxy_Gy_s_not_human_dosimetry": (
                 gamma_power / (4 * math.pi * (distance * 1000)**2) * 0.001566
             )}
            for distance in (1, 10, 100, 1000)
        ],
        "limitations": [
            "Actual spectrum is not monoenergetic 10 MeV; the water proxy is scale only",
            "No ground shower, backscatter, neutron production or activation model",
            "Directed particle exhaust is excluded; interception can add a major load",
            "Point source, stationary flux, no engine shielding; no burn-integrated dose",
        ],
    }


def settlement_energy_sensitivity():
    # Electrical efficiency is an illustrative future design assumption.
    return {
        "electrical_conversion_efficiency_assumed": 0.4,
        "cases": [
            {
                "net_electrical_load_MW": power,
                "years": years,
                "antimatter_kg_no_storage_losses": power * 1e6 * years * YEAR / (2 * C*C * 0.4),
                "note": "Add matching matter; support loads must be in net demand; no self-replenishing fuel assumed",
            }
            for power in (1, 3, 10, 100)
            for years in (20,)
        ],
        "rover_seven_day_hotel_energy_kWh_before_driving_and_reserves": [
            {"average_load_kW": power, "energy_kWh": power * 24 * 7}
            for power in (0.5, 1, 2)
        ],
    }


def vertical_farm_sensitivity():
    # Sizing assumptions, not a validated diet, crop plan or hardware estimate.
    dli, efficacy, canopy_delivery, hours = 40, 3, 0.8, 16
    return {
        "daily_light_integral_mol_m2_day": dli,
        "fixture_efficacy_umol_per_J_assumed": efficacy,
        "fixture_to_canopy_fraction_assumed": canopy_delivery,
        "light_hours_per_day_assumed": hours,
        "cases": [
            {
                "canopy_area_m2": area,
                "tiers_assumed": tiers,
                "rack_footprint_m2": area / tiers,
                "floor_area_m2_with_25pct_circulation_only": area / tiers * 1.25,
                "lighting_daily_energy_kWh": area * dli * 1e6 / (efficacy * canopy_delivery) / 3.6e6,
                "lighting_average_kW": area * dli * 1e6 / (efficacy * canopy_delivery) / 86400 / 1000,
                "lighting_on_power_kW": area * dli * 1e6 / (efficacy * canopy_delivery) / (hours * 3600) / 1000,
                "local_substrate_tonnes_at_point2m_1500kg_m3": area * 0.2 * 1500 / 1000,
                "substrate_kg_per_m2_rack_footprint": tiers * 0.2 * 1500,
            }
            for area in (2000, 4000)
            for tiers in (1, 2, 3)
        ],
    }


def surface_power_bank():
    antimatter, efficiency, years = 1.0, 0.4, 20
    electric_energy = 2 * antimatter * C*C * efficiency
    mean_electric = electric_energy / (years * YEAR)
    reference_load = 10e6
    source_power = reference_load / efficiency
    conversion_heat = source_power - reference_load
    sigma, emissivity = 5.670374419e-8, 0.9
    hot_area = conversion_heat / (emissivity * sigma * 600**4)
    warm_area = reference_load / (emissivity * sigma * 330**4)
    return {
        "surface_antimatter_kg": antimatter,
        "matching_ordinary_matter_kg": antimatter,
        "assumed_electrical_efficiency": efficiency,
        "ideal_electrical_inventory_TWh": electric_energy / 3.6e15,
        "equivalent_continuous_electrical_MW_for_20_years": mean_electric / 1e6,
        "working_operating_load_MW_not_selected_generator_rating": reference_load / 1e6,
        "antimatter_consumed_kg_at_reference_load_for_20_years": reference_load * years * YEAR / (2 * C*C * efficiency),
        "ideal_electrical_runtime_years_at_reference_load": electric_energy / (reference_load * YEAR),
        "source_power_MW_at_reference_load": source_power / 1e6,
        "conversion_waste_heat_MW": conversion_heat / 1e6,
        "load_heat_MW_if_all_electricity_dissipates_locally": reference_load / 1e6,
        "ideal_hot_loop_emitting_area_m2_at_600K": hot_area,
        "ideal_load_loop_emitting_area_m2_at_330K": warm_area,
        "ideal_total_emitting_area_m2": hot_area + warm_area,
        "limitations": [
            "No storage losses or reserve margins in ideal inventory figures",
            "10 MW is an operating allocation, not validated equipment demand",
            "Load heat and temperature distribution are illustrative",
            "Radiator area is emitting area, not necessarily panel planform",
            "No planet/terrain heat load, finite space view, plumbing or degradation allowance",
        ],
    }


if __name__ == "__main__":
    mission = trajectory(16)
    print(json.dumps({
        "ideal_16_year_transfer": mission,
        "transfer_with_quarter_year_reserved_for_arrival": trajectory(15.75),
        "paired_roster": paired_roster(),
        "proxima_b_conditional_reference": proxima_b_reference(),
        "coupled_mass_sensitivity": coupled_mass_sensitivity(mission),
        "whole_vehicle_landing_sensitivity": whole_vehicle_landing_sensitivity(),
        "hybrid_landing_sensitivity": hybrid_landing_sensitivity(),
        "continuous_terminal_braking_example": continuous_terminal_sensitivity(),
        "prompt_gamma_benchmark": prompt_gamma_benchmark(),
        "settlement_energy_sensitivity": settlement_energy_sensitivity(),
        "vertical_farm_sensitivity": vertical_farm_sensitivity(),
        "surface_power_bank": surface_power_bank(),
        "variable_gravity_terminal_descent_not_orbital_approach": [
            vertical_thermal_descent(height, thrust_weight)
            for height in (25, 50, 100, 250, 500, 1000)
            for thrust_weight in (1.5, 2.0, 3.0)
        ],
        "propulsion_sensitivity_not_component_mass_estimates": [
            propulsion_case(mission, retained, exhaust)
            for retained in (200, 400, 600)
            for exhaust in (0.3, 0.5)
        ],
        "descent_sensitivity_450s_Isp": [
            {"delta_v_km_s": dv,
             "wet_to_landed_mass_ratio": math.exp(dv * 1000 / (450 * G))}
            for dv in (2, 5, 9)
        ],
        "disc_rotation_for_1g_at_rim": [
            {"radius_m": radius,
             "rpm": math.sqrt(G / radius) * 60 / (2 * math.pi)}
            for radius in (20, 30, 40)
        ],
    }, indent=2))
