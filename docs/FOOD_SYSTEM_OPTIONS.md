# Selected compact food-factory target

The current design carries 32 people for 20 onboard years, a 10 t food-factory
hardware target, 1 t edible spare food, 20 kg packaging and a separate 1 t
startup/circulating process inventory. Primary food production runs throughout
cruise and burns, then continues after landing. The fresh-food garden has 60 m2
canopy. Large surface greenhouses are manufactured locally after arrival.

## Leading candidate for this advanced, electricity-rich ship

Use an electrochemical/microbial food factory for most nutrition, plus a small
fresh-food garden. Hydrogen-oxidising bacteria use onboard electrolysis products
and recovered carbon dioxide to produce edible protein-rich biomass without
large illuminated crop canopies. A space-food study calculated lower equivalent
system mass than packaged food and illuminated algae for its scenarios. Equivalent
system mass includes resource penalties; it is not an actual kilogram bill of
materials and cannot be used to divide our spacecraft mass by a published factor.
A protein-rich microbial monoculture is not a complete diet.

[Space-food study](https://www.sciencedirect.com/science/article/pii/S0094576520307438)

Separate processes must supply digestible carbohydrates, fats including essential
fatty acids, fibre, micronutrients and acceptable foods. Electrochemical acetate
coupled to fungi/yeast is a candidate carbon route. Chemoenzymatic starch synthesis
from CO2 has been demonstrated in research, but a compact complete-diet system
with catalyst/enzyme regeneration is still an enabling technology assumption.
A small salad/herb/crop area can provide fresh variety and psychological benefit;
it need not supply most calories. A dedicated illuminated algae plant is not
assumed to be the lightest option just because its organisms are microscopic.

[Electrochemical-biological food](https://doi.org/10.1038/s43016-022-00530-x)
[Starch research](https://pubmed.ncbi.nlm.nih.gov/34554807/)

## Elemental closure, not perpetual energy

Under the user's full-recycling assumption, food atoms circulate rather than
being consumed irreversibly. Exhaled CO2, water and purified waste-derived nitrogen,
phosphorus, sulfur, salts and trace elements return to production. Organic waste,
spent material and reject streams must be sterilised/mineralised and separated
before food-grade inputs are released. Directly feeding untreated human waste
to the food line is not the proposed architecture.

Electricity supplies hydrogen/reducing power and restores chemical food energy.
Hydrogen is generated from onboard water, not carried as a sixteen-year food
feedstock. Oxygen and water cycles are integrated with life support. Heat still
requires rejection. Initial working fluid, carbon/nutrient buffers, culture banks,
catalysts, clean-in-place equipment and replaceable units retain mass.

[ESA closed-loop life support](https://www.esa.int/articles/life-support)


## Reserve and hardware limits

At 0.617 kg dry food/person/day, one tonne feeds all 32 adults for 50.65 days.
No torpor metabolic discount is used. It is shorter than either approximately
63-day main burn, so food production cannot simply stop during powered flight.
Two separately isolated complete-diet trains, protected culture/seed banks,
sterilisation and a restart procedure are required; the reserve does not prove
adequate recovery time. Circulating chemicals are not edible emergency food.

The factory's 10 t target includes its two pressure modules, production hardware,
food finishing, safety systems and small garden. Power, cooling, gas, 3 t extra
process water and 1 t working nutrient inventory remain in separate ledger rows.
The 250 kWe process-and-garden allocation is a target within a 2 MWe ship budget.
No integrated design establishes complete nutrition, output or these masses.

`food_system_options.py` compares 10/20/30 t hardware with one tonne and six months
of edible food, including 2% bulk packaging. It preserves the current component
ledger and solves fuel, tanks, radiator heat and margin for each case. Selected
10/20/30 t hardware cases with staged surface delivery depart at approximately
1,331/1,362/1,394 t. Flight-only hardware is carried through interstellar braking, then detached.


Universal local fabrication and ultimate elemental recovery are scenario
assumptions. Reject streams require purification before reuse. Energy, food safety,
trace nutrients, culture stability and waste heat are not solved by material closure.
