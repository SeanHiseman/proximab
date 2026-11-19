# S8 ship models and mission map

Views: **Crew ship**, **Cargo ship**, **Mission map**, **Descent**, **Proxima system** and **Surface**. The ship sliders stop on arrival in the parking orbit; **Descent** shows the three landers on their heat shields. The journey slider (with Play) covers the
selected ship's own journey (the map: the whole mission) on the stretched scale from `missionScale()` in
`dist/model.js`: burns and arrival get room, the coast is compressed, and the last month before arrival is logarithmic
in time-to-go down to the final hour. Milestone marks jump to departure, cruise, the engine re-rig, braking, Proxima b
reaching 1 degree, orbit arrival and the descents. Trajectories come from `missionTimeline()` using
`reports/tandem-redesign.json` (S8); each burn has eight equal-rapidity stages. The 3D ship scene is keyed on phase,
stages dropped and the engine's side; while the next stage builds, the current scene stays on screen and neighbouring
stages are prefetched. Play moves evenly along the slider, so it slows through burns and the approach.
- Sky (`flightSky()`): rebuilt for the exact year and drawn every frame outside the cached ship scene. Bright stars at
  catalogue directions and approximate Hipparcos distances (parallax over the route), the Sun receding astern,
  Alpha Centauri A and B and Proxima brightening ahead, with relativistic aberration and Doppler brightening. Near
  arrival Proxima shows its true disc and a shaded mock-up of Proxima b (assumed 7,000 km radius, 400 km parking orbit,
  tidally locked day side; not a surface map) grows to fill the view.

- Habitats: two edge-on discs in tandem along the flight axis (x), parallel counterrotating spin axes (z), hubs
  joined by a U-shaped transfer corridor; food trains and working water sit in the despun gap between them.
- Burns: the discs lock and each room's floors re-set so 'down' is aft (the earlier in-plane burn interior). For
  braking the discs lock half a turn round and 'down' faces forward.
- Fuel walls: the braking fuel is built into each disc's rim and faces as 8 nested tank layers that turn with the
  disc (last-consumed innermost; emptied outer layers are released). Radial bulkheads act as slosh baffles while
  spinning. The walls set the disc spacing and corridor height and cover the portholes. Braking antimatter sits in an
  isolated containment bay aft of the habitats.
- Engine: towed on 2000 m tethers, ahead through acceleration and the first half of the coast, re-rigged behind
  for braking. Four complete pod engines in a row across the shield width, canted by the sized angle; each pod
  carries no radiation shadow shields for now (removed pending a redesign); tethers start at a bridle with a
  refractory link to the engine. One forward dust shield always leads (in front of the engine, then in front of the ship). Hot radiator
  fins with heat pipes, manifolds and leading-edge guards glow while burning. Plumes fade out over 40 km.
- Fuel feed: acceleration tanks hang above the habitats; a trunk line runs up the straps and along the tether to a
  buffer tank at the engine (sized for peak flow in the report).
