"""S8: tandem edge-on habitats whose walls hold the braking fuel, with the forward shield resized and the ledger re-closed.

Each gravity disc's walls (rim and both faces) are built as fuel tanks around its pressure hull and turn with it. The
braking-fuel modules fill them as nested layers: the last-consumed module innermost, so each burn empties the walls from
the outside in. The braking burns happen with the discs locked, so the wall tanks feed the engine without rotary fluid
joints. Wall thickness sets the disc spacing, the corridor height and the frontal envelope, and so the forward shield,
whose mass feeds back into the ledger and so into the braking fuel; iterate to convergence. Acceleration fuel hangs in
modules of domed cylindrical tanks behind the habitats.
"""
import copy
import json
import math

from calculations.fleet_fuel_mix import ROOT
from calculations.final_model_specification import build

SHIELD_ROW = 'Forward shield face and supports'


def envelope(h):
    """Pressure hulls of the two edge-on discs (radius, axial depth) that the fuel walls wrap."""
    return dict(radius_m=h['disc_radius_m'], depth_m=h['disc_axial_depth_m'], discs=2, rim_gap_m=h['rim_gap_m'],
        corridor_height_m=h['transfer_corridor_height_above_disc_m'])


def wall_volume(e, t):
    """Wall volume of both discs when the walls extend t outward from the hulls over the rim and both faces."""
    r, d = e['radius_m'], e['depth_m']
    return e['discs']*math.pi*((r+t)**2*(d+2*t)-r*r*d)


def offset_for(e, volume):
    """Wall thickness t holding `volume` (bisection; volume is monotonic in t)."""
    lo, hi = 0., 50.
    for _ in range(100):
        mid = (lo+hi)/2
        lo, hi = (mid, hi) if wall_volume(e, mid) < volume else (lo, mid)
    return (lo+hi)/2


def species_volumes(fusion_t, st):
    d = fusion_t*st['deuterium_mass_fraction']
    return d/st['deuterium_liquid_density_t_m3'], (fusion_t-d)/st['helium3_liquid_density_t_m3']


def shell(e, braking, inputs):
    """Assign braking modules to the disc walls (last consumed innermost) up to the shielding target; return layers."""
    st, target = inputs['storage'], inputs['shielding']['target_areal_density_g_cm2']
    inner_area = e['discs']*(2*math.pi*e['radius_m']**2+2*math.pi*e['radius_m']*e['depth_m'])
    want = sum(s['fusion_t'] for s in braking) if target is None else target*10*inner_area/1000
    layers, mass, volume = [], 0., 0.
    for s in sorted(braking, key=lambda s: -s['index']):
        if mass >= want-1e-9:
            break
        vd, vh = species_volumes(s['fusion_t'], st)
        t0 = offset_for(e, volume); td = offset_for(e, volume+vd); t1 = offset_for(e, volume+vd+vh)
        layers.append(dict(index=s['index'], fusion_t=s['fusion_t'], antimatter_t=s['antimatter_t'],
            tank_and_separation_t=s['tank_and_separation_t'], deuterium_m3=vd, helium3_m3=vh,
            inner_offset_m=t0, deuterium_outer_offset_m=td, outer_offset_m=t1))
        mass += s['fusion_t']; volume += vd+vh
    thickness = layers[-1]['outer_offset_m'] if layers else 0.
    return dict(layers=layers, mass_t=mass, thickness_m=thickness, inner_area_m2=inner_area,
        mean_areal_density_g_cm2=mass*1000/inner_area/10, target_g_cm2=target,
        all_braking_fuel=len(layers) == len(braking))


def layout(e, thickness):
    """Disc centres (rim gap kept between the outer walls), the corridor riding above the top wall, and the extremes."""
    top = e['depth_m']/2+thickness+e['corridor_height_m']; bottom = -(e['depth_m']/2+thickness)
    return dict(disc_centres_x_m=[0., 2*(e['radius_m']+thickness)+e['rim_gap_m']], wall_thickness_m=thickness,
        top_m=top, bottom_m=bottom, z_centre_m=(top+bottom)/2, height_m=top-bottom,
        corridor_z_m=top-1.)  # centre of the 2 m corridor tube, whose top is the envelope top


