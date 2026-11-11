# Proxima Mission Design Lab

Interactive spacecraft and surface-settlement model, with reproducible mission,
mass-budget, food-production and shielding studies.

Open **proxima-design-viewer.html** directly in a browser for the self-contained
offline viewer. The current model retains the two habitat wheels. The compact
pod and 300-tonne studies are proposals for later design work, not the displayed
ship geometry or demonstrated engineering capabilities.

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
