"""Copy the workspace design's current assumptions into the static viewer."""
import json
from pathlib import Path
import runpy
import sys

project = Path(__file__).resolve().parent
root = project.parent
sys.path.insert(0, str(root))
data = {}
for name, key in (("habitat_layout", "habitats"), ("settlement_systems", "settlement"),
                  ("exploration_manifest", "exploration"), ("spacecraft_layout", "layout")):
    data[key] = json.loads((root / "data" / (name + ".json")).read_text(encoding="utf-8"))
calc = runpy.run_path(str(root / "calculations" / "mission_calculations.py"))
data["mass_budget"] = runpy.run_path(str(root / "calculations" / "selected_mass_budget.py"))["build_selected"]()

data["mass_optimisation"] = runpy.run_path(str(root / "calculations" / "mass_optimisation.py"))["build_optimisation"]()

data["engine_reuse_options"] = runpy.run_path(str(root / "calculations" / "engine_reuse_options.py"))["build_engine_options"]()

# Frontend previews the latest reuse study; preserve the independently calculated
# earlier orbital-separation budget under mass_budget for explicit comparison.
import copy
reuse=next(c for c in data["engine_reuse_options"]["cases"] if c["switch_height_km"]==1)
rows=copy.deepcopy([r for r in data["mass_budget"]["components"] if r["kind"]!="derived"])
for row in rows:
    row["release_stage"]="surface" if row["surface_delivery"] else "orbit" if row["id"] in {"dustshield","bearings","spacescouts"} else "handover"
    if row["id"]=="engine":row.update(system="Hydrogen-heated touchdown assembly",basis="Conservative retained 10 t allowance for heater, chambers, nozzles, feed and thermal control. No duplicate direct-exhaust nozzle; cooling and mass unqualified.")
    if row["id"]=="containment":row.update(system="Touchdown antimatter isolation and containment",basis="Conservative 2 t retained allowance for local heater fuel metering/isolation; unqualified.")
margin_fraction=data["mass_budget"]["assumptions"]["hardware_margin_fraction"]
land_margin=reuse["landed_hardware_with_margin_kg"]*margin_fraction/(1+margin_fraction)
for key,label,mass,phase,basis in [
    ("hydrogentank","Touchdown hydrogen tanks",reuse["thermal_hydrogen_kg"]*.12,"surface","12% of calculated hydrogen mass; reused as suitable storage."),
    ("engineradiator","Shared direct-engine hot radiators",reuse["engine_hot_radiator_kg"],"handover","Sized for the larger of cruise and direct-descent heat; released with main engine."),
    ("margin","Surface hardware development allowance",land_margin,"surface","25% allowance on retained hardware."),
    ("flightmargin","Released hardware development allowance",reuse["hardware_with_margin_kg"]*margin_fraction/(1+margin_fraction)-land_margin,"handover","25% allowance follows released hardware; includes early-release margin in the total."),
    ("fuelreserve","Unused correction stock",reuse["retained_correction_propellant_kg"],"handover","Reserve remains in released bulk store; actual stage divert/disposal not solved.")]:
    rows.append(dict(id=key,system=label,mass_kg=mass,kind="derived",surface_delivery=phase=="surface",release_stage=phase,basis=basis,status="Conditional engine-reuse study"))
# Split release margin between early and late hardware so phase ledgers also close.
release_margin=next(r for r in rows if r["id"]=="flightmargin")
early_margin=sum(r["mass_kg"] for r in rows if r["release_stage"]=="orbit" and r["kind"]=="hardware")*margin_fraction
release_margin["mass_kg"]-=early_margin
rows.append(dict(release_margin,id="earlymargin",system="Early-release hardware allowance",mass_kg=early_margin,release_stage="orbit"))
assert abs(sum(r["mass_kg"] for r in rows if r["surface_delivery"])-reuse["final_retained_mass_kg"])<1e-6
assert abs(sum(r["mass_kg"] for r in rows if r["release_stage"]=="orbit")-reuse["early_release_mass_kg"])<1e-6
assert abs(sum(r["mass_kg"] for r in rows if r["release_stage"]=="handover")-reuse["late_engine_stage_release_mass_kg"])<1e-6
# The superseded three-deck design stays available to the earlier trade studies and their tests.
data["reference_design"]={"name":"Three-deck 19.5 m discs / cruise-engine reuse reference","nominal":reuse,"components":rows,
    "status":"Superseded reference. Main direct engine retained through descent; controlled release at hydrogen handover remains unresolved."}
data["reference_layout"]=json.loads((root / "data" / "reference" / "spacecraft_layout.json").read_text(encoding="utf-8"))
# Displayed ship: lightweight single-deck discs with calculated tanks, shields and radiators.
data["design"]=runpy.run_path(str(root / "calculations" / "ship_design.py"))["build_design"]()
data["viewer_design"]={k:data["design"][k] for k in ("name","nominal","components","status")}

data["landing_options"] = runpy.run_path(str(root / "calculations" / "landing_mass_options.py"))["build_landing_options"]()

data["trajectory"] = data["design"]["trajectory"]
data["reference_trajectory"] = data["mass_budget"]["trajectory"]
data["mission_config"] = json.loads((root / "data" / "mission_config.json").read_text(encoding="utf-8"))
data["design_to_mass_target"] = runpy.run_path(str(root / "calculations" / "mission_300_trade.py"))["build_target"]()
data["roster"] = calc["paired_roster"]()
data["power"] = calc["surface_power_bank"]()
data["farm"] = calc["vertical_farm_sensitivity"]()
greenhouse = data["settlement"]["greenhouse"]
canopy = data["settlement"]["food_factory"]["fresh_food_canopy_m2"]
lighting_kWh = canopy * greenhouse["daily_light_integral_mol_m2_day_study"] / (greenhouse["fixture_photon_efficacy_umol_J_study"] * greenhouse["fixture_to_canopy_delivery_fraction_study"] * 3.6)
data["farm"]["selected"] = {"canopy_m2": canopy, "average_lighting_kW": lighting_kWh/24, "lighting_kW_when_on": lighting_kWh/greenhouse["photoperiod_hours_study"]}
data["continuous_descent"] = calc["continuous_terminal_sensitivity"]()
(project / "dist" / "design-data.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
print("Synchronized design sources and calculated mission data.")