def frontal(e, thickness, margin):
    g = layout(e, thickness)
    w = 2*(e['radius_m']+thickness)+2*margin
    h = g['height_m']+2*margin
    return dict(width_m=w, height_m=h, area_m2=w*h)


def tank_module(fusion_t, st, width, height=None, gap=.15, interstage=.9, between=.6):
    """One module's D and He-3 at liquid density in cylindrical tanks with hemispherical domes. A width x height frame is
    filled with a grid of equal tanks two rows high; height None is the cargo ship's round section, one tank per species.
    Tanks too small for a cylinder become spheres."""
    if height is None:
        ny = nz = 1; r0 = width/2-gap
    else:
        nz = 2; ny = max(1, int(width//(height/nz))); r0 = min(width/ny, height/nz)/2-gap
    out = dict(tanks_y=ny, tanks_z=nz)
    for name, v in zip(['deuterium', 'helium3'], species_volumes(fusion_t, st)):
        each = v/(ny*nz)
        if each <= 4/3*math.pi*r0**3:
            r = (3*each/(4*math.pi))**(1/3); cyl = 0.
        else:
            r = r0; cyl = (each-4/3*math.pi*r0**3)/(math.pi*r0*r0)
        out[name] = dict(radius_m=r, cylinder_m=cyl, length_m=cyl+2*r, volume_m3=v)
    out['length_m'] = out['deuterium']['length_m']+between+out['helium3']['length_m']+interstage
    return out


def pods(inputs, kind):
    """Pod offsets across the shield width and nozzle exit radius for a ship (the cargo engine is smaller)."""
    t = inputs['tow']
    return (t['cargo_pod_offsets_y_m'], t['cargo_nozzle_exit_radius_m']) if kind == 'cargo' else (t['pod_offsets_y_m'], t['nozzle_exit_radius_m'])


def cant_deg(inputs, half_size_m, kind='crew'):
    """Smallest outward nozzle cant whose plume edge clears the ship by the margin at the tow length, with the pods
    in a row across the shield's width (the innermost pod is the binding one); the plume edge starts at the nozzle rim:
    tan(cant) = tan(plume edge half-angle) + (half size + margin - inner pod offset + exit radius) / length."""
    t = inputs['tow']; ys, exit_r = pods(inputs, kind); inner = min(abs(y) for y in ys)
    return pod_cant_deg(t, half_size_m, inner, exit_r)


def pod_cant_deg(t, half_size_m, offset, exit_r):
    need = max(0., half_size_m+t['plume_clearance_margin_m']-abs(offset)+exit_r)/t['length_m']
    return max(t.get('min_cant_deg', 0.), math.degrees(math.atan(math.tan(math.radians(t['plume_edge_half_angle_deg']))+need)))


def pod_cants(inputs, half_size_m, kind):
    """Each pod is canted only as much as its own offset needs (outer pods less), keeping the beams as straight as the
    plume spread allows; the +/- pairs keep the side forces balanced. Thrust fraction is the mean cos over equal pods."""
    ys, exit_r = pods(inputs, kind)
    c = [pod_cant_deg(inputs['tow'], half_size_m, y, exit_r) for y in ys]
    return c, sum(math.cos(math.radians(x)) for x in c)/len(c)


def mixture_density(st):
    return 1/(st['deuterium_mass_fraction']/st['deuterium_liquid_density_t_m3']+(1-st['deuterium_mass_fraction'])/st['helium3_liquid_density_t_m3'])


SHADOW_ROW = 'Engine shadow shields and neutron-layer allowance'
# The engine's shadow shield must cover the ship as seen from the engine: for a fixed shield thickness its mass scales
# with frontal area / standoff^2. Anchored to S7: the 20 m circular shield (314.16 m2) behind a 2000 m standoff.
S7_SHADOW = dict(frontal_area_m2=math.pi*10**2, standoff_m=2000)
STRIP_ROW = 'Dust shield radiator strips'
STRIP_WIDTH_M = 1.2
POWER_ROW = 'Surface power and services'
TOW_ROWS = {'crew': ('crew_hardware', 'Remote engine tow assembly'), 'cargo': ('cargo_hardware', 'Remote propulsion support')}


def tow(ship, hanging, inputs, cant):
    """Tow tethers and tension straps at departure thrust (the axial pull; the pods' outward components cancel inside the
    engine). `hanging`: (loaded mass t, length m) of each tank module below the tow frame, top to bottom; each strap
    carries the thrust share of everything hanging beneath it."""
    t = inputs['tow']; p = ship['propulsion']; a = p['trajectory']['acceleration_m_s2']; thrust = p['departure_t']*1000*a
    per = t['safety_factor']*t['fibre_density_kg_m3']/(t['fibre_strength_GPa']*1e9)/1000  # tonnes per newton-metre
    straps, below = 0., sum(m for m, _ in hanging)
    for m, length in hanging:
        straps += per*a*1000*(below+(below-m))/2*length; below -= m
    tethers, cables = thrust*per*t['length_m'], thrust*per*t['habitat_cable_length_m']
    return dict(thrust_MN=thrust/1e6, tethers_t=tethers, habitat_cables_t=cables, stack_straps_t=straps,
        total_t=tethers+cables+straps, nozzle_cant_deg=cant, cant_thrust_fraction=math.cos(math.radians(cant)))


def feed(p, rho_t_m3, velocity):
    """Peak fuel flow to the engine (departure thrust / effective exhaust velocity in the acceleration burn) and the
    inner diameter of a feed line carrying it as liquid at `velocity`."""
    thrust = p['departure_t']*1000*p['trajectory']['acceleration_m_s2']
    kg_s = thrust/(p['effective_exhaust_c'][0]*299792458)
    m3_s = kg_s/(rho_t_m3*1000)
    return dict(peak_kg_s=kg_s, peak_liquid_m3_s=m3_s, line_inner_diameter_m=2*math.sqrt(m3_s/velocity/math.pi), line_velocity_m_s=velocity)


def surface_solar(inputs, greenhouse):
    """Solar field for the settlement: area to carry the load at Proxima's flux, plus batteries and switchyard."""
    s = inputs['surface_solar']
    flux = s['top_of_atmosphere_flux_W_m2']
    incidence = math.sin(math.radians(s['star_elevation_deg'])) if s.get('laid_flat') else 1.
    light_kWh = (greenhouse['initial_planted_area_m2_study'] * greenhouse['daily_light_integral_mol_m2_day_study']
        / (3.6 * greenhouse['fixture_photon_efficacy_umol_J_study'] * greenhouse['fixture_to_canopy_delivery_fraction_study']))
    continuous_kW = sum(s['continuous_load_kW'].values())
    average_kW = continuous_kW + light_kWh/24
    peak_kW = continuous_kW + light_kWh/greenhouse['photoperiod_hours_study']
    design_kW = peak_kW*(1+s['capacity_margin'])
    net_efficiency = s['surface_transmission']*s['cell_efficiency']*s['system_efficiency']
    area = design_kW*1000/(flux*incidence*net_efficiency)
    array_t = area*(s['array_kg_m2']+s['ground_structure_kg_m2'])/1000
    battery_t = s['storage_MWh']*1e6/s['battery_Wh_kg']/1000
    coolers_t = design_kW*s['heat_rejection_kg_per_kW']/1000
    return dict(flux_W_m2=flux, incidence=incidence, net_efficiency=net_efficiency, area_m2=area,
        continuous_load_kW=s['continuous_load_kW'], crop_lighting_kWh_day=light_kWh,
        average_kW=average_kW, peak_kW=peak_kW, design_kW=design_kW, storage_MWh=s['storage_MWh'],
        array_t=array_t, battery_t=battery_t, coolers_t=coolers_t, switchyard_t=s['switchyard_and_cable_t'],
        total_t=array_t+battery_t+coolers_t+s['switchyard_and_cable_t'])


def radiator_strips(p, base, outline):
    """The one dust shield also covers the engine's radiator fins, which are wider than the ship: a 0.5 m strip along
    each fin's leading edge beyond the shield outline. Fin width from the hot-radiator mass at 5 kg/m2 (after the
    allowance) over four fins whose length is set by the shadow-shield distance, as drawn. outline(angle) gives the
    shield's half-extent along each fin direction."""
    area = p['hot_radiator_with_allowance_t']/(1+base['hardware_allowance'])*1000/5
    s = (p['engine_with_allowance_t']/121.4)**(1/3)
    fin_len = base['source_shadow']['distance_from_source_m']-16*s-2
    reach = 1.2+area/(4*fin_len)
    length = sum(max(0., reach-outline(k)) for k in range(4))
    return dict(fin_reach_m=reach, strip_length_m=length, area_m2=length*STRIP_WIDTH_M)


def build_redesign(max_iterations=40, tolerance_t=.02, inputs=None):
    inputs = inputs or json.loads((ROOT/'data/tandem_redesign.json').read_text())
    base = json.loads((ROOT/inputs['base_specification']).read_text())
    base['propulsion_selection']['crew_antimatter_t'] = inputs['crew_antimatter_t']
    # Surface power is a solar field carried on the cargo ship (replacing the antimatter plant allocation).
    greenhouse = json.loads((ROOT/'data/settlement_systems.json').read_text())['greenhouse']
    solar = surface_solar(inputs, greenhouse)
    next(r for r in base['cargo_hardware'] if r[0] == POWER_ROW)[1] = solar['total_t']
    # The crew ship's cupola and EVA kit. (One dust shield serves the whole ship: it moves to whichever end leads.)
    base['crew_hardware'].extend([list(r) for r in inputs['added_crew_hardware']])
    e, fs, st = envelope(inputs['habitat']), inputs['forward_shield'], inputs['storage']
    rho = mixture_density(st)
    spec, history = copy.deepcopy(base), []
    shield_row = next(r for r in spec['crew_hardware'] if r[0] == SHIELD_ROW)
    tow_rows = {k: next(r for r in spec[table] if r[0] == name) for k, (table, name) in TOW_ROWS.items()}
    shadow_row = next(r for r in spec['crew_hardware'] if r[0] == SHADOW_ROW); shadow_s7 = shadow_row[1]
    cargo_shield_t = next(r[1] for r in base['cargo_hardware'] if r[0] == 'Forward shield and support')
    cargo_radius = math.sqrt(cargo_shield_t*.9*1000/base['geometry']['forward_shield_areal_mass_kg_m2']/math.pi)
    loaded = lambda s: s['fusion_t']+2*s['antimatter_t']+s['tank_and_separation_t']
    strip_rows = {}
    for k, (table, _) in TOW_ROWS.items():
        strip_rows[k] = [STRIP_ROW, 0., False]; spec[table].append(strip_rows[k])
    order = lambda segs: sorted(segs, key=lambda s: (-s['phase'], -s['index']))
    cants = {'crew': cant_deg(inputs, 0.), 'cargo': cant_deg(inputs, cargo_radius, 'cargo')}
    for _ in range(max_iterations):
        halves = {'crew': math.hypot(*(lambda f: (f['width_m']-2*fs['margin_beyond_envelope_m'], f['height_m']-2*fs['margin_beyond_envelope_m']))(history[-1]['front'])) /2 if history else 0., 'cargo': cargo_radius}
        report = build(spec, thrust_fraction={k: pod_cants(inputs, halves[k], k)[1] for k in cants})
        crew = report['ships']['crew']['propulsion']
        sh = shell(e, [s for s in crew['segments'] if s['phase'] == 1], inputs)
        front = frontal(e, sh['thickness_m'], fs['margin_beyond_envelope_m'])
        nominal = front['area_m2']*fs['areal_mass_kg_m2']/1000+fs['supports_nominal_t']
        # Hanging stacks below the tow frame. Crew: the acceleration modules hang between the tow frame and the habitats
        # (first dropped at the top), so the crew hangs at the bottom and every strap also carries the habitats, walls
        # and landing bay below it. Cargo: braking then acceleration modules below the payload, last-dropped nearest it.
        frame_w, frame_h = front['width_m']-2*fs['margin_beyond_envelope_m'], front['height_m']-2*fs['margin_beyond_envelope_m']
        in_shell = {l['index'] for l in sh['layers']}
        crew_mods = sorted([s for s in crew['segments'] if s['phase'] == 0 or s['index'] not in in_shell], key=lambda s: (s['phase'], s['index']))
        crew_below = crew['retained_core_t']+sum(loaded(s) for s in crew['segments'] if s['phase'] == 1 and s['index'] in in_shell)
        cargo_mods = order(report['ships']['cargo']['propulsion']['segments'])
        modules = {'crew': [(s, tank_module(s['fusion_t'], st, frame_w, frame_h)) for s in crew_mods],
                   'cargo': [(s, tank_module(s['fusion_t'], st, 2*(cargo_radius-.1))) for s in cargo_mods]}
        new_cants = {'crew': cant_deg(inputs, math.hypot(frame_w, frame_h)/2), 'cargo': cant_deg(inputs, cargo_radius, 'cargo')}
        # The engine must fit the dust shield's outline (the crew frontal rectangle; the cargo shield is widened to it).
        pod_span = {k: max(abs(y) for y in pods(inputs, k)[0])+pods(inputs, k)[1] for k in TOW_ROWS}
        hanging = {k: [(loaded(s), m['length_m']) for s, m in modules[k]]+([(crew_below, 0.)] if k == 'crew' else []) for k in TOW_ROWS}
        tows = {k: tow(report['ships'][k], hanging[k], inputs, cants[k]) for k in TOW_ROWS}
        for k, half in [('crew', math.hypot(frame_w, frame_h)/2), ('cargo', cargo_radius)]:
            tows[k]['pod_cants_deg'], tows[k]['cant_thrust_fraction'] = pod_cants(inputs, half, k)
        strips = {'crew': radiator_strips(crew, base, lambda k: (frame_w if k % 2 == 0 else frame_h)/2),
                  'cargo': radiator_strips(report['ships']['cargo']['propulsion'], base, lambda k: cargo_radius)}
        strip_t = {k: v['area_m2']*fs['areal_mass_kg_m2']/1000 for k, v in strips.items()}
        # Engine radiation shadow shields are removed from the design and the ledger at the owner's direction (open item:
        # the engine's radiation toward the tethers and ship is unshielded and unsized).
        shadow = 0.
        history.append(dict(shield_nominal_t=shield_row[1], crew_tow_nominal_t=tow_rows['crew'][1], cargo_tow_nominal_t=tow_rows['cargo'][1],
            departure_t=crew['departure_t'], wall_thickness_m=sh['thickness_m'], crew_cant_deg=cants['crew'], front=front))
        if (abs(nominal-shield_row[1]) < tolerance_t and abs(shadow-shadow_row[1]) < tolerance_t and
                all(abs(tows[k]['total_t']-tow_rows[k][1]) < tolerance_t and abs(new_cants[k]-cants[k]) < 1e-3 and abs(strip_t[k]-strip_rows[k][1]) < tolerance_t for k in tows)):
            break
        shield_row[1] = nominal; shadow_row[1] = shadow; cants = new_cants
        for k in strip_rows:
            strip_rows[k][1] = strip_t[k]
        for k in tows:
            tow_rows[k][1] = tows[k]['total_t']
    else:
        raise RuntimeError('Shield, tow and cant sizing did not converge')
    def stack(mods):
        return [dict(phase=s['phase'], index=s['index'], fusion_t=s['fusion_t'], antimatter_t=s['antimatter_t'],
            volume_m3=s['fusion_t']/rho, tanks=m, length_m=m['length_m'],
            antimatter_volume_m3=s['antimatter_t']/st['antihydrogen_solid_density_t_m3']) for s, m in mods]
    s7 = json.loads((ROOT/'reports/final-model-specification.json').read_text())['ships']
    allowance = base['hardware_allowance']
    return dict(revision=inputs['revision'], inputs=inputs, ships=report['ships'], fleet=report['fleet'],
        envelope=e, shell=sh, layout=layout(e, sh['thickness_m']), frontal=front,
        frame=dict(width_m=frame_w, height_m=frame_h), engine_half_span_m=pod_span,
        forward_shield=dict(face_area_m2=front['area_m2'], nominal_t=shield_row[1], with_allowance_t=shield_row[1]*(1+allowance)),
        engine_shadow_shield=dict(nominal_t=shadow_row[1], with_allowance_t=shadow_row[1]*(1+allowance), removed=True, status='Removed from design and ledger; engine radiation toward tethers and ship unshielded (open)', standoff_m=inputs['tow']['length_m']),
        tow={k: dict(v, nominal_t=tow_rows[k][1], with_allowance_t=tow_rows[k][1]*(1+allowance), ledger_row=TOW_ROWS[k][1]) for k, v in tows.items()},
        mixture_density_t_m3=rho,
        crew_stack=stack(modules['crew']),
        crew_braking_antimatter=[dict(index=s['index'], antimatter_t=s['antimatter_t'], volume_m3=s['antimatter_t']/st['antihydrogen_solid_density_t_m3']) for s in crew['segments'] if s['phase'] == 1],
        cargo_stack=stack(modules['cargo']),
        cargo_envelope_radius_m=cargo_radius,
        iterations=history,
        change_from_S7=dict(crew_departure_t=float(crew['departure_t']-s7['crew']['propulsion']['departure_t']),
            crew_fusion_t=float(crew['fusion_t']-s7['crew']['propulsion']['fusion_t']),
            cargo_departure_t=float(report['ships']['cargo']['propulsion']['departure_t']-s7['cargo']['propulsion']['departure_t']),
            shield_nominal_t=float(shield_row[1]-next(r[1] for r in base['crew_hardware'] if r[0] == SHIELD_ROW)),
            crew_tow_nominal_t=float(tow_rows['crew'][1]-next(r[1] for r in base['crew_hardware'] if r[0] == TOW_ROWS['crew'][1]))),
        concept_only=True, radiation_verified=False, tow_statically_sized=True, tow_dynamics_sized=False,
        added_crew_hardware=inputs['added_crew_hardware'],
        radiator_strips={k: dict(v, nominal_t=strip_rows[k][1], width_m=STRIP_WIDTH_M) for k, v in strips.items()},
        surface_solar=solar,
        fuel_feed={k: feed(report['ships'][k]['propulsion'], rho, inputs['fuel_feed']['line_velocity_m_s']) for k in TOW_ROWS},
        cant_loss_charged=True, capture_fuel_included=False)


if __name__ == '__main__':
    r = build_redesign()
    (ROOT/'reports/tandem-redesign.json').write_text(json.dumps(r, indent=2)+'\n')
    c = r['ships']['crew']['propulsion']
    print('iterations', len(r['iterations']), 'walls', round(r['shell']['thickness_m'], 3), 'm,', round(r['shell']['mean_areal_density_g_cm2'], 1), 'g/cm2,',
          'all braking fuel' if r['shell']['all_braking_fuel'] else f"{len(r['shell']['layers'])} modules")
    print('frontal', {k: round(v, 2) for k, v in r['frontal'].items()}, 'shield nominal', round(r['forward_shield']['nominal_t'], 2))
    print('crew departure', round(c['departure_t'], 1), 'fusion', round(c['fusion_t'], 1), 'change', {k: round(v, 2) for k, v in r['change_from_S7'].items()})
    print('tow', {k: {kk: round(vv, 3) for kk, vv in v.items() if isinstance(vv, float)} for k, v in r['tow'].items()})
    print('disc centres', [round(x, 2) for x in r['layout']['disc_centres_x_m']])
    print('crew acceleration stack', round(sum(m['length_m'] for m in r['crew_stack']), 1), 'm; cargo stack', round(sum(m['length_m'] for m in r['cargo_stack']), 1), 'm')
