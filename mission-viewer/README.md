# Proxima Mission Design Lab

Dependency-free, reference-informed 3D design study. The selected hardware target
uses two 19.5 m-radius discs and three decks each. Engineering, torpor and tonnes-scale
antimatter containment are unvalidated; the detailed geometry is conceptual.

Open ../proxima-design-viewer.html directly for the offline viewer. It embeds data,
worker code and styles. Left-drag pans at the clicked
surface depth, right-drag orbits, and scroll zooms to component scale.

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
S brakes before engaging reverse, A/D steer, and Space brakes. Drag to look;
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
