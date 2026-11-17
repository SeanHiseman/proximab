# Proxima Mission Design Lab

Interactive spacecraft and surface-settlement model, with reproducible mission,
mass-budget, food-production and shielding studies.

Open **proxima-design-viewer.html** directly in a browser for the self-contained
offline viewer. The selected architecture now has 24 adults, a 20-year crew flight,
40-year cargo flight departing 20 years earlier, and births after arrival. The model
has 24 berths, 24 descent seats and two reproductive-bank locations. Its gravity
module envelopes are retained; 750 m³ usable space is an allocation, not a measured
net volume. Engine/tank geometry and older mass ledgers remain labeled references.
The selected propulsion architecture is fully onboard staged fusion–antimatter.
The selected target is now [20 t antimatter with zero main-fuel reserve](docs/FUSION_EFFICIENCY_RESEARCH.md),
eight tank drops per burn. The earlier 500 t retained allocation is historical. The earlier
80% annihilation-to-exhaust coupling is an optimistic assumption unsupported by
an engineered coupling mechanism. The viewer labels it accordingly. The
[S3 integrated component budget](docs/INTEGRATED_DESIGN_SPECIFICATION.md) remains
a reference; it is not a component closure for the new 500 t allocation.
Engine and tank geometry remains a historical reference.

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
