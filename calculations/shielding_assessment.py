"""Reproducible radiation screening; NOT a crew-dose transport calculation."""
import json
import math
from pathlib import Path

C = 299792458
G = 9.80665
YEAR = 365.25 * 86400
GAMMA_FRACTION = 710 / 1880  # NASA LaPointe, 2020, slide 12
W_DENSITY = 19.3  # g/cm3, nominal bulk tungsten
# NIST photon tables: (energy MeV, W mu/rho cm2/g, water mu_en/rho cm2/g).
PHOTON_CASES = [(4, .04038, .02066), (10, .04747, .01566)]
ENGINE_PHOTON_PROXY_BUDGET_GY = .010
SOURCES = {
    "dose_limits": "https://www.nasa.gov/reference/4-0-human-performance/",
    "annihilation_products": "https://ntrs.nasa.gov/api/citations/20200001904/downloads/20200001904.pdf",
    "tungsten_coefficients": "https://physics.nist.gov/PhysRefData/XrayMassCoef/ElemTab/z74.html",
    "water_coefficients": "https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/water.html",
    "dust_erosion": "https://arxiv.org/pdf/1608.05284",
    "impact_secondaries": "https://arxiv.org/html/2201.02721v1",
    "bumper_simulations": "https://ldrd-annual.llnl.gov/archives/ldrd-annual-2018/hed/erd/17-ERD-091",
    "gcr_transport": "https://ntrs.nasa.gov/api/citations/20170005580/downloads/20170005580.pdf",
}


def photon_screen(energy_j, distance_m, mu_w, mu_en_water, budget_gy):
    fluence = energy_j / (4 * math.pi * distance_m**2)
    # 1 cm2/g = 0.1 m2/kg. Water kerma proxy assumes charged-particle equilibrium.
    proxy = fluence * mu_en_water * .1
    attenuation = max(1, proxy / budget_gy)
    thickness_cm = math.log(attenuation) / (mu_w * W_DENSITY)
    return {
        "fluence_J_m2": fluence,
        "unshielded_water_kerma_proxy_Gy": proxy,
        "required_primary_attenuation_factor": attenuation,
        "narrow_beam_W_cm": thickness_cm,
        "W_areal_kg_m2": thickness_cm * W_DENSITY * 10,
        "extra_W_cm_if_multiplicative_buildup_1000": math.log(1000) / (mu_w * W_DENSITY),
        "distance_only_proxy_m": distance_m * math.sqrt(attenuation),
    }


def shadow_rectangle(source_x, source_radius, stand_off, wheel_radius, z_half):
    # Bounding rectangular shadow of a finite source in a transverse plane.
    # Wheel x,y points sampled independently of the conservative z envelope.
    half_y = max(
        source_radius + stand_off * (wheel_radius * math.sin(t) - source_radius)
        / (source_x - wheel_radius * math.cos(t))
        for t in (math.pi * i / 8192 for i in range(8193))
    )
    half_z = source_radius + stand_off * (z_half - source_radius) / (source_x - wheel_radius)
    return 2 * half_y, 2 * half_z


def rectangle_solid_angle(height, width, distance):
    return 4 * math.atan((height/2)*(width/2) / (
        distance * math.sqrt(distance**2+(height/2)**2+(width/2)**2)))


def point_source_thermal_distance(gamma_power, allowed_heat, deposited_fraction):
    # Freeze the present crew envelope and use a point source; shield plane 5 m from source.
    lo, hi = 100, 1e6
    for _ in range(70):
        x = (lo+hi)/2
        h, w = shadow_rectangle(x, 0, 5, 19.5, 7)
        heat = gamma_power * rectangle_solid_angle(h, w, 5)/(4*math.pi)*deposited_fraction
        if heat > allowed_heat:
            lo = x
        else:
            hi = x
    return hi


