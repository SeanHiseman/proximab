# Proxima Mission Design Lab

Interactive spacecraft and surface-settlement model, with reproducible mission,
mass-budget, food-production and shielding studies.

Open **proxima-design-viewer.html** directly in a browser for the self-contained
offline viewer. It shows the S8 crew ship (see below) and a separate cargo ship, a
mission map of their departures (cargo year 0, crew year 20) and common arrival
(year 39.9), and a journey slider for the selected ship (stretched so burns, the final
month and arrival get room, with milestone marks) that drops its 16 tank modules in
chronological order. The sky is live: real star positions with parallax along the route,
relativistic aberration and Doppler brightening, ending in a parking orbit above a mock-up of
Proxima b with Proxima Centauri (about 1.7 degrees across) and Alpha Centauri A and B behind. Descent is a separate view (both landers). Surface power is sized for **0.90 MW average** and **1.18 MW with crop lighting on**.
About **16,455 m2** of flat photovoltaic blankets deliver **1.47 MW** with design margin.
Zoom out from Surface to follow Proxima b into the System view.

**S8 redesign** ([report](reports/tandem-redesign.json), `python -m calculations.tandem_redesign`):
the two habitat discs fly edge-on in tandem and lock during burns, with each room's floors set so 'down'
points away from the engine. All 454 t of crew braking fuel is built into the disc walls
(8 nested layers, 2.40 m, ~27 g/cm2, no dose credit) and turns with the discs;
emptied outer layers are released. The acceleration tanks (domed cylindrical tanks at liquid D/He-3
density, ~916 m of modules) hang between the tow frame and the habitats, so the crew hangs at
the bottom; modules release sideways from the top. A cryogenic trunk line runs up the straps and along
the tether to a buffer tank at the engine: peak flow is only 0.9 kg/s, so a ~7 cm line suffices.
The engine is towed on 2000 m tethers (Zylon-class, safety factor 2): four complete pod engines
(each its own reaction chamber and magnetic nozzle; plasma cannot be piped round bends to shared nozzles)
in a row across the shield width, canted 5.5 degrees so the plume edge clears the ship (the
0.46% thrust loss is charged).  One forward dust shield, with four thin spikes covering the radiator fins' leading edges (24.2 x 12.1 m) always leads: in
front of the engine, which leads through acceleration and the whole coast; the ship flips once, at the start of
braking, when the engine is re-rigged behind and the shield moves to the crew end. Engine radiation shadow shields are removed from the design and the ledger for now (open item: the
engine's radiation toward the tethers and ship is unshielded and unsized). The crew ship adds windows along
the transfer tube, EVA handrails, tether points and a small robotic arm (suits and airlocks are the habitats' own). Each habitat disc lands separately, belly-first on its
own stacked-ring inflatable heat shield (HIAD) with the payload in its wake. Crew antimatter is 30 t, giving a crew departure mass of 7,001 t
(S7: 27,335 t at 20 t); the design sits near the antimatter limit, where every retained tonne costs many
at departure (35 t of antimatter would roughly halve it). Tether dynamics and re-rigging are not yet sized.
The selected architecture now has 24 adults, a 20-year crew flight,
40-year cargo flight departing 20 years earlier, and births after arrival. The model
has 24 berths, 24 descent seats and two reproductive-bank locations. Its gravity
module envelopes are retained; 750 m³ usable space is an allocation, not a measured
net volume. Older mass ledgers remain labeled references.
The selected propulsion architecture is fully onboard staged fusion–antimatter.
The S7 target was [20 t antimatter with zero main-fuel reserve](docs/FUSION_EFFICIENCY_RESEARCH.md),
eight tank drops per burn; the S8 redesign raises crew antimatter to 30 t (see above). The earlier 500 t retained allocation is historical. The earlier
80% annihilation-to-exhaust coupling is an optimistic assumption unsupported by
an engineered coupling mechanism. The viewer labels it accordingly. The
[S3 integrated component budget](docs/INTEGRATED_DESIGN_SPECIFICATION.md) remains
a reference; it is not a component closure for the new 500 t allocation.

The selected [S7 model-redesign specification](docs/FINAL_MODEL_SPECIFICATION.md) freezes 20 t crew antimatter, zero cargo antimatter, two coaxial habitat modules and a 20 m circular forward shield. Crew fusion is 26,398 t; cargo fusion 4,067 t. Crew touchdown is 228.8 t. The specification is ready for conceptual modeling; tank packaging, capture fuel, radiation and landing remain unresolved.

The [fleet fuel-mixture comparison](docs/FLEET_FUEL_MIX.md) compares fusion-only, hybrid and antimatter-powered alternatives at the same travel times, including engine, radiator and staged-tank mass. It is a study, not an adopted replacement for S6.

The authoritative requirements are in `data/mission_architecture.json`. Historical
`mission_config.json` and earlier calculations remain reference studies, not the new
vehicle budget. See [propulsion investigation](docs/PROPULSION_ARCHITECTURE.md).

## Run the served viewer

From the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory mission-viewer/dist
```

Visit http://127.0.0.1:8765. No package installation is required.

## Regenerate the offline viewer

```sh
python mission-viewer/sync_data.py
python mission-viewer/pack_standalone.py
```

## Checks

```sh
python -m unittest discover -s tests
node --test mission-viewer/tests/*.test.mjs
```

Python performs the numerical accounting checks. Node checks geometry,
navigation, rendering buffers, worker fallback and the packaged application.
These checks do not validate the speculative propulsion, torpor, autonomous food
production or radiation-protection assumptions.

The repository is organised as follows:

- `calculations/`: Python calculation modules; run studies with `python -m calculations.mission_300_trade` (or another module name).
- `data/`: editable mission, spacecraft, habitat and settlement inputs.
- `reports/`: numerical study outputs and mass ledgers.
- `docs/`: engineering reports, assumptions and references.
- `tests/`: Python accounting tests.
- `mission-viewer/`: viewer source, build scripts and JavaScript tests. `dist/` contains the served application, including its generated design data.

See [the viewer notes](mission-viewer/README.md),
[mission design](docs/MISSION_DESIGN.md), [shielding assessment](docs/SHIELDING_ASSESSMENT.md)
and [300-tonne planning study](docs/MISSION_300_TRADE.md) for context. Local browser
profiles, caches and hosting metadata are excluded from the repository.
