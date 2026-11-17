"""Diagnostic arrival/radiation screens, not a new qualified mission budget."""
import json
import math

from calculations.family_fleet_trade import ROOT, SCENARIOS, exhaust
from calculations.integrated_shield_trade import OPTIONS, optimise_integrated
from calculations.mission_calculations import C, G


def terminal_propellant(landed_without_tanks_t, delta_v, isp=1800):
    factor = 1.1*math.expm1(delta_v/(isp*G))
    propellant = factor*landed_without_tanks_t/(1-.08*factor)
    return dict(delta_v_m_s=delta_v,isp_s=isp,propellant_t=propellant,tanks_t=.08*propellant)


def atmosphere_screen(mass_t, diameter, gravity=11.67, pressure=600, temperature=210):
    # Mars-like pressure/composition/temperature at a separately assumed higher
    # planet gravity. Not the actual measured atmosphere or mass of Proxima b.
    area = math.pi*(diameter/2)**2
    density = pressure/(188.9*temperature)
    ballistic = mass_t*1000/(1.5*area)
    return dict(diameter_m=diameter,area_m2=area,ballistic_coefficient_kg_m2=ballistic,
                surface_density_kg_m3=density,atmospheric_vertical_column_kg_m2=pressure/gravity,
                local_terminal_speed_m_s=math.sqrt(2*ballistic*gravity/density),
                weight_MN=mass_t*1000*gravity/1e6)


def build_audit():
    crew = optimise_integrated(40,SCENARIOS['reference'],OPTIONS['compact_20_hydrogen'])
    base = crew['base']
    land_without_tanks = base['landed_without_unused_reserves_t']-base['landing_tanks_t']
    landing = [terminal_propellant(land_without_tanks,dv) for dv in [6000,2000,1000,500,200]]
    chemical = [terminal_propellant(land_without_tanks,dv,450) for dv in [1000,500]]
    ex = exhaust(crew['exhaust_c'],.5)
    main = []
    for dv in [6000,12000]:
        # At low encounter velocities use rapidity at dv/c; assumes final rest
        # and ignores gravity losses, trajectory orientation and staging.
        ratio = math.exp(math.atanh(dv/C)/ex['effective'])
        loss_kg = 1e6*(ratio-1)  # 1000 t final mass
        main.append(dict(delta_v_m_s=dv,final_mass_t=1000,
                         antimatter_kg=.5*ex['annihilated_fraction']*loss_kg,
                         ordinary_reaction_kg=ex['reaction_fraction']*loss_kg))
    beta = crew['beta']
    gamma = 1/math.sqrt(1-beta*beta)
    proton_energy = (gamma-1)*938.272088
    kinetic_flux = 2e5*beta*C*proton_energy*1e6*1.602176634e-19
    pressure_shell = [{'allowable_MPa':s,'ideal_spherical_restraint_t':
                      1.5*1500*100000*2400/(s*1e6)/1000} for s in [100,250,500]]
    return dict(status='Screens only: no trajectory, dose or qualified hardware mass closure',
                landed_without_tanks_t=land_without_tanks,terminal_thermal=landing,
                terminal_chemical=chemical,main_engine_low_speed_burns=main,
                atmosphere=[atmosphere_screen(350,d) for d in [17.5,30,50]],
                crew_peak_thrust_MN=crew['peak_thrust_MN'],
                pressure_shell_bounds=pressure_shell,
                forward_gas=dict(speed_c=beta,proton_energy_MeV=proton_energy,
                                 hydrogen_kinetic_flux_W_m2=kinetic_flux,assumed_density_cm3=.2),
                lifetime_reference=[dict(years=y,average_mSv_day=.6*1000/(365.25*y)) for y in [20,30,40]],
                thermal_only_shadow_distance_m=(17.5/2)*math.sqrt(.38/(4*1e-5)),
                dry_t=crew['dry_t'],dry_components=dict(
                    fixed_hardware_t=base['fixed_dry_t'],landing_tanks_t=base['landing_tanks_t'],
                    scalable_main_engine_t=1.25*crew['engine_t'],
                    scalable_main_tanks_t=1.25*crew['tank_t'],
                    scalable_containment_t=1.25*crew['containment_t'],
                    main_hot_radiators_t=1.25*crew['hot_radiator_t']))


if __name__ == '__main__':
    result = build_audit()
    (ROOT/'reports'/'arrival-radiation-audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,indent=2))
