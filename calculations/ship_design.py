"""Selected lightweight two-disc ship: geometry-derived masses, propulsion, storage,
radiation and shield screening calculations, and a closed mass ledger.

Run `python -m calculations.ship_design` to write reports/ship-design.json.
Every result is a first-order screening figure under the stated assumptions.
None of the antimatter, torpor or shielding hardware is demonstrated engineering.
"""
import json
import math
from pathlib import Path

from calculations.mission_calculations import C, G, YEAR, trajectory
from calculations.mission_300_trade import build_target

ROOT = Path(__file__).resolve().parent.parent
SIGMA = 5.670374419e-8
EPS0 = 8.8541878128e-12
MEV = 1.602176634e-13
LIGHT_YEAR = C * YEAR
AIR_DENSITY = 70_000 / (287.05 * 293.15)      # kg/m3 at the 70 kPa / 293 K cabin assumption

# ---- Assumptions that are inputs, not results --------------------------------
ENVELOPE_KG_M2 = 6.0            # project coefficient for the disc pressure envelope
FLOOR_KG_M2 = 10.0              # project coefficient for folding floors
LH2_DENSITY = 70.8              # kg/m3
SOLID_H2_DENSITY = 86.0         # kg/m3, used for antihydrogen ice
TUNGSTEN_DENSITY = 19_300
W_MU_RHO_4MEV = 0.04038e-1      # m2/kg, NIST total attenuation, minimum-attenuation region
WATER_MUEN_RHO_4MEV = 0.02066e-1  # m2/kg, NIST energy absorption
GAMMA_FRACTION = 710 / 1880     # prompt gamma share of annihilation energy (LaPointe, NASA)
H_DENSITY_M3 = 0.2e6            # interstellar hydrogen, study assumption
GAMMA_YIELD_21MEV = 4.4e-3      # 4.44 MeV photons per stopped 21.5 MeV proton in carbon (estimate)
SV_PER_PHOTON_M2 = 1.05e-11 * 1e-4  # effective dose per unit fluence of 4.4 MeV photons (ICRP 116, ISO)


def habitat(layout, hab):
    """Two discs whose decks fill them to the hub: areas, volume, spin and geometry-derived masses."""
    geo = hab['geometry_study_not_selected_dimensions']
    radii = geo['deck_floor_radii_m']
    floor_r = radii[0]
    depth = layout['disc_axial_depth_m']
    envelope_r = floor_r + 0.02 + 0.75          # rim wall plus its rounded bulge, as drawn
    g_floor = layout['spin_gravity_g']
    omega = math.sqrt(g_floor * G / floor_r)
    area = 2 * (2 * math.pi * envelope_r**2 + 2 * math.pi * envelope_r * depth)
    floor = 2 * 2 * math.pi * sum(radii) * (depth - 0.2)
    volume = 2 * math.pi * envelope_r**2 * depth
    reference_area = 5881.1                     # three-deck 19.5 m discs
    rim_hoop_N_m = 70_000 * depth / 2           # rim bulge treated as a half-cylinder of radius depth/2
    return dict(
        floor_radius_m=floor_r, envelope_radius_m=envelope_r, axial_depth_m=depth,
        spin_rad_s=omega, spin_rpm=omega * 60 / (2 * math.pi), gravity_at_floor_g=g_floor,
        gravity_at_head_g=g_floor * (floor_r - 1.8) / floor_r,
        deck_floor_radii_m=radii, deck_gravity_g=[g_floor * r / floor_r for r in radii],
        rim_speed_m_s=omega * floor_r,
        pressure_envelope_area_m2=area, gross_floor_area_m2=floor,
        usable_floor_area_m2_at_65_percent=floor * 0.65, pressure_volume_m3=volume,
        rim_hoop_load_kN_m=rim_hoop_N_m / 1e3,
        membranes_kg=area * ENVELOPE_KG_M2, floors_kg=floor * FLOOR_KG_M2,
        frames_kg=24_000 * area / reference_area,
        bearings_kg=6_000, fittings_kg=2_500, transfer_tube_kg=500,
        atmosphere_kg=volume * AIR_DENSITY,
        reference_comparison=dict(pressure_envelope_area_m2=reference_area, gross_floor_area_m2=1526.8,
                                  pressure_volume_m3=10751.0, spin_rpm=5.05, gravity_at_floor_g=0.5),
        status='Same construction coefficients as the three-deck reference. Flat faces need internal '
               'ties; a quarter of Earth gravity at about 5 rpm is unvalidated for 20 years.')


def surface_inflatables(layout):
    """Two closed two-storey inflatable cylinders carried packed; restraint sized from hoop load."""
    s = layout['surface_inflatables_study']
    r, length, count = s['radius_m'], s['cylinder_length_m'], s['count']
    pressure = 70_000
    allowable = 3.2e9 * 0.5 / 4                 # Vectran fibre strength x seam/creep knockdown / safety factor 4
    restraint_cyl = 1.5 * pressure * r / allowable * 1400     # hoop plus half-load axial webbing, kg/m2
    restraint_cap = pressure * r / (2 * allowable) * 1400 * 2
    soft = 0.75 + 1.0                           # triple bladder; thermal, dust and abrasion cover
    seams = 1.2
    cyl_area, cap_area = 2 * math.pi * r * length, 4 * math.pi * r**2
    shell = seams * (cyl_area * (restraint_cyl + soft) + cap_area * (restraint_cap + soft))
    chord = lambda y: 2 * math.sqrt(r * r - y * y)
    lower, upper = chord(s['lower_floor_y_m']) * (length + 1.5), chord(s['upper_floor_y_m']) * (length + 1.5)
    floors = lower * 4.0 + upper * 8.0          # on-grade drop-stitch panel; spanning sandwich deck at 1.2 g
    interiors = 8 * 45 + 150 + 120 + 150        # eight couple cabins, commons, hygiene, lighting and ducts
    fixed = 300 + 100                           # hatch rings and core frame; ground sheet, straps and anchors
    module = shell + floors + interiors + fixed
    volume = math.pi * r * r * length + 4 / 3 * math.pi * r**3
    tunnel = 2 * math.pi * 1.1 * 6 * 3.5 + 60
    hardware = count * (module + tunnel)
    packed_volume = hardware / s['packed_density_kg_m3']
    return dict(
        count=count, radius_m=r, cylinder_length_m=length, overall_length_m=length + 2 * r,
        hoop_load_kN_m=pressure * r / 1e3, restraint_allowable_MPa=allowable / 1e6,
        restraint_kg_m2=dict(cylinder=restraint_cyl, end_caps=restraint_cap),
        shell_areal_mass_kg_m2=shell / (cyl_area + cap_area),
        per_module_kg=dict(shell=shell, floors=floors, interiors=interiors, hatches_frame_anchors=fixed, total=module),
        tunnel_kg_each=tunnel, hardware_kg=hardware,
        floor_area_m2_per_module=dict(lower=lower, upper=upper), gross_floor_area_m2=count * (lower + upper),
        pressure_volume_m3=count * volume, fill_gas_kg=count * volume * AIR_DENSITY,
        packed_volume_m3=packed_volume, packed_bales=s['bales'],
        bale_mass_kg=hardware / s['bales'],
        status='Closed pressure vessels, so no ground anchoring against pressure. No orbital debris layer: '
               'surface use only. Seam life, deployment at 1.2 g and local weather are unqualified.')


