// category.ts
// Category classification rules used to populate each line item's
// `category` field. Kept as its own module so the fixed category list and
// its classification heuristics can be maintained/tuned independently of
// the rest of the extraction prompt.

export const CATEGORY_VALUES = [
  "Appliances",
  "Cabinets",
  "Concrete",
  "CounterTops",
  "Drywall",
  "Electrical",
  "Finish Trim",
  "Flooring",
  "Framing-Panels",
  "Framing-Trusses",
  "Framing-Lumber",
  "Furniture/Fixtures",
  "Garage",
  "Landscaping",
  "HVAC",
  "Insulation",
  "Masonry",
  "Painting",
  "Plumbing",
  "Roofing",
  "Stucco",
  "Specialties",
  "Windows",
] as const;

export type Category = (typeof CATEGORY_VALUES)[number];

// Machine-generated "type A | type B | ..." string for embedding directly
// into the JSON-shape section of a prompt. Derived from CATEGORY_VALUES so
// the prompt's schema can never drift out of sync with the list below.
export const CATEGORY_UNION_TYPE_STRING = CATEGORY_VALUES.map(
  (value) => `"${value}"`
).join(" | ");

export const CATEGORY_CLASSIFICATION_RULES = `
Assign each line item's \`category\` to exactly one of the following fixed
values (case-sensitive, use exactly as written):
\`"Appliances"\`, \`"Cabinets"\`, \`"Concrete"\`, \`"CounterTops"\`, \`"Drywall"\`,
\`"Electrical"\`, \`"Finish Trim"\`, \`"Flooring"\`, \`"Framing-Panels"\`,
\`"Framing-Trusses"\`, \`"Framing-Lumber"\`, \`"Furniture/Fixtures"\`, \`"Garage"\`,
\`"Landscaping"\`, \`"HVAC"\`, \`"Insulation"\`, \`"Masonry"\`, \`"Painting"\`,
\`"Plumbing"\`, \`"Roofing"\`, \`"Stucco"\`, \`"Specialties"\`, \`"Windows"\`

**Category definitions and typical examples:**
- **Appliances** — Refrigerators, ranges/ovens, cooktops, dishwashers,
  microwaves, range hoods, washers, dryers, garbage disposals, wine coolers.
- **Cabinets** — Kitchen/bath cabinets, cabinet boxes, vanities (cabinet
  portion only), cabinet hardware (hinges, pulls, knobs, drawer slides) when
  sold as part of a cabinetry line.
- **Concrete** — Ready-mix/bagged concrete, cement, rebar, wire mesh,
  concrete forms, footings, concrete anchors/bolts, expansion joint
  material, concrete sealers/curing compounds.
- **CounterTops** — Countertop slabs/sheets (laminate, quartz, granite,
  butcher block), countertop brackets/supports, edge banding, sink cutout
  kits for countertops.
- **Drywall** — Drywall/gypsum board sheets, joint compound ("mud"), joint
  tape, corner bead, drywall screws, drywall repair patches.
- **Electrical** — Wire/cable, conduit, breakers, panels, outlets, switches,
  junction boxes, wire nuts, GFCI devices, low-voltage/data wiring,
  smoke/CO detectors, doorbells.
- **Finish Trim** — Baseboards, crown molding, door/window casing, chair
  rail, interior trim boards, trim nails, interior doors and door hardware
  (hinges, knobs, locksets for interior doors).
- **Flooring** — Tile (floor), hardwood, engineered wood, laminate flooring,
  vinyl plank/sheet flooring, carpet, flooring underlayment, transition
  strips, grout and thinset for floor tile.
- **Framing-Panels** — OSB, plywood sheathing, structural panels used for
  walls/roof decking, subfloor panels.
- **Framing-Trusses** — Roof trusses, floor trusses, engineered structural
  beams (LVL, glulam), I-joists.
- **Framing-Lumber** — Dimensional lumber (2x4, 2x6, 2x10, etc.), studs,
  joists, posts, framing connectors/hangers, framing nails/screws, house
  wrap/building paper used during framing stage.
- **Furniture/Fixtures** — Light fixtures/lamps (decorative, not electrical
  rough-in), mirrors, bathroom accessories (towel bars, TP holders),
  mailboxes, shelving units, closet systems, blinds/shades.
- **Garage** — Garage doors, garage door openers/hardware, garage storage
  systems, garage flooring coatings.
- **Landscaping** — Sod, mulch, soil, plants/trees, pavers (exterior
  hardscape), fencing, irrigation/sprinkler components, outdoor lighting
  (landscape), retaining wall block.
- **HVAC** — Furnaces, air conditioning units, ductwork, vents/registers,
  thermostats, refrigerant lines, exhaust/bath fans.
- **Insulation** — Batt/roll insulation, rigid foam board, spray foam,
  blown-in insulation, vapor barrier/poly sheeting, weatherstripping used
  for insulation purposes.
- **Masonry** — Brick, concrete block (CMU), stone veneer, mortar/mortar mix
  (non-structural-concrete), masonry ties, masonry sealers.
- **Painting** — Paint, primer, stain, brushes, rollers, painter's tape,
  drop cloths, caulk used for paint prep, spackle for paint touch-up.
- **Plumbing** — Pipes (PVC, copper, PEX), fittings, valves, faucets,
  toilets, sinks (plumbing fixtures), water heaters, sump pumps, water
  supply lines, drain components.
- **Roofing** — Shingles, roofing felt/underlayment, flashing, roof vents,
  gutters/downspouts, ridge caps, roofing nails/adhesive.
- **Stucco** — Stucco mix, lath/wire mesh for stucco, EIFS components,
  stucco trim/accessories.
- **Specialties** — Fasteners/hardware not specific to a single category
  (general screws, bolts, nails not tied to framing/roofing), tools,
  ladders, safety equipment (gloves, glasses, respirators), adhesives/
  sealants not tied to a specific trade, cleaning supplies, tarps,
  miscellaneous hardware, delivery fees, and anything that does not clearly
  match another category.
- **Windows** — Windows, window screens, window hardware/locks, window
  flashing kits sold with the window.

**Tie-breaker guidance for ambiguous items:**
- Water heaters → \`"Plumbing"\` (not Appliances), unless clearly a standalone
  "tankless electric water heater appliance" bundle — default to Plumbing.
- Light fixtures (ceiling fans, recessed lights, vanity lights) →
  \`"Electrical"\` if sold as rough-in/functional lighting hardware;
  \`"Furniture/Fixtures"\` if clearly decorative/finish-stage (e.g., pendant
  lights, chandeliers, mirrors with lighting).
- Interior door hardware/locksets → \`"Finish Trim"\`; exterior door
  hardware/locksets → \`"Specialties"\` unless clearly part of a window/door
  special order (use vendor context, e.g., Kwikset PO sections are
  typically \`"Finish Trim"\` unless the item is explicitly a garage or
  exterior entry system, in which case use \`"Garage"\` or judge by
  description).
- Pavers/retaining wall block → \`"Landscaping"\` (not Masonry) when clearly
  used for outdoor hardscaping; use \`"Masonry"\` only for brick/block/stone
  used in structural or veneer wall construction.
- Caulk/adhesive/sealant → \`"Painting"\` if clearly paint-prep or
  finish-stage; \`"Specialties"\` if general-purpose construction adhesive/
  sealant with no clear trade association.
- Screws/nails/fasteners → categorize by their stated use context (e.g.,
  "drywall screws" → Drywall, "roofing nails" → Roofing, "framing nails" →
  Framing-Lumber); if generic/unspecified → \`"Specialties"\`.
- When a Special Order vendor name strongly implies a category (e.g.,
  "Woodcrafters Home Products" → likely \`"Cabinets"\` or \`"CounterTops"\`;
  "Capital Lumber" → likely \`"Framing-Lumber"\` or \`"Framing-Panels"\`), use
  that vendor context together with the item title to pick the best-fit
  category rather than defaulting to Specialties.
- If a single title reasonably fits two categories, choose the one
  representing the item's primary trade/use, not its material composition
  (e.g., a wood countertop support bracket → \`"CounterTops"\`, not
  \`"Framing-Lumber"\`).

Never leave \`category\` null. When genuinely uncertain after applying the
above, use \`"Specialties"\` and flag the overall receipt as \`"needs_review"\`
if this happens for a significant portion of high-value line items.
`;