- Crew extras: windows along the transfer tube, EVA handrails, tether points and a small robotic arm.
- Surface: habitats 23 m apart with a short link, a direct doorway from habitat A into the nearest greenhouse, a shared greenhouse aisle, and cargo modules on short tunnels; power yard beside habitat B.
- Surface power draws about **903 kW on average** and **1,180 kW with crop lights on**. The model allocates 350 kW to continuous habitat and farm services, processing, workshop equipment, utilities and controls. The eight halls have 2,867 m2 of planted canopy. At 40 mol/m2/day, 3 micromol/J at the fixture, 80% delivery to the canopy and a 16-hour photoperiod, the LEDs draw about 830 kW when on. The calculation assumes full artificial lighting and budgets no daylight credit. [NASA crop-lighting study](https://ntrs.nasa.gov/citations/20140017323), [US Department of Energy lighting research](https://www.energy.gov/sites/prod/files/2020/07/f76/ssl-agriculture-jun2020.pdf)
- The array supplies **1.47 MW** with a 25% capacity margin. A planning estimate of **16,455 m2** uses 877 W/m2 above the atmosphere, 85% assumed transmission, a 45-degree star elevation, 20% effective cell conversion and 85% balance-of-system efficiency. The assumed spectrum-specific conversion and atmospheric transmission govern the result. The 0.5 MWh battery allocation supports 125 kW of critical loads for four hours. [Proxima irradiance study](https://arxiv.org/abs/1704.08449)
- Entry: each habitat disc lands belly-first on its own inflatable heat shield; the cargo ship lands belly-first on
  an elongated shield under its payload.
- Proxima system (`systemSky()`): to scale, rebuilt per frame relative to the camera; focus buttons for Proxima,
  d, b, c (candidate), both ships and the settlement. Zoom out from the settlement to follow the curved terrain into the System view. Zoom back toward the site to return to the surface.
- Labels simply name each item; with Labels on, interior items are labelled close up, including inside rooms.
- Tanks: each staged module is a grid of domed cylindrical tanks (deuterium, then helium-3) in insulation with
  bands, a feed manifold, corner longerons and end frames, holding liquid D (0.163 t/m3) and He-3 (0.059 t/m3)
  exactly (no ullage); landing LOX/LH2 at liquid density.
- The offline build runs its background worker as a classic worker so it also works when opened from disk.

# Earlier selected architecture notes

Current frozen concept: S7 in `../docs/FINAL_MODEL_SPECIFICATION.md`. The viewer panel reports both ships;
the earlier S1 figures below are historical. No health-qualified optimum is claimed.

24 adults, 24 berths, 24 descent seats and two reproductive-bank locations.
20 Earth-year crew flight; cargo departs 20 years earlier for a 40-year flight.
Births after arrival. See `../data/mission_architecture.json` and
`../docs/PROPULSION_ARCHITECTURE.md`. The new mission panel distinguishes these
requirements from the historical engine/tank geometry and older mass studies below.
No complete hybrid mass or radiation solution is claimed.

Selected propulsion baseline S1 now adds explicit optimistic engine, hot-radiator,
storage and retained-reserve accounting: see `../docs/STAGED_DESIGN_BASELINE.md`.
The mission panel displays its conditional numbers; 3D propulsion geometry remains
the historical reference, not a newly dimensioned staged engine.

# Historical viewer engineering notes

Dependency-free, reference-informed 3D design study. The selected hardware target
uses two 19.5 m-radius discs and three decks each. Engineering, torpor and tonnes-scale
antimatter containment are unvalidated; the detailed geometry is conceptual.

Open ../proxima-design-viewer.html directly for the offline viewer. It embeds data,
worker code and styles. Left-drag pans at the clicked
surface depth, right-drag orbits at the current cursor position, and scroll zooms around the current cursor.

Ten main configurations prepare in the background after the opening view becomes
usable; the footer reports readiness. Spin, deck, radiator, selection and dimension
controls reuse geometry. Cutaway removes forward membrane faces and transport
covers. The worker compiles compact GPU streams and transfers their buffers.

The frontend previews the latest conditional cruise-engine reuse study: 376.3 t
after touchdown, 8.62 t hydrogen, 126.8 t released at proposed hydrogen handover.
The main direct engine, bulk store, standoff frame and shared hot panels stay
through direct descent, then separate. Only thermal touchdown hardware remains.
Safe stage divert, thermal cooling, hardware masses and the 1 km switch are unqualified.
The earlier 386.4 t independent-engine budget remains in ../reports/mass-budget.json for
comparison. Generated design-data.json identifies the displayed viewer_design and
retains both sets of calculations. Engineering reports are in ../docs/.

Loading overlays honor the hidden attribute. SceneStore recovers from worker load,
message and posting errors, and switches to local generation after a 20-second
unresponsive-worker timeout. Model/render failures show a retry action. The actual
offline bundle is exercised with workers blocked and with its embedded worker source.
These checks use a DOM/canvas harness; browser pixels and actual frame rate remain
unverified in this environment.

Performance policy: whole-ship views use an overview mesh (about 4.1 MB of GPU
vertex buffers versus 27 MB for the full cruise cutaway on the profiling fixture).
Small fittings return automatically when the camera is closer than 60 m and input
has settled. Close-up detail uses the original high geometry on WebGL and medium
geometry on software rendering. The cabin/room programme and inventories are retained.

The viewer requests frames only for changes or spin, and pauses offscreen rendering.
Background overview preparation waits for 750 ms of inactivity and stops while
panning, scrolling or spinning. Hover picking waits for the pointer to rest.
Graphics/picking cache accounting is capped at 128 MB (apart from an individually
oversized active/preparing scene). Software rendering caches bounds and face normals,
culls offscreen/subpixel geometry, caches shading colours and rotates only visible
meshes instead of copying the entire scene. Node tests cover these behaviours.

Run `node mission-viewer/perf-profile.mjs` from the parent directory for geometry,
CPU rendering and picking measurements. Its no-op canvas excludes actual browser
rasterisation, driver and display costs; those timings are not browser FPS claims.

Regenerate from the parent directory:

```powershell
python -m calculations.selected_mass_budget
python -m unittest discover -s tests
python mission-viewer/sync_data.py
python mission-viewer/pack_standalone.py
```

From this directory run `npm test` for viewer tests. `npm run preview` serves the
static viewer locally. The tests use a DOM/canvas harness; actual browser pixels
and frame rate are unverified.

The earlier reference is frozen in ../data/mass_reference_inputs.json. Running
`python -m calculations.mass_budget` from the repository root writes
reports/mass-reference-budget.json without changing the selection.
The historical alternatives are in ../docs/MASS_OPTIMISATION.md; current calculations
are in ../calculations/selected_mass_budget.py and ../reports/mass-budget.json.

Visual structure revision: the viewer now represents the cruise support as four braced longerons instead of a solid central cylinder, and omits that cruise-length structure in touchdown and settlement. Ground equipment uses local support pallets; surface circulation and radiator headers are explicit. Hydrogen tanks retain their existing computed capacity and gain visible mounts, feed lines and isolation valves. This is a geometry study: independent pallet deployment, upright landing stability, structural sizing, coolant sizing and thermal performance are not validated. No mass or fuel savings have been credited to the mission budget.

Habitat decks now meet at shared walls, with interior panels inset from the
closed shell and perimeter windows following its rounded outline. Surface
pressure tunnels use rounded sections and a tangent bend into the greenhouse
spine. Labels start off; physical room signs remain visible inside.

The 32-seat refuge, two food-factory sections and rover cabin form an inline
pressurised chain behind the wheels. The four crew bays are selectable and joined
to the hub transfer tube; movement stops before the unpressurised cargo bays.
Cargo and tanks share parallel aft bays, followed by containment and propulsion.
The nominal cruise envelope is 127 m (previously 163 m). No mass or fuel savings
are claimed, and this layout does not establish radiation protection.

Airlock chambers fit inside the wheel envelope. In flight, the underside of
each 13 cm deck slab is the ceiling of the layer below; there is no separate
ceiling shell or empty annular compartment between decks.

Surface rover driving: select the rover to enter its driver station. W accelerates,
S brakes before engaging reverse, A/D steer, and Space brakes. Right-drag to orbit, left-drag to pan, and scroll to zoom;
Escape returns outside and applies the parking brake. Forward speed is governed
at 3 m/s (10.8 km/h), reverse at 1 m/s, level acceleration is 0.45 m/s2 and braking
is 1 m/s2. Coasting drag is 0.15 + 0.01*v^2 m/s2. A 6 m wheelbase and limited
lateral acceleration govern steering. The conceptual model assumes Earth-like
gravity for slope forces, with 2 m/s2 available traction; Proxima b terrain,
friction and vehicle performance are not measured specifications. Terrain pose,
building avoidance, GPU rendering and picking use the same live vehicle pose;
movement does not regenerate the settlement mesh. The rough-terrain speed scale
is consistent with NASA's Lunar Electric Rover study:
https://ntrs.nasa.gov/api/citations/20110003563/downloads/20110003563.pdf

Paired cabins share one middle partition and the pod boundary bulkheads.
Communal rooms open directly to their shared partitions rather than adding an
extra concentric front wall. Small plaques attach to both faces of doorway
lintels and jambs; burn-level plaques use the corresponding thrust-gravity frame.
The separate Enter room button has been removed.

The dust shield geometry uses two composite skins separated by a 0.55 m gap. With the existing 100 kg/m2 face allocation and an assumed density of 1,800 kg/m3, the assembly is about 0.61 m deep. The spacing and 60/40 skin split are concept assumptions. Ballistic performance at mission speed remains unvalidated. [NASA shielding handbook](https://ntrs.nasa.gov/citations/20090010053)