def interstellar_flow(peak_beta, cruise_years, burn_days, front_area, crew_distance, screen):
    """Gas and dust arriving at cruise speed, the secondary gamma dose and the screen that removes it."""
    gamma = 1 / math.sqrt(1 - peak_beta**2)
    proton_MeV = (gamma - 1) * 938.272
    flux = gamma * H_DENSITY_M3 * peak_beta * C                  # protons / m2 / s in the ship frame
    power_flux = flux * proton_MeV * MEV
    gamma_yield = GAMMA_YIELD_21MEV * ((proton_MeV - 5) / (21.49 - 5))**1.3
    proton_range = 5.4 * (proton_MeV / 21.49)**1.8            # kg/m2 in carbon
    photons = flux * front_area * gamma_yield
    disc_r = math.sqrt(front_area / math.pi)
    fluence_rate = photons / (4 * math.pi * disc_r**2) * math.log(1 + disc_r**2 / crew_distance**2)
    rate = fluence_rate * SV_PER_PHOTON_M2
    coast_s = cruise_years * YEAR
    # Burn phases: speed falls linearly in proper time; photon yield falls to zero at 5 MeV.
    steps, burn = 2000, 0.0
    for i in range(steps):
        s = (i + 0.5) / steps
        energy = proton_MeV * s * s
        burn += s * max(0.0, (energy - 5) / (proton_MeV - 5))**1.3 / steps
    burn_equivalent_s = burn * burn_days * 86400
    # Thin stripper films ionise the gas; a weak dipole field then steers the ions clear of the ship.
    momentum_GeV = gamma * peak_beta * 0.9315                   # per nucleon
    rigidity = 3.3356 * momentum_GeV * 2                         # T m for fully stripped A/Z = 2 ions
    throw = screen['deflection_clearance_m']
    angle = throw / screen['mast_length_m']
    film_areal = screen['film_thickness_m'] * 2200               # kg/m2 carbon
    film_yield = film_areal / proton_range * gamma_yield * 1.2
    source_distance = screen['mast_length_m'] + crew_distance
    point = lambda rate_photons, d: rate_photons / (4 * math.pi * d * d) * SV_PER_PHOTON_M2
    films = point(flux * front_area * film_yield * screen['films'], source_distance) * coast_s
    structure = point(flux * screen['exposed_structure_area_m2'] * gamma_yield, source_distance) * coast_s
    leak = screen['hole_fraction_per_film']**screen['films']
    leakage = rate * leak * coast_s
    dust_density = H_DENSITY_M3 * 1.6726e-27 * 1.4 / 100         # gas-to-dust mass ratio 100
    dust_column = dust_density * 4.2465 * LIGHT_YEAR
    dust_energy = dust_column * (gamma - 1) * C * C
    grain = lambda radius: 4 / 3 * math.pi * radius**3 * 3000 * (gamma - 1) * C * C
    ampere_turns = screen['field_T'] * screen['gap_m'] / (4e-7 * math.pi)
    return dict(
        speed_c=peak_beta, proton_kinetic_MeV=proton_MeV, hydrogen_density_cm3=H_DENSITY_M3 / 1e6,
        proton_flux_m2_s=flux, kinetic_power_W_m2=power_flux, frontal_area_m2=front_area,
        beam_current_mA=flux * front_area * 1.602e-19 * 1e3, beam_power_kW=power_flux * front_area / 1e3,
        proton_range_in_carbon_kg_m2=proton_range, thick_target_photons_per_proton=gamma_yield,
        unscreened=dict(photons_per_s=photons, dose_rate_mSv_h=rate * 3.6e6,
                        coast_dose_Sv=rate * coast_s, each_burn_dose_Sv=rate * burn_equivalent_s,
                        note='Solid front shield at the ship: every stopped proton is a thick-target gamma source. '
                             'A 50 kg/m2 plate attenuates 4.4 MeV photons by only about 15%.'),
        gamma_attenuation_alternative=dict(
            e_folds_to_100_mSv=math.log(rate * coast_s / 0.1),
            tungsten_kg_m2=math.log(rate * coast_s / 0.1) / W_MU_RHO_4MEV,
            mass_t=math.log(rate * coast_s / 0.1) / W_MU_RHO_4MEV * front_area / 1e3),
        screen=dict(
            mast_length_m=screen['mast_length_m'], films=screen['films'], film_areal_mass_g_m2=film_areal * 1e3,
            ion_rigidity_T_m=rigidity, deflection_angle_rad=angle, field_integral_T_m=rigidity * angle,
            field_T=screen['field_T'], field_length_m=rigidity * angle / screen['field_T'],
            coil_ampere_turns=ampere_turns,
            residual_coast_dose_mSv=dict(films=films * 1e3, exposed_structure=structure * 1e3,
                                         film_hole_leakage=leakage * 1e3,
                                         total=(films + structure + leakage) * 1e3),
            allocation_mSv=100),
        dust=dict(mass_density_kg_m3=dust_density, column_kg_m2=dust_column, energy_J_m2=dust_energy,
                  upper_bound_erosion_kg_m2=dust_energy / 5.9e7,
                  grain_energy_J={'0.1 micrometre': grain(1e-7), '1 micrometre': grain(1e-6),
                                  '100 micrometres': grain(1e-4)}),
        status='Thick-target yield is an order-of-magnitude estimate (factor of about two); neutrons, helium and '
               'heavier ions add to it. Film survival, hole statistics and charge-state fractions are assumptions.')


