"""Published-rate exposure screens and current shielding inventory audit.

No interstellar particle transport or age-specific dosimetry is implemented.
NASA adult-reference solar-minimum rates are proxies, not ship predictions.
"""
import json
import math

from calculations.family_fleet_trade import ROOT
from calculations.redesign_spec import load_spec, build_spec_result

# NASA/TM-20220002905, Table 8.4-1, printed p.142/PDF index145.
# NASA effective dose: adult female reference phantom, BON2020 2009 environment.
# Polyethylene columns are not automatically equivalent to our water layers.
NASA_REFERENCE_MSV_DAY = {0:1.52,20:1.04,40:1.03}
SOURCE = 'https://ntrs.nasa.gov/api/citations/20220002905/downloads/NESC-RP-20-01589_NASA-TM-20220002905final.pdf'


def exposure_sv(years_awake,years_sheltered,awake_rate,sheltered_rate):
    return 365.25*(years_awake*awake_rate+years_sheltered*sheltered_rate)/1000


def cube_water_shell(inner_side_m,thickness_m,count=2):
    # Water density 1 t/m3; includes corner/edge volume, unlike area*t shortcut.
    return count*((inner_side_m+2*thickness_m)**3-inner_side_m**3)


def disc_sky_fraction(radius,distance):
    return .5*(1-distance/math.sqrt(distance*distance+radius*radius))


def cylinder_shell_water_mass(radius,length,thickness):
    return math.pi*((radius+thickness)**2*(length+2*thickness)-radius*radius*length)


def build_exposure():
    spec = load_spec()
    design = build_spec_result(spec)
    crew = design['cases']['reference']['crew']
    years = crew['proper_years']+spec['fleet']['arrival_operations_allowance_years']
    # Midpoint of approximate birth window; schedule is occupancy assumption.
    family_start = sum(spec['fleet']['birth_window_crew_years'])/2
    early = min(years,family_start)
    family = max(0.,years-family_start)
    awake_years = .25*early+.5*family
    torpor_years = years-awake_years
    awake_rate = NASA_REFERENCE_MSV_DAY[0]
    scenarios = {}
    for column in [20,40]:
        rate = NASA_REFERENCE_MSV_DAY[column]
        dose = exposure_sv(awake_years,torpor_years,awake_rate,rate)
        scenarios[str(column)] = dict(adult_reference_sv=dose,
            adult_average_mSv_day=dose*1000/(years*365.25),
            reduction_against_no_shield_reference=1-dose/exposure_sv(years,0,awake_rate,0),
            child_20_years_unshielded_adult_reference_sv=exposure_sv(20,0,awake_rate,0),
            child_midpoint_birth_adult_reference_sv=exposure_sv(family,0,awake_rate,0),
            child_midpoint_with_8h_sheltered_sleep_adult_reference_sv=exposure_sv(family*2/3,family/3,awake_rate,rate),
            all_time_same_column_adult_reference_sv=exposure_sv(0,years,0,rate))
    no_shield = exposure_sv(years,0,awake_rate,0)
    perfect_torpor = exposure_sv(awake_years,torpor_years,awake_rate,0)
    r = spec['crew_geometry'][0]['radius_m']
    area = design['geometry']['total_envelope_area_m2']
    reserve = crew['reaction_loaded_t']/21
    reaction_fraction = (crew['reaction_loaded_t']/1.05)/((crew['mass_ratio']-1)*crew['arrival_before_staging_t'])
    coast_reaction = reserve+reaction_fraction*crew['arrival_before_staging_t']*(math.sqrt(crew['mass_ratio'])-1)
    outer_shell = lambda t: 3*4*math.pi/3*((r+t)**3-r**3)
    lo,hi = 0.,1.
    for _ in range(60):
        t = (lo+hi)/2
        if cylinder_shell_water_mass(3.2,7.5,t) < 44:
            lo = t
        else:
            hi = t
    refuge_thickness = (lo+hi)/2
    return dict(status='Screening calculations only; actual interstellar and child doses are undetermined',
        actual_ship_GCR_dose_sv=None,validated_GCR_reduction_fraction=None,
        source=dict(url=SOURCE,table='8.4-1',pdf_page_index=145,rates_mSv_day=NASA_REFERENCE_MSV_DAY,
                    environment='2009 solar-minimum heliospheric reference, NOT local interstellar spectrum',
                    dose_quantity='NASA adult-reference effective dose, NOT child organ dose'),
        occupancy=dict(adult_proper_exposure_years=years,awake_years=awake_years,
                       torpor_years=torpor_years,adult_awake_fraction=awake_years/years,
                       child_midpoint_exposure_years=family),
        scenarios=scenarios,
        limits=dict(no_shield_reference_adult_sv=no_shield,
                    perfect_torpor_bay_adult_sv=perfect_torpor,
                    fixed_25_percent_awake_perfect_torpor_sv=exposure_sv(.25*years,.75*years,awake_rate,0),
                    target_adult_flight_sv=.4,gcr_and_service_allocation_sv=.3,
                    target_gcr_average_mSv_day=300/(years*365.25),
                    required_reduction_from_no_shield_reference_for_300mSv=1-.3/no_shield,
                    maximum_awake_fraction_with_perfect_bay_for_300mSv=.3/no_shield),
        shielding=dict(refuge_water_t=44,refuge_area_m2=design['geometry']['refuge_area_m2'],
            refuge_thin_layer_mass_per_inner_area_g_cm2=design['geometry']['refuge_column_kg_m2']/10,
            refuge_exact_uniform_water_thickness_cm=100*refuge_thickness,
            refuge_exact_uniform_water_column_g_cm2=100*refuge_thickness,
            refuge_water_needed_for_exact_20cm_t=cylinder_shell_water_mass(3.2,7.5,.2),
            refuge_is_not_where_all_normal_torpor_occurs=True,
            envelope_area_m2=area,
            thin_nominal_12t_outer_layers_average_g_cm2=12000/area/10,
            forward_disc_sky_fractions={str(z):disc_sky_fraction(7,35+z) for z in [-16,0,16]},
            main_reaction_departure_t=crew['reaction_loaded_t'],main_reaction_coast_t=coast_reaction,
            main_reaction_after_nominal_braking_t=reserve,
            full_envelope_20cm_water_mass_t=outer_shell(.2),
            full_envelope_25cm_water_mass_t=outer_shell(.25),
            main_reserve_thin_layer_average_g_cm2=reserve*100/area,
            active_GCR_hardware_allowance_t=30,active_GCR_dose_reduction_credit=None),
        torpor_bay_screen=dict(bays=2,berths_per_bay=16,inner_side_m=4,inner_volume_total_m3=128,
            water_shells=[dict(thickness_cm=100*t,water_t=cube_water_shell(4,t)) for t in [.2,.4,1]],
            full_envelope_to_two_bay_water_ratio_at_20cm=outer_shell(.2)/cube_water_shell(4,.2),
            extra_for_40cm_after_reallocating_existing_44t=max(0,cube_water_shell(4,.4)-44),
            geometry_and_access_not_validated=True,
            cannot_also_credit_same_44t_to_central_refuge=True),
        interstellar_sensitivity=dict(note='Multipliers are arbitrary stress tests, not measured estimates or confidence bounds',
            scaled_20g_bay_adult_sv={str(f):f*scenarios['20']['adult_reference_sv'] for f in [1,1.5,2]}))


if __name__ == '__main__':
    result = build_exposure()
    (ROOT/'reports'/'cosmic-ray-exposure.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))