def build_assessment(data):
    # Assesses the superseded three-deck reference; the selected ship is assessed in ship_design.py.
    cfg, tr, layout = data["mission_config"], data.get("reference_trajectory", data["trajectory"]), data.get("reference_layout", data["layout"])
    selected = data.get("reference_design", data["viewer_design"])["nominal"]
    mass = selected["departure_mass_kg"]
    exhaust = cfg["effective_exhaust_fraction_c"]
    acceleration = cfg["main_acceleration_g"] * G
    eta, beta = tr["rapidity"], tr["peak_speed_c"]
    after_acceleration = mass * math.exp(-eta / exhaust)
    after_braking = after_acceleration * math.exp(-eta / exhaust)
    energy = (mass - after_braking) * C**2
    power = mass * acceleration * C / exhaust
    gamma_energy, gamma_power = energy * GAMMA_FRACTION, power * GAMMA_FRACTION
    scenarios = []
    for distance in [40.3, 84.5, 100, 1000, 10000, 100000]:
        scenarios.append({"source_distance_m": distance, "cases": [
            {"hypothetical_photon_energy_MeV": e, **photon_screen(
                gamma_energy, distance, mu, mu_en, ENGINE_PHOTON_PROXY_BUDGET_GY)}
            for e, mu, mu_en in PHOTON_CASES
        ]})
    shadows = []
    for source_radius in [0, .1, 1]:
        for distance in [5, 10, 50]:
            h, w = shadow_rectangle(84.5, source_radius, distance, layout["disc_radius_m"], 7)
            area = h * w
            # Exact solid angle for a centred rectangle illuminated by a point.
            omega = rectangle_solid_angle(h, w, distance)
            incident = gamma_power * omega / (4 * math.pi)
            shadows.append({
                "source_radius_m": source_radius, "shield_distance_from_source_m": distance,
                "height_m": h, "width_m": w, "area_m2": area,
                "W_mass_tonnes_at_50cm": area * .5 * W_DENSITY,
                "central_point_incident_gamma_TW": incident / 1e12,
                "emitting_km2_if_all_deposited_1500K": incident / (.9 * 5.670374419e-8 * 1500**4) / 1e6,
                "emitting_km2_if_all_deposited_2500K": incident / (.9 * 5.670374419e-8 * 2500**4) / 1e6,
            })
    n_h = .2 * 1e6  # nominal total H density, cm-3 to m-3; not a measured route map
    proton_mass = 1.67262192369e-27
    kinetic = (1 / math.sqrt(1-beta**2) - 1) * proton_mass * C**2
    gas_flux = n_h / math.sqrt(1-beta**2) * beta * C * kinetic
    refuge = layout["refuge_study"]
    a, polar, length = refuge["radius_m"], .65, refuge["length_m"]
    e = math.sqrt(1-(polar/a)**2)
    refuge_area = 2*math.pi*a*length + 2*math.pi*a*a*(1+(1-e*e)/e*math.atanh(e))
    wheel_area = 2 * (2*math.pi*layout["disc_radius_m"]**2
                      + 2*math.pi*layout["disc_radius_m"]*layout["disc_axial_depth_m"])
    return {
        "status": "SCREENING ONLY; no particle transport or verified crew protection",
        "sources": SOURCES,
        "reference_limits": {"career_effective_mSv": 600, "nuclear_sources_mSv_per_mission_year": 20,
                             "design_reference_SPE_mSv": 250, "long_mission_SPE_water_equivalent_g_cm2": 20},
        "proposed_20yr_budget_mSv_not_a_NASA_allocation": {
            "propulsion": 10, "onboard_power": 10, "ISM_secondaries": 100,
            "GCR": 300, "SPE": 50, "reserve_including_prior_exposure": 130},
        "mission": {"initial_mass_kg": mass, "after_acceleration_kg": after_acceleration,
                    "after_braking_kg": after_braking, "each_burn_proper_days": tr["each_burn_onboard_days"],
                    "burned_interstellar_mass_kg": mass-after_braking, "peak_c": beta,
                    "initial_power_PW": power/1e15, "assumed_prompt_gamma_fraction": GAMMA_FRACTION,
                    "initial_prompt_gamma_PW": gamma_power/1e15, "two_burn_prompt_gamma_J": gamma_energy,
                    "omitted": ["capture/descent burns", "onboard power sources", "shield mass feedback"]},
        "engine_photon_cases": scenarios,
        "shadow_cases": shadows,
        "thermal_distance_screen": {
            "assumed_available_heat_W": power*1e-7,
            "assumed_source": "point; not a finite engine; frozen baseline power/envelope",
            "all_existing_engine_heat_allowance_given_to_crew_shadow_shield": True,
            "cases": [{"deposited_fraction": f,
                       "habitat_centre_to_source_m": point_source_thermal_distance(gamma_power, power*1e-7, f)}
                      for f in [1,.1,.01]],
            "not_a_safe_distance": True},
        "onboard_2MWe_power_at_40percent_efficiency": {
            "annihilation_MW": 5,
            "10MeV_proxy_at_10m": photon_screen(5e6 * GAMMA_FRACTION * 20 * YEAR, 10, .04747, .01566, .010)},
        "forward_shield": {
            "incoming_proton_MeV": kinetic / 1.602176634e-13,
            "assumed_H_cm3": .2, "peak_H_only_deposition_W_m2": gas_flux,
            "nominal_face_area_m2": layout["forward_shield_height_m_study"]*layout["forward_shield_width_m_study"],
            "current_areal_g_cm2": layout["shield_areal_mass_kg_m2_sensitivity"]/10,
            "helium_and_dust_not_in_heat_estimate": True,
            "nominal_H_column_cm2": .2 * 4.2465 * C * YEAR * 100,
            "grain_energies_at_density_3000kg_m3": [
                {"radius_micrometres": r, "energy_J": (1/math.sqrt(1-beta**2)-1)
                 * (4*math.pi/3*(r*1e-6)**3*3000) * C**2} for r in [1,10,100,1000]],
            "max_unmitigated_hazardous_grain_density_m3_for_99_9percent_no_hit": (
                -math.log(.999) / (620 * 4.2465 * C * YEAR)),
            "dust_standoff_m_to_simulate_not_selected": [10, 30, 100],
            "unmeasured_cloud_half_angles_deg": [1, 10],
            "cloud_radius_cases_m": [
                {"standoff_m": d, "one_degree": d*math.tan(math.radians(1)),
                 "ten_degrees": d*math.tan(math.radians(10))} for d in [10,30,100]],
        },
        "SPE_20g_cm2_mass_screen": {
            "flat_areal_kg_m2": 200, "refuge_outer_area_m2": refuge_area,
            "refuge_thin_layer_tonnes_lower_estimate": refuge_area * .2,
            "both_wheels_outer_area_m2": wheel_area,
            "both_wheels_thin_layer_tonnes_lower_estimate": wheel_area * .2,
            "limits": "thin-layer mass; excludes finite thickness growth, structure, plumbing and openings; not GCR qualification"},
        "transport_required": ["full annihilation/exhaust source", "EM and hadronic cascades",
                               "neutrons and muons", "finite source/3D geometry and penetrations",
                               "body phantoms/effective and organ doses", "heat deposition",
                               "GCR and SPE environments", "reversed braking orientation"],
    }


if __name__ == "__main__":
    root = Path(__file__).resolve().parent.parent
    result = build_assessment(json.loads((root / "mission-viewer/dist/design-data.json").read_text(encoding="utf-8")))
    (root / "reports/shielding-assessment.json").write_text(json.dumps(result, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"mission": result["mission"], "forward_shield": result["forward_shield"],
                      "SPE_mass": result["SPE_20g_cm2_mass_screen"]}, indent=2))