def engine(departure_kg, direct_consumed_kg, accel_g, exhaust):
    thrust = departure_kg * accel_g * G
    mdot = thrust / (exhaust * C)
    power = mdot * C * C
    pion_energy = (748 + 419) / 3                 # MeV total energy per charged pion
    pion_p = math.sqrt(pion_energy**2 - 139.57**2)
    ceiling = 3 * pion_p / 1876.5
    coil_fraction = 2 * math.pi * 4.0 * 0.3 / (4 * math.pi * 4.0**2)
    flux_limit = 2 * 0.9 * SIGMA * 2500**4        # two-sided black plate held at 2,500 K
    gamma_power = power * GAMMA_FRACTION
    return dict(
        initial_thrust_MN=thrust / 1e6, mass_annihilated_kg_s=mdot, annihilation_power_PW=power / 1e15,
        prompt_gamma_power_PW=gamma_power / 1e15, prompt_gamma_fraction=GAMMA_FRACTION,
        integrated_gamma_energy_J=direct_consumed_kg * C * C * GAMMA_FRACTION,
        charged_pion_momentum_MeV_c=pion_p, ideal_exhaust_ceiling_c=ceiling,
        momentum_efficiency_needed=exhaust / ceiling,
        pion_gyroradius_m_at_10T=pion_p / 1000 / (0.2998 * 10),
        pion_decay_length_m=pion_p / 139.57 * 7.8,
        assumed_absorbed_fraction=1e-7, assumed_absorbed_heat_GW=power * 1e-7 / 1e9,
        nozzle_coil_geometric_interception=coil_fraction,
        nozzle_coil_intercepted_gamma_GW=gamma_power * coil_fraction / 1e9,
        heat_closure_gap_factor=gamma_power * coil_fraction / (power * 1e-7),
        bare_structure_survival_distance_km=math.sqrt(gamma_power / (4 * math.pi * flux_limit)) / 1e3,
        acceleration_g_closing_if_0p1_percent_absorbed=0.1 * 0.9 * SIGMA * 1500**4 / 3 / (1e-3 * C / exhaust) / G,
        status='0.5c effective exhaust needs about 86% of the charged-pion momentum collimated and is at the '
               'ceiling of the beamed-core concept. Thermal closure at 1.2 g relies on the 1e-7 absorbed-fraction '
               'assumption, which no physical nozzle geometry here supports.')


def shadow_shield(gamma_energy_J, gamma_power_W, s):
    """Tungsten disc between the annihilation point and the ship; primary-only kerma proxy plus buildup."""
    fluence = gamma_energy_J / (4 * math.pi * s['source_to_nearest_crew_m']**2)
    kerma = fluence * WATER_MUEN_RHO_4MEV
    mu = W_MU_RHO_4MEV * TUNGSTEN_DENSITY
    primary = math.log(kerma / s['dose_allocation_Gy']) / mu
    buildup = math.log(s['buildup_factor']) / mu
    thickness = primary + buildup
    radius = s['source_radius_m'] + (s['protected_radius_m'] - s['source_radius_m']) * s['shield_distance_m'] / s['boom_length_m']
    mass = math.pi * radius**2 * thickness * TUNGSTEN_DENSITY
    solid = (1 - math.cos(math.atan(radius / s['shield_distance_m']))) / 2
    intercepted = gamma_power_W * solid
    radiated = 2 * math.pi * radius**2 * 0.35 * SIGMA * 3000**4
    return dict(
        unshielded_kerma_Gy=kerma, attenuation_needed=kerma / s['dose_allocation_Gy'],
        thickness_m=thickness, primary_only_thickness_m=primary, buildup_allowance_m=buildup,
        radius_m=radius, mass_kg=mass, areal_mass_t_m2=thickness * TUNGSTEN_DENSITY / 1e3,
        shield_distance_m=s['shield_distance_m'], boom_length_m=s['boom_length_m'],
        protected_radius_m=s['protected_radius_m'], source_radius_m=s['source_radius_m'],
        solid_angle_fraction=solid, intercepted_gamma_TW=intercepted / 1e12,
        radiative_capacity_MW_at_3000K=radiated / 1e6, heat_gap_factor=intercepted / radiated,
        unshielded_flux_at_tanks_GW_m2=gamma_power_W / (4 * math.pi * s['boom_length_m']**2) / 1e9,
        status='Sized for dose only. The disc intercepts terawatts and cannot be cooled at 1.2 g; neutrons, muons, '
               'scatter round the edge and the true source size are not modelled.')


def storage(antimatter_kg, hydrogen_kg, accel_g, s):
    """Tank volumes and the conditions solid antihydrogen would need."""
    radius = s['tank_radius_m']
    def capsule(volume):
        cyl = max(0.0, (volume - 4 / 3 * math.pi * radius**3) / (math.pi * radius**2))
        return dict(volume_m3=volume, radius_m=radius, cylinder_length_m=cyl, overall_length_m=cyl + 2 * radius,
                    surface_area_m2=2 * math.pi * radius * cyl + 4 * math.pi * radius**2)
    ice_volume = antimatter_kg / SOLID_H2_DENSITY
    # Logs sit on a 2.4 m hexagonal lattice in layers along the axis; count what actually fits.
    log_mass = math.pi * s['log_radius_m']**2 * s['log_length_m'] * SOLID_H2_DENSITY
    logs = antimatter_kg / log_mass
    layers = math.ceil(max(0.0, logs - 2 * s['logs_per_dome']) / s['logs_per_layer'])
    cyl = layers * s['layer_pitch_m']
    store = dict(volume_m3=math.pi * radius**2 * cyl + 4 / 3 * math.pi * radius**3, radius_m=radius,
                 cylinder_length_m=cyl, overall_length_m=cyl + 2 * radius, layers=layers,
                 surface_area_m2=2 * math.pi * radius * cyl + 4 * math.pi * radius**2)
    lh2 = capsule(hydrogen_kg / LH2_DENSITY / (1 - 0.03))
    # Hydrogen tank: aluminium-lithium shell at 150 kPa, MLI, then 20% for baffles, supports and lines.
    shell = (2 * math.pi * radius * lh2['cylinder_length_m'] * 150e3 * radius / 250e6
             + 4 * math.pi * radius**2 * 150e3 * radius / (2 * 250e6)) * 2700
    lh2_tank = 1.2 * (shell + 0.8 * lh2['surface_area_m2'])
    # Charged-particle storage is hopeless: Brillouin density limit of a 20 T Penning trap.
    brillouin = EPS0 * 20**2 / (2 * 1.6726e-27) * 1.6726e-27
    # Diamagnetic levitation of solid hydrogen against thrust.
    b_grad_b = 4e-7 * math.pi * accel_g * G / 2.5e-8
    # Electrostatic levitation of a charged log, treated as a sphere of equal radius.
    log_r, field = s['log_radius_m'], s['levitation_field_V_m']
    surface_field = SOLID_H2_DENSITY * log_r * accel_g * G / (3 * EPS0 * field)
    ice_area = logs * (2 * math.pi * log_r * s['log_length_m'] + 2 * math.pi * log_r**2)
    def sublimation(T):
        pressure = 4.7e-5 * math.exp(92.4 * (1 / 4.2 - 1 / T))      # Pa, extrapolated from 4.2 K
        flux = pressure / math.sqrt(2 * math.pi * 4124 * T)
        return dict(temperature_K=T, vapour_pressure_Pa=pressure, loss_kg_per_year=flux * ice_area * YEAR,
                    wall_annihilation_power_W=2 * flux * ice_area * C * C)
    leak = 2 * 0.002 * SIGMA * 30**4 * store['surface_area_m2']      # MLI from a 30 K shield, doubled for supports
    return dict(
        antimatter_kg=antimatter_kg, matching_hydrogen_kg=hydrogen_kg, ice_volume_m3=ice_volume,
        ice_fill_fraction=ice_volume / store['volume_m3'], antimatter_store=store, hydrogen_tank=lh2,
        hydrogen_tank_hardware_kg=lh2_tank, hydrogen_tank_fraction=lh2_tank / hydrogen_kg,
        charged_storage=dict(penning_density_limit_kg_m3_at_20T=brillouin,
                             volume_needed_m3=antimatter_kg / brillouin),
        diamagnetic_levitation=dict(B_gradB_T2_m=b_grad_b,
                                    field_T_across_one_metre=math.sqrt(2 * b_grad_b * 1.0),
                                    field_T_across_one_centimetre=math.sqrt(2 * b_grad_b * 0.01)),
        electrostatic_levitation=dict(log_radius_m=log_r, log_length_m=s['log_length_m'], log_mass_kg=log_mass,
                                      log_count=logs, applied_field_MV_m=field / 1e6,
                                      required_surface_field_MV_m=surface_field / 1e6,
                                      charge_per_mass_C_kg=accel_g * G / field),
        sublimation=[sublimation(T) for T in (1.5, 2.0, 2.5, 3.0, 4.2)],
        cold_stage=dict(heat_leak_W_at_1p5K=leak, cooler_input_kW=leak * (300 / 1.5 - 1) / 0.05 / 1e3),
        energy_content_Mt_TNT=2 * antimatter_kg * C * C / 4.184e15,
        status='Only neutral condensed antihydrogen reaches the required density. Charged levitation, charge '
               'retention on the ice, 1.5 K walls and failure containment are undemonstrated; the 38 t '
               'containment figure is an allocation.')


def cosmic_rays(years, shelter_mass_kg, shelter_area_m2):
    free_space = 1.84e-3 * 365.25               # Sv/year, MSL RAD cruise measurement behind light shielding
    return dict(
        free_space_dose_equivalent_Sv_year=free_space, mission_dose_Sv=free_space * years,
        career_limit_Sv=0.6, exceedance_factor=free_space * years / 0.6,
        stowed_goods_shelter=dict(mass_t=shelter_mass_kg / 1e3, wrapped_area_m2=shelter_area_m2,
                                  areal_density_g_cm2=shelter_mass_kg / shelter_area_m2 / 10),
        dedicated_shelter_option=dict(areal_density_g_cm2=20, mass_t=37.4,
                                      expected_reduction='roughly a quarter to a third; still far above the limit'),
        status='Outside the heliosphere the low-energy flux is higher than this measurement. No passive mass '
               'this ship can carry meets a 600 mSv career limit over 20 years; this is an open mission-level item.')


E_CFRP, RHO_CFRP, SIGMA_CFRP = 150e9, 1600, 300e6    # modulus, density, compression allowable with joints


def truss_sizing(peak_thrust, burn_thrust, layout):
    """Engine boom and thrust spine as square carbon-fibre trusses, sized for stress and Euler buckling."""
    study = layout['shadow_shield_study']
    length, half = study['boom_length_m'], 2.6
    stress_area = peak_thrust / SIGMA_CFRP
    # Four longerons at the corners: I = area x half-width squared; 0.8 allows for the taper toward the engine.
    euler_per_area = math.pi**2 * E_CFRP * 0.8 * half**2 / length**2
    buckling_area = 2.0 * peak_thrust / euler_per_area            # safety factor 2 on global buckling
    area = max(stress_area, buckling_area)
    spine_area = 0.6 * burn_thrust / SIGMA_CFRP * 2.0             # 60% of the ship rides ahead of the tanks; factor 2
    return dict(peak_thrust_MN=peak_thrust / 1e6, interstellar_burn_thrust_MN=burn_thrust / 1e6,
                boom_longeron_area_cm2_each=area / 4 * 1e4, boom_stress_MPa=peak_thrust / area / 1e6,
                boom_euler_safety_factor=euler_per_area * area / peak_thrust,
                governed_by='buckling' if buckling_area > stress_area else 'stress',
                boom_kg=1.3 * RHO_CFRP * area * length, spine_kg=max(1500.0, 1.3 * RHO_CFRP * spine_area * layout['spine_length_m']))


def structure(nominal, layout, discs, store, truss, catcher_kg):
    """Loads during the interstellar burns, and the highest acceleration each element takes with a safety factor of two."""
    a_g = layout['main_acceleration_g']
    a = a_g * G
    screen = layout['wind_screen_study']
    checks = []
    def check(element, limit_g, load, basis):
        checks.append(dict(element=element, limit_g_at_safety_factor_2=limit_g, margin_at_design=limit_g / a_g, load=load, basis=basis))
    # Screen mast: a cantilevered lattice column carrying the films and coils ahead of the bow.
    def mast(radius, longeron_kg_m, total_kg_m):
        inertia = 1.5 * (longeron_kg_m / RHO_CFRP) * radius**2
        critical = math.pi**2 * E_CFRP * inertia / (4 * screen['mast_length_m']**2)
        tip = screen['coil_and_cryostat_kg'] + screen['films_and_frames_kg'] + 0.3 * total_kg_m * screen['mast_length_m']
        return critical / (2 * tip) / G, tip
    light, _ = mast(0.7, 0.33, 1.5)
    limit, tip = mast(screen['mast_radius_m'], screen['mast_longeron_kg_m'], screen['mast_kg_m'])
    check('Wind-screen mast (reinforced)', limit, f'{tip * a / 1e3:.1f} kN tip-equivalent load',
          f"Euler cantilever, {screen['mast_length_m']} m; the first 0.7 m-radius, 1.5 kg/m mast would buckle above {light:.3f} g.")
    # Engine boom: sized in truss_sizing for the largest thrust of any phase.
    check('Engine boom', truss['boom_euler_safety_factor'] / 2 * nominal['peak_thrust_N'] / nominal['departure_mass_kg'] / G,
          f"{nominal['departure_thrust_N'] / 1e6:.2f} MN in the burns; {truss['peak_thrust_MN']:.2f} MN in descent braking",
          f"Sized by {truss['governed_by']} for descent thrust; the interstellar burn uses a fraction of it.")
    # Locked discs: four braces and the hub carry each disc's mass along the thrust line.
    disc_mass = (discs['membranes_kg'] + discs['floors_kg'] + discs['frames_kg'] + discs['fittings_kg'] + discs['atmosphere_kg'] + 9500 + 8000 + 14000) / 2
    brace_area = math.pi * (0.12**2 - 0.112**2)
    brace_limit = 4 * brace_area * SIGMA_CFRP * math.cos(math.radians(25)) / (2 * disc_mass) / G
    check('Disc burn braces', brace_limit, f'{disc_mass * a / 4 / math.cos(math.radians(25)) / 1e3:.0f} kN per brace',
          f'{disc_mass / 1e3:.1f} t per disc on four 240 mm carbon tubes; hub bearing not credited.')
    # Inflated envelope: inertial load of the wall and what hangs on it, against the pressure that stiffens it.
    wall = (discs['membranes_kg'] + discs['floors_kg'] + discs['frames_kg'] + discs['fittings_kg']) / discs['pressure_envelope_area_m2']
    check('Disc pressure envelope', 0.1 * 70_000 / wall / G, f'{wall * a:.0f} Pa inertial against 70,000 Pa pressure',
          f'{wall:.0f} kg/m2 smeared over the envelope; limit set where inertial load reaches 10% of cabin pressure.')
    # Bow catcher plate: accelerated normal to its own plane, carried by ribs cantilevered from the spine.
    span = screen['silhouette_width_m'] / 2
    moment = catcher_kg / 4 * span / 2                               # per rib, per unit acceleration
    rib_modulus = 2 * 6e-4 * 0.5                                    # two 6 cm2 caps half a metre apart
    check('Bow catcher plate ribs', rib_modulus * SIGMA_CFRP / (2 * moment) / G, f'{moment * a / 1e3:.1f} kN m root moment per rib',
          'Four ribs with 6 cm2 carbon caps 0.5 m apart.')
    # Antihydrogen logs: the surface field needed to hold a log against thrust.
    log_r, field = layout['storage_study']['log_radius_m'], layout['storage_study']['levitation_field_V_m']
    surface_per_g = SOLID_H2_DENSITY * log_r * G / (3 * EPS0 * field)
    check('Antihydrogen levitation', layout['storage_study']['surface_field_limit_V_m'] / 2 / surface_per_g * 2,
          f'{surface_per_g * a_g / 1e6:.1f} MV/m surface field', 'Assumed 10 MV/m charge-retention limit on the ice; an assumption, not a measurement. No safety factor applied.')
    # Hydrogen tank: hydrostatic head at the aft dome.
    head = LH2_DENSITY * store['hydrogen_tank']['overall_length_m']
    check('Hydrogen tank head', 0.2 * 150e3 / head / G, f'{head * a / 1e3:.1f} kPa head on a 150 kPa shell', 'Limit where head reaches 20% of design pressure.')
    governing = min(checks, key=lambda c: c['limit_g_at_safety_factor_2'])
    return dict(design_acceleration_g=a_g, previous_acceleration_g=1.2, checks=checks, governing_element=governing['element'],
                governing_limit_g=governing['limit_g_at_safety_factor_2'],
                status='Static screening of axial load paths only. Dynamics, thrust offset, slosh, joints and thermal distortion are not modelled.')


def solve(rows, cfg, layout, margin):
    """Close the mass ledger. rows carry stage: surface, handover (late release) or orbit (early release)."""
    exhaust, accel = cfg['effective_exhaust_fraction_c'], layout['main_acceleration_g']
    mission = trajectory(cfg['total_onboard_years'] - cfg['arrival_allowance_years'], acceleration_g=accel)
    factor = 1 + margin
    ve = cfg['thermal_Isp_s'] * G
    ratio = math.exp(cfg['thermal_delta_v_km_s'] * 1000 / ve)
    heater_am_per_h2 = ve**2 / (4 * cfg['thermal_heating_efficiency'] * C * C)
    h2_per_mass = (ratio - 1) / (1 + 2 * heater_am_per_h2)
    capture = cfg['pre_separation_capture_delta_v_km_s']
    interstellar = math.exp(2 * mission['rapidity'] / exhaust + capture * 1000 / (exhaust * C))
    arrival = math.exp((cfg['arrival_direct_delta_v_km_s'] - capture) * 1000 / (exhaust * C))
    reserve_fraction = -math.expm1(-cfg['correction_reserve_delta_v_km_s'] * 1000 / (exhaust * C))
    hot_flux = 0.9 * SIGMA * 1500**4
    def total(stage, hardware):
        return sum(r['mass_kg'] for r in rows if r['release_stage'] == stage and (r['kind'] == 'hardware') == hardware)
    land = (factor * total('surface', True) + total('surface', False)) / (1 - factor * 0.12 * h2_per_mass)
    h2 = land * h2_per_mass
    heater_am = h2 * heater_am_per_h2
    ignition = land + h2 + 2 * heater_am
    early = factor * total('orbit', True) + total('orbit', False)
    late_fixed = factor * total('handover', True) + total('handover', False)
    derived = dict(hotradiators=0.0, hydrogentanks=0.0, flightstructure=0.0, shadowshield=0.0)
    shield = store = None
    for _ in range(200):
        late = late_fixed + factor * sum(derived.values())
        after_capture = (arrival * (ignition + late) + early) / (1 - arrival * reserve_fraction)
        departure = after_capture * interstellar
        reserve = reserve_fraction * after_capture
        before_descent = after_capture - early
        before_release = ignition + late + reserve
        consumed = departure - after_capture + before_descent - before_release
        thrust = max(departure * accel, before_descent * cfg['landing_proper_acceleration_earth_g_study']) * G
        power = departure * accel * G * C / exhaust
        hot_area = thrust * C / exhaust * 1e-7 / hot_flux
        matter = (consumed + reserve) / 2
        store = storage(matter, matter, accel, layout['storage_study'])
        shield = shadow_shield(consumed * C * C * GAMMA_FRACTION, power * GAMMA_FRACTION, layout['shadow_shield_study'])
        truss = truss_sizing(thrust, departure * accel * G, layout)
        boom = truss['boom_kg'] + truss['spine_kg']
        new = dict(hotradiators=3.0 * hot_area, hydrogentanks=store['hydrogen_tank_hardware_kg'],
                   flightstructure=boom, shadowshield=shield['mass_kg'])
        change = max(abs(new[k] - derived[k]) for k in new)
        derived = new
        if change < 1e-6:
            break
    late_mass = late + reserve
    assert abs(departure - land - early - late_mass - h2 - 2 * heater_am - consumed) < 1e-3
    nominal = dict(
        departure_mass_kg=departure, final_retained_mass_kg=land, thermal_hydrogen_kg=h2,
        thermal_antimatter_kg=heater_am, mass_at_thermal_ignition_kg=ignition,
        early_release_mass_kg=early, late_engine_stage_release_mass_kg=late_mass,
        direct_propellant_consumed_kg=consumed, retained_correction_propellant_kg=reserve,
        propulsion_antimatter_loaded_kg=matter + heater_am, propulsion_matter_loaded_kg=matter + heater_am,
        engine_hot_radiator_kg=derived['hotradiators'], engine_hot_radiator_emitting_area_m2=hot_area,
        hydrogen_tank_kg=0.12 * h2, hardware_margin_fraction=margin,
        effective_exhaust_fraction_c=exhaust, main_acceleration_g=accel,
        phase_masses_kg=dict(departure=departure, after_acceleration=departure / math.exp(mission['rapidity'] / exhaust),
                             after_interstellar_braking=departure / math.exp(2 * mission['rapidity'] / exhaust),
                             after_capture=after_capture, after_early_release=before_descent,
                             before_engine_release=before_release, after_engine_release=ignition, after_touchdown=land))
    nominal['peak_thrust_N'] = thrust
    nominal['departure_thrust_N'] = departure * accel * G
    return nominal, derived, mission, shield, store, truss


def build_design():
    cfg = json.loads((ROOT / 'data/mission_config.json').read_text(encoding='utf-8'))
    layout = json.loads((ROOT / 'data/spacecraft_layout.json').read_text(encoding='utf-8'))
    hab = json.loads((ROOT / 'data/habitat_layout.json').read_text(encoding='utf-8'))
    margin = cfg['design_to_hardware_margin_fraction']
    target = {r['id']: r for r in build_target()['items']}
    discs, inflatables = habitat(layout, hab), surface_inflatables(layout)
    screen = layout['wind_screen_study']
    # Frontal silhouette: both discs edge-on. Everything aft must stay inside it and inside the shield's shadow.
    screen['silhouette_width_m'] = 2 * discs['envelope_radius_m'] + 1.0
    corner = math.hypot(screen['silhouette_width_m'] / 2, screen['silhouette_height_m'] / 2)
    layout['shadow_shield_study']['protected_radius_m'] = corner + 0.2
    screen['deflection_clearance_m'] = screen['silhouette_height_m'] + 1.5
    factory_volume = 2 * math.pi * layout['food_factory_modules_study']['radius_m']**2 * layout['food_factory_modules_study']['length_m']
    gas = discs['atmosphere_kg'] + factory_volume * AIR_DENSITY + inflatables['fill_gas_kg'] + 800
    catcher = screen['silhouette_width_m'] * screen['silhouette_height_m'] * screen['catcher_kg_m2']
    forward_screen = catcher + screen['mast_length_m'] * screen['mast_kg_m'] + screen['coil_and_cryostat_kg'] + screen['films_and_frames_kg']
    kept = 'Retained 300 t trade allocation (MISSION_300_TRADE.md); not a validated hardware mass.'
    derived_here = 'Calculated in ship_design.py from the drawn geometry.'
    def row(key, system, mass, stage, basis, kind='hardware'):
        return dict(id=key, system=system, mass_kg=mass, kind=kind, release_stage=stage,
                    surface_delivery=stage == 'surface', basis=basis,
                    status='Planning target; unvalidated hardware.')
    def keep(key, stage, system=None):
        item = target[key]
        return row(key, system or item['item'], item['target_kg'], stage, kept, item['kind'])
    rows = [
        row('membranes', 'Disc pressure membranes, insulation and restraint', discs['membranes_kg'], 'surface',
            f"{discs['pressure_envelope_area_m2']:.0f} m2 envelope x {ENVELOPE_KG_M2:g} kg/m2. {derived_here}"),
        row('floors', 'Folding composite floors', discs['floors_kg'], 'surface',
            f"{discs['gross_floor_area_m2']:.0f} m2 single deck x {FLOOR_KG_M2:g} kg/m2. {derived_here}"),
        row('habframes', 'Disc frames, bulkheads, hatches and berth partitions', discs['frames_kg'], 'surface',
            'Reference 24 t scaled by pressure-envelope area.'),
        row('bearings', 'Two hubs, bearings, spin motors and balance equipment', discs['bearings_kg'], 'orbit',
            'Reference 12 t halved: two rotors kept, each carrying well under half the former rotating mass. Allocation.'),
        row('furnishings', 'Berth bays, galley, commons, hygiene and exercise fittings', discs['fittings_kg'], 'surface',
            'Eight awake in transit; 32 two-tier berths. Allocation between the pod (2 t) and torus (6 t) studies.'),
        row('transfertunnels', 'Hub-to-hub transfer tube and flexible interfaces', discs['transfer_tube_kg'], 'surface',
            'One short axial tube replaces the pod tunnels and spin booms. Allocation.'),
        row('surfacekit', 'Two packed inflatable surface habitats with interiors and link tunnels',
            inflatables['hardware_kg'], 'surface',
            f"Hoop-load sized restraint, {inflatables['shell_areal_mass_kg_m2']:.2f} kg/m2 shell, floors, fittings and anchors. {derived_here}"),
        keep('structure', 'surface'), keep('landing', 'surface'),
        row('dustshield', 'Forward wind screen: stripper films, deflector coil, mast and catcher plate', forward_screen, 'orbit',
            f"{catcher:.0f} kg catcher at {screen['catcher_kg_m2']:g} kg/m2 plus mast, coil and films. Replaces the 31 t solid plate. {derived_here}"),
        row('aftscreen', 'Aft annular wind screen for the braking burn', screen['aft_screen_kg'], 'handover',
            'Stripper film ring and deflector coil at the aft tank end. Allocation.'),
        keep('engine', 'surface'), keep('containment', 'surface'), keep('refuge', 'surface'),
        keep('eclss', 'surface'), keep('medical', 'surface'), keep('power', 'surface'),
        keep('warmradiators', 'surface'), keep('avionics', 'surface'), keep('factory', 'surface'),
        keep('rover', 'surface'), keep('spares', 'surface'), keep('processtanks', 'surface'),
        keep('foodfactory', 'surface'), keep('separation', 'surface'),
        keep('cruiseengine', 'handover'), keep('bulkcontainment', 'handover'),
        keep('relaychain', 'orbit'), keep('spacescouts', 'orbit'), keep('exploration', 'surface'),
        row('gas', 'Disc, module and inflatable-habitat atmosphere plus reserve', gas, 'surface',
            f"{discs['pressure_volume_m3']:.0f} m3 discs, {inflatables['pressure_volume_m3']:.0f} m3 surface habitats and "
            f"modules at 70 kPa / 293 K, plus 0.8 t reserve. {derived_here}", 'consumable'),
        keep('water', 'surface'), keep('food', 'surface'), keep('consumables', 'surface'),
        keep('foodloop_inventory', 'surface'), keep('crew', 'surface'),
    ]
    nominal, derived, mission, shield, store, truss = solve(rows, cfg, layout, margin)
    rows += [
        row('shadowshield', 'Tungsten engine shadow shield', derived['shadowshield'], 'handover',
            f"{shield['thickness_m']*100:.0f} cm tungsten disc of {shield['radius_m']:.2f} m radius. Not in any earlier budget. {derived_here}"),
        row('flightstructure', 'Engine boom and thrust spine', derived['flightstructure'], 'handover',
            f"Carbon-fibre truss sized by {truss['governed_by']} for {truss['peak_thrust_MN']:.1f} MN descent thrust, safety factor 2, 30% for joints and bracing."),
        row('hydrogentanks', 'Liquid-hydrogen propellant tank', derived['hydrogentanks'], 'handover',
            f"{store['hydrogen_tank_fraction']*100:.1f}% of the hydrogen load: shell at 150 kPa, insulation and fittings. Not in any earlier budget."),
        row('hotradiators', 'Engine hot radiator fins', derived['hotradiators'], 'handover',
            '1,500 K, 3 kg per emitting m2, sized on the 1e-7 absorbed-fraction assumption.'),
        row('hydrogentank', 'Touchdown hydrogen tanks', nominal['hydrogen_tank_kg'], 'surface', '12% of touchdown hydrogen.'),
    ]
    hardware = lambda stage: sum(r['mass_kg'] for r in rows if r['kind'] == 'hardware' and r['release_stage'] == stage)
    for key, system, stage in [('margin', 'Surface hardware development allowance', 'surface'),
                               ('flightmargin', 'Released hardware development allowance', 'handover'),
                               ('earlymargin', 'Early-release hardware allowance', 'orbit')]:
        rows.append(dict(id=key, system=system, mass_kg=margin * hardware(stage), kind='derived', release_stage=stage,
                         surface_delivery=stage == 'surface', basis=f'{margin:.0%} of that stage\'s hardware.',
                         status='Budget reserve, not installed equipment.'))
    rows.append(dict(id='fuelreserve', system='Unused correction stock', mass_kg=nominal['retained_correction_propellant_kg'],
                     kind='derived', release_stage='handover', surface_delivery=False,
                     basis='100 km/s correction allowance left in the released store.', status='Conditional.'))
    stage_total = lambda stage: sum(r['mass_kg'] for r in rows if r['release_stage'] == stage)
    assert abs(stage_total('surface') - nominal['final_retained_mass_kg']) < 1e-3
    assert abs(stage_total('orbit') - nominal['early_release_mass_kg']) < 1e-3
    assert abs(stage_total('handover') - nominal['late_engine_stage_release_mass_kg']) < 1e-3
    dry = sum(r['mass_kg'] for r in rows if r['kind'] == 'hardware') * (1 + margin)
    supplies = sum(r['mass_kg'] for r in rows if r['kind'] in ('consumable', 'crew', 'payload'))
    front_area = screen['silhouette_width_m'] * screen['silhouette_height_m']
    flow = interstellar_flow(mission['peak_speed_c'], mission['cruise_onboard_years'], mission['each_burn_onboard_days'],
                             front_area, screen['catcher_to_crew_m'], screen)
    eng = engine(nominal['departure_mass_kg'], nominal['direct_propellant_consumed_kg'],
                 layout['main_acceleration_g'], cfg['effective_exhaust_fraction_c'])
    loads = structure(nominal, layout, discs, store, truss, catcher)
    shelter_mass = 5000 + 1000 + 4000                     # water, food reserve and half the consumables round the berths
    rays = cosmic_rays(cfg['total_onboard_years'], shelter_mass, 8 * 50)
    # Geometry handed to the viewer, so the drawn tanks, shield and fins are the calculated ones.
    x_tank = layout['tank_section_start_x_m']
    lh2, am = store['hydrogen_tank'], store['antimatter_store']
    x_store = x_tank + lh2['overall_length_m'] + 1.5
    x_boom = x_store + am['overall_length_m'] + 1.0
    study = layout['shadow_shield_study']
    x_source = x_boom + study['boom_length_m']
    service = build_target()['thermal']['loops']
    service_area = sum(l['emitting_area_m2'] for l in service if l['name'] != 'Engine')
    cone = lambda s: study['source_radius_m'] + (study['protected_radius_m'] - study['source_radius_m']) * s / study['boom_length_m']
    fin_start, fin_inner = 36.0, 2.9
    fin_available = sum((cone(s + 0.5) - 0.4 - fin_inner) for s in range(int(fin_start), int(study['boom_length_m'])) if cone(s + 0.5) - 0.4 > fin_inner)
    hot_needed = nominal['engine_hot_radiator_emitting_area_m2']
    view = 1 - (1 - math.sin(math.radians(60)))            # three fins at 120 degrees see each other
    fin_scale = min(1.0, hot_needed / (2 * 3 * fin_available * view))
    # Service fins run to the corners of the frontal silhouette: beside the crew modules, then beside the tanks.
    fin_sections = [dict(x0=discs['envelope_radius_m'] + 3.0, x1=39.5, inner_radius_m=4.2),
                    dict(x0=x_tank, x1=x_boom - 1.0, inner_radius_m=am['radius_m'] + 0.3)]
    geometry = dict(
        hydrogen_tank=dict(x0=x_tank, x1=x_tank + lh2['overall_length_m'], radius_m=lh2['radius_m']),
        antimatter_store=dict(x0=x_store, x1=x_store + am['overall_length_m'], radius_m=am['radius_m'],
                              log_radius_m=layout['storage_study']['log_radius_m'], log_length_m=layout['storage_study']['log_length_m']),
        boom=dict(x0=x_boom, x1=x_source - study['shield_distance_m']),
        shield=dict(x=x_source - study['shield_distance_m'], radius_m=shield['radius_m'], thickness_m=shield['thickness_m']),
        source_x=x_source, cone=dict(source_radius_m=study['source_radius_m'], protected_radius_m=study['protected_radius_m'],
                                     boom_length_m=study['boom_length_m']),
        hot_fins=dict(count=3, start_from_source_m=fin_start, inner_radius_m=fin_inner, width_scale=fin_scale,
                      planform_m2=3 * fin_available * fin_scale, required_emitting_m2=hot_needed,
                      effective_emitting_m2=2 * 3 * fin_available * fin_scale * view),
        service_fins=dict(count=4, half_angle_deg=math.degrees(math.atan2(screen['silhouette_height_m'], screen['silhouette_width_m'])), outer_radius_m=corner - 0.2, sections=fin_sections,
                          required_emitting_m2=service_area,
                          effective_emitting_m2=2 * 4 * 0.7 * sum((corner - 0.2 - f['inner_radius_m']) * (f['x1'] - f['x0']) for f in fin_sections)),
        screen=dict(x=-(discs['envelope_radius_m'] + 1.3) - screen['mast_length_m'], catcher_x=-(discs['envelope_radius_m'] + 1.3), mast_radius_m=screen['mast_radius_m'],
                    width_m=screen['silhouette_width_m'], height_m=screen['silhouette_height_m'], films=screen['films']),
        aft_screen_x=x_boom - 0.5, ship_length_m=x_source + 14 + discs['envelope_radius_m'] + 1.3,
        overall_length_with_mast_m=x_source + 14 + discs['envelope_radius_m'] + 1.3 + screen['mast_length_m'])
    return dict(
        name=f"Lightweight two-disc ship / two-deck discs at {layout['spin_gravity_g']:g} g / {layout['main_acceleration_g']:g} g burns",
        status='Selected viewer design. Screening calculations only: antimatter production, storage, the engine, '
               'torpor and radiation protection are not demonstrated, and three items do not close (see open_items).',
        nominal=nominal, components=rows, trajectory=mission,
        totals=dict(dry_hardware_with_allowance_kg=dry, supplies_people_payload_kg=supplies,
                    non_fuel_kg=dry + supplies, departure_kg=nominal['departure_mass_kg'],
                    landed_kg=nominal['final_retained_mass_kg'],
                    antimatter_kg=nominal['propulsion_antimatter_loaded_kg'],
                    reference_departure_kg=1_330_200, reference_landed_kg=376_301,
                    reference_antimatter_kg=382_320),
        habitat=discs, surface_inflatables=inflatables, engine=eng, shadow_shield=shield, storage=store,
        structure=loads, truss=truss,
        interstellar_flow=flow, cosmic_rays=rays, geometry=geometry,
        open_items=[
            f"Engine heat: the nozzle coil alone intercepts about {eng['nozzle_coil_intercepted_gamma_GW']/1e3:.0f} TW of gamma rays "
            f"against {eng['assumed_absorbed_heat_GW']:.2f} GW assumed absorbed, a gap of about {eng['heat_closure_gap_factor']:.0e}.",
            f"Shadow shield heat: {shield['intercepted_gamma_TW']:.1f} TW intercepted against {shield['radiative_capacity_MW_at_3000K']:.0f} MW radiated at 3,000 K.",
            f"Cosmic rays: about {rays['mission_dose_Sv']:.0f} Sv over 20 years against a 0.6 Sv career limit.",
            'Antimatter storage: no demonstrated way to make, charge, levitate or safely fail hundreds of tonnes of antihydrogen ice.'])


if __name__ == '__main__':
    result = build_design()
    (ROOT / 'reports/ship-design.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
    t = result['totals']
    print({k: round(v / 1e3, 1) for k, v in t.items()})
    for item in result['open_items']:
        print('-', item)
