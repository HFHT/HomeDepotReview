export const HOME_DEPOT_RECEIPT_EXTRACTION_PROMPT = `# HOME DEPOT PRO "CUSTOMER RECEIPT" EXTRACTION PROMPT

You are extracting structured data from **Home Depot Pro Customer Receipts** (multi-page PDFs, typically 1–6 pages). These are itemized order/invoice documents for commercial/Pro Xtra accounts (e.g., contractors, nonprofits) and include Will Call, Delivery, and Special Order sections. Read **all pages** as a single logical document before producing output — line items, totals, and payment info are frequently split across pages.

================================================================================
OUTPUT FORMAT (STRICT)
================================================================================
Return exactly one JSON object matching this shape (types shown for reference; 
output plain JSON, not TypeScript):

\\\`\\\`\\\`
{
  "supplier": string | null,
  "receipt_type": "register" | "invoice" | "other",     // Always "invoice"
  "store": string | null,
  "store_location": string | null,
  "customer_email": string | null,
  "receipt_number": string | null,
  "order_number": string | null,
  "po_or_job": string | null,
  "project_name": string | null,
  "date": string | null,          // format YYYY-MM-DD
  "time": string | null,          // 24 hour format HH:MM
  "total": number | null,
  "total_discount": number | null,
  "total_tax": number | null,
  "subtotal": number | null,
  "line_items": [
    {
      "id": string,
      "sku_or_upc": string | null,
      "model": string | null,
      "special_order_po": string | null,
      "title": string | null,
      "unit_price": number | null,
      "quantity": number | null,
      "discount": number | null,
      "total_price": number | null
    }
  ],
  "image_results": {
    "overallStatus": "success" | "needs_review" | "failed"
  }
}
\\\`\\\`\\\`

Output must be valid JSON — no comments, no trailing commas, no markdown code fences, no extra keys, no explanatory text before or after the JSON. Every key defined above must be present, even if its value is null or an empty array.

================================================================================
FIELD MAPPING RULES (SPECIFIC TO THIS RECEIPT FORMAT)
================================================================================

**Header fields**
- \`supplier\`: Always \`"The Home Depot"\`.
- \`receipt_type\`: Always \`"invoice"\`.
- \`store\`: Use the \`Store #\` value, formatted as \`"Store #0481"\` (include the leading text "Store #").
- \`store_location\`: Use the \`Location\` address on the header (street, city, state, zip) — this is the *selling store's* address, not the customer's or delivery address.
- \`date\`: Parse the date/time stamp printed at the top of page 1 (e.g., \`4/21/2026, 3:05 PM MST\`) → output as \`YYYY-MM-DD\`.
- \`time\`: Same stamp, converted to 24-hour \`HH:MM\` (drop timezone and seconds).

**Customer / order identifiers**
- \`customer_email\`: Email address listed under "Customer Information" (below phone number).
- \`receipt_number\`: Value of \`Receipt #\`. If it reads literally "TBD after payment is processed" or similar placeholder text, output \`null\`.
- \`order_number\`: Value of \`Order #\` (e.g., \`H0481-338198\`).
- \`po_or_job\`: Value of \`PO / Job Name\` field (may wrap onto a second line — concatenate into one string).
- \`project_name\`: Value of \`Project Name\` field under Customer Information. If absent, \`null\`.

**Totals** (always found on the final summary page, right-hand box)
- \`subtotal\`: value labeled \`Subtotal\`.
- \`total_discount\`: value labeled \`Discounts\` — output as a **positive number** (strip the minus sign).
- \`total_tax\`: value labeled \`Sales Tax\`.
- \`total\`: value labeled \`Order Total\` (NOT "Balance Due" — Balance Due reflects remaining payment after partial charges and is not the receipt total).

================================================================================
LINE ITEM EXTRACTION RULES
================================================================================

1. **Scope**: Include every numbered row across all item tables on every page — this includes rows under plain "# Item Description" tables, rows under "Special Order Products" headers, and rows under "Regular Products" headers. Do not skip rows just because they continue onto the next page (long descriptions/QC codes may wrap across a page break — treat as one line item using the \`#\` shown).

2. **id**: Use the numeric value from the \`#\` column exactly as printed (as a string, e.g., \`"01"\`, \`"13"\`). If a row genuinely has no \`#\`, generate a UUID.

3. **title**: Use the core product description text only. Strip out:
   - Discount annotation lines (e.g., "PREFERRED PRICING $X OFF EACH", "DISCOUNT $X OFF EACH")
   - "Delivered by ..." lines
   - Duplicated description text that repeats after a pipe \`|\` separator (Home Depot often prints the same description twice, once truncated and once in full — use the fullest/cleanest version once, not both)
   - \`[QC:#########]\` quality-control codes

4. **sku_or_upc**: Value from the \`SKU #\` column.

5. **model**: Value from the \`Model #\` column. If printed as \`N/A\`, output \`null\`.

6. **unit_price**: Use the **final (post-discount) unit price** — i.e., the second price shown under the strikethrough original price (e.g., if \`$36.98 / each\` is struck through and \`$34.02 / each\` follows, use \`34.02\`). If no strikethrough/discount is present, use the single price shown. Strip units like "/ each", "/ box", "/ roll", "/ linear foot", "/ piece".

7. **quantity**: Value from \`Qty\` column, parsed as a number (strip "ft 0 in", commas, and unit suffixes — e.g., \`216 ft 0 in\` → \`216\`, \`1,176\` → \`1176\`).

8. **discount**: Total discount amount applied to the **entire line** (not per-unit). Compute as:
   \`(original_unit_price − final_unit_price) × quantity\`
   Cross-check against the sum of any "DISCOUNT $X OFF EACH" / "PREFERRED PRICING $X OFF EACH" annotations × quantity — these should reconcile. If no discount is shown, output \`0\`.

9. **total_price**: Value from the \`Subtotal\` column for that row.

10. **"Outside Delivery" rows**: These are legitimate line items (delivery fee waived to $0). Include them with \`title: "Outside Delivery"\`, \`unit_price: 0\`, \`total_price: 0\`, \`quantity: 1\`, and \`discount\` equal to the waived fee (typically \`79.00\`). \`sku_or_upc\` is usually \`515663\`; \`model\` is \`null\`/\`"N/A"\`.

11. **Special Order sections**: Rows appear under a sub-header naming the vendor and a \`PO #\` (e.g., \`Kwikset   PO # 81531369\`, \`Capital Lumber\` with PO shown as part of the section, \`Woodcrafters Home Products   PO # 81531368\`). For **every line item under that vendor sub-header** (until the next sub-header or end of special-order block), set \`special_order_po\` to that PO number as a string (e.g., \`"81531369"\`). If a vendor section has no visible PO # printed, set \`special_order_po\` to the vendor name instead, or \`null\` if truly unavailable. For all non-special-order rows (plain "# Item Description" tables and "Regular Products" rows), \`special_order_po\` must be \`null\`.

12. Ignore delivery/pickup metadata blocks (Delivery Date, Delivery Address, Alternate Pickup Person, Pro Xtra statement, Payment Method history) — these are not line items and are not represented elsewhere in the schema; do not fabricate fields for them.

================================================================================
NUMBER & FORMAT PARSING RULES
================================================================================
- Strip all \`$\` and thousands-separator commas before converting to numbers (e.g., \`$44,719.78\` → \`44719.78\`).
- Negative totals (e.g., \`-$5,547.46\` for Discounts) should be output as their absolute value in \`total_discount\`.
- All monetary values are numbers with up to 2 decimal places, not strings.
- Dates: convert any \`M/D/YYYY\` format to \`YYYY-MM-DD\`.
- Times: convert \`H:MM AM/PM\` to 24-hour \`HH:MM\`, dropping timezone.

================================================================================
VALIDATION & STATUS
================================================================================
- Verify \`subtotal\` ≈ sum of all line item \`total_price\` values (small rounding differences are acceptable).
- Verify \`total\` ≈ \`subtotal − total_discount + total_tax\`.
- Set \`overallStatus\`:
  - \`"success"\` — all key fields (order #, totals, all line items) extracted cleanly and reconcile within rounding.
  - \`"needs_review"\` — minor ambiguities (e.g., a missing receipt number, an unreadable model/SKU, totals off by more than rounding, and unclear special-order PO grouping).
  - \`"failed"\` — unable to extract core totals or line items reliably.
`;

export const HOME_DEPOT_RECEIPT_EXTRACTION_PROMPT_WITH_CATEGORY = `# HOME DEPOT PRO "CUSTOMER RECEIPT" EXTRACTION PROMPT

You are extracting structured data from **Home Depot Pro Customer Receipts** (multi-page PDFs, typically 1–6 pages). These are itemized order/invoice documents for commercial/Pro Xtra accounts (e.g., contractors, nonprofits) and include Will Call, Delivery, and Special Order sections. Read **all pages** as a single logical document before producing output — line items, totals, and payment info are frequently split across pages.

================================================================================
OUTPUT FORMAT (STRICT)
================================================================================
Return exactly one JSON object matching this shape (types shown for reference; 
output plain JSON, not TypeScript):

\\\`\\\`\\\`
{
  "supplier": string | null,
  "receipt_type": "register" | "invoice" | "other",     // Always "invoice"
  "store": string | null,
  "store_location": string | null,
  "customer_email": string | null,
  "receipt_number": string | null,
  "order_number": string | null,
  "po_or_job": string | null,
  "project_name": string | null,
  "date": string | null,          // format YYYY-MM-DD
  "time": string | null,          // 24 hour format HH:MM
  "total": number | null,
  "total_discount": number | null,
  "total_tax": number | null,
  "subtotal": number | null,
  "line_items": [
    {
      "id": string,
      "sku_or_upc": string | null,
      "model": string | null,
      "special_order_po": string | null,
      "title": string | null,
      "category": string,
      "unit_price": number | null,
      "quantity": number | null,
      "discount": number | null,
      "total_price": number | null
    }
  ],
  "overallStatus": "success" | "needs_review" | "failed"
}
\\\`\\\`\\\`

Output must be valid JSON — no comments, no trailing commas, no markdown code fences, no extra keys, no explanatory text before or after the JSON. Every key defined above must be present, even if its value is null or an empty array. The one exception is \`category\`, which must **always** be a non-null string from the fixed list below — never omit it and never set it to null.

================================================================================
FIELD MAPPING RULES (SPECIFIC TO THIS RECEIPT FORMAT)
================================================================================

**Header fields**
- \`supplier\`: Always \`"The Home Depot"\`.
- \`receipt_type\`: Always \`"invoice"\`.
- \`store\`: Use the \`Store #\` value, formatted as \`"Store #0481"\` (include the leading text "Store #").
- \`store_location\`: Use the \`Location\` address on the header (street, city, state, zip) — this is the *selling store's* address, not the customer's or delivery address.
- \`date\`: Parse the date/time stamp printed at the top of page 1 (e.g., \`4/21/2026, 3:05 PM MST\`) → output as \`YYYY-MM-DD\`.
- \`time\`: Same stamp, converted to 24-hour \`HH:MM\` (drop timezone and seconds).

**Customer / order identifiers**
- \`customer_email\`: Email address listed under "Customer Information" (below phone number).
- \`receipt_number\`: Value of \`Receipt #\`. If it reads literally "TBD after payment is processed" or similar placeholder text, output \`null\`.
- \`order_number\`: Value of \`Order #\` (e.g., \`H0481-338198\`).
- \`po_or_job\`: Value of \`PO / Job Name\` field (may wrap onto a second line — concatenate into one string).
- \`project_name\`: Value of \`Project Name\` field under Customer Information. If absent, \`null\`.

**Totals** (always found on the final summary page, right-hand box)
- \`subtotal\`: value labeled \`Subtotal\`.
- \`total_discount\`: value labeled \`Discounts\` — output as a **positive number** (strip the minus sign).
- \`total_tax\`: value labeled \`Sales Tax\`.
- \`total\`: value labeled \`Order Total\` (NOT "Balance Due" — Balance Due reflects remaining payment after partial charges and is not the receipt total).

================================================================================
LINE ITEM EXTRACTION RULES
================================================================================

1. **Scope**: Include every numbered row across all item tables on every page — this includes rows under plain "# Item Description" tables, rows under "Special Order Products" headers, and rows under "Regular Products" headers. Do not skip rows just because they continue onto the next page (long descriptions/QC codes may wrap across a page break — treat as one line item using the \`#\` shown).

2. **id**: Use the numeric value from the \`#\` column exactly as printed (as a string, e.g., \`"01"\`, \`"13"\`). If a row genuinely has no \`#\`, generate a UUID.

3. **title**: Use the core product description text only. Strip out:
   - Discount annotation lines (e.g., "PREFERRED PRICING $X OFF EACH", "DISCOUNT $X OFF EACH")
   - "Delivered by ..." lines
   - Duplicated description text that repeats after a pipe \`|\` separator (Home Depot often prints the same description twice, once truncated and once in full — use the fullest/cleanest version once, not both)
   - \`[QC:#########]\` quality-control codes

4. **sku_or_upc**: Value from the \`SKU #\` column.

5. **model**: Value from the \`Model #\` column. If printed as \`N/A\`, output \`null\`.

6. **unit_price**: Use the **final (post-discount) unit price** — i.e., the second price shown under the strikethrough original price (e.g., if \`$36.98 / each\` is struck through and \`$34.02 / each\` follows, use \`34.02\`). If no strikethrough/discount is present, use the single price shown. Strip units like "/ each", "/ box", "/ roll", "/ linear foot", "/ piece".

7. **quantity**: Value from \`Qty\` column, parsed as a number (strip "ft 0 in", commas, and unit suffixes — e.g., \`216 ft 0 in\` → \`216\`, \`1,176\` → \`1176\`).

8. **discount**: Total discount amount applied to the **entire line** (not per-unit). Compute as:
   \`(original_unit_price − final_unit_price) × quantity\`
   Cross-check against the sum of any "DISCOUNT $X OFF EACH" / "PREFERRED PRICING $X OFF EACH" annotations × quantity — these should reconcile. If no discount is shown, output \`0\`.

9. **total_price**: Value from the \`Subtotal\` column for that row.

10. **"Outside Delivery" rows**: These are legitimate line items (delivery fee waived to $0). Include them with \`title: "Outside Delivery"\`, \`unit_price: 0\`, \`total_price: 0\`, \`quantity: 1\`, and \`discount\` equal to the waived fee (typically \`79.00\`). \`sku_or_upc\` is usually \`515663\`; \`model\` is \`null\`/\`"N/A"\`. Set \`category\` to \`"Specialities"\` for these rows.

11. **Special Order sections**: Rows appear under a sub-header naming the vendor and a \`PO #\` (e.g., \`Kwikset   PO # 81531369\`, \`Capital Lumber\` with PO shown as part of the section, \`Woodcrafters Home Products   PO # 81531368\`). For **every line item under that vendor sub-header** (until the next sub-header or end of special-order block), set \`special_order_po\` to that PO number as a string (e.g., \`"81531369"\`). If a vendor section has no visible PO # printed, set \`special_order_po\` to the vendor name instead, or \`null\` if truly unavailable. For all non-special-order rows (plain "# Item Description" tables and "Regular Products" rows), \`special_order_po\` must be \`null\`.

12. Ignore delivery/pickup metadata blocks (Delivery Date, Delivery Address, Alternate Pickup Person, Pro Xtra statement, Payment Method history) — these are not line items and are not represented elsewhere in the schema; do not fabricate fields for them.

13. **category**: Classify every line item into exactly one of the fixed categories listed in the CATEGORY CLASSIFICATION RULES section below, using the product title, SKU description, and vendor context. This field is required and must never be \`null\` or an empty string — if a product doesn't cleanly fit any specific category, default to \`"Specialities"\`.

================================================================================
CATEGORY CLASSIFICATION RULES
================================================================================

Assign each line item's \`category\` to exactly one of the following fixed values (case-sensitive, use exactly as written):

\`"Appliances"\`, \`"Cabinets"\`, \`"Concrete"\`, \`"CounterTops"\`, \`"Drywall"\`, \`"Electrical"\`, \`"Finish Trim"\`, \`"Flooring"\`, \`"Framing-Panels"\`, \`"Framing-Trusses"\`, \`"Framing-Lumber"\`, \`"Furniture/Fixtures"\`, \`"Garage"\`, \`"Landscaping"\`, \`"HVAC"\`, \`"Insulation"\`, \`"Masonry"\`, \`"Painting"\`, \`"Plumbing"\`, \`"Roofing"\`, \`"Stucco"\`, \`"Specialities"\`, \`"Windows"\`

**Category definitions and typical examples:**

- **Appliances** — Refrigerators, ranges/ovens, cooktops, dishwashers, microwaves, range hoods, washers, dryers, garbage disposals, wine coolers.
- **Cabinets** — Kitchen/bath cabinets, cabinet boxes, vanities (cabinet portion only), cabinet hardware (hinges, pulls, knobs, drawer slides) when sold as part of a cabinetry line.
- **Concrete** — Ready-mix/bagged concrete, cement, rebar, wire mesh, concrete forms, footings, concrete anchors/bolts, expansion joint material, concrete sealers/curing compounds.
- **CounterTops** — Countertop slabs/sheets (laminate, quartz, granite, butcher block), countertop brackets/supports, edge banding, sink cutout kits for countertops.
- **Drywall** — Drywall/gypsum board sheets, joint compound ("mud"), joint tape, corner bead, drywall screws, drywall repair patches.
- **Electrical** — Wire/cable, conduit, breakers, panels, outlets, switches, junction boxes, wire nuts, GFCI devices, low-voltage/data wiring, smoke/CO detectors, doorbells.
- **Finish Trim** — Baseboards, crown molding, door/window casing, chair rail, interior trim boards, trim nails, interior doors and door hardware (hinges, knobs, locksets for interior doors).
- **Flooring** — Tile (floor), hardwood, engineered wood, laminate flooring, vinyl plank/sheet flooring, carpet, flooring underlayment, transition strips, grout and thinset for floor tile.
- **Framing-Panels** — OSB, plywood sheathing, structural panels used for walls/roof decking, subfloor panels.
- **Framing-Trusses** — Roof trusses, floor trusses, engineered structural beams (LVL, glulam), I-joists.
- **Framing-Lumber** — Dimensional lumber (2x4, 2x6, 2x10, etc.), studs, joists, posts, framing connectors/hangers, framing nails/screws, house wrap/building paper used during framing stage.
- **Furniture/Fixtures** — Light fixtures/lamps (decorative, not electrical rough-in), mirrors, bathroom accessories (towel bars, TP holders), mailboxes, shelving units, closet systems, blinds/shades.
- **Garage** — Garage doors, garage door openers/hardware, garage storage systems, garage flooring coatings.
- **Landscaping** — Sod, mulch, soil, plants/trees, pavers (exterior hardscape), fencing, irrigation/sprinkler components, outdoor lighting (landscape), retaining wall block.
- **HVAC** — Furnaces, air conditioning units, ductwork, vents/registers, thermostats, refrigerant lines, exhaust/bath fans.
- **Insulation** — Batt/roll insulation, rigid foam board, spray foam, blown-in insulation, vapor barrier/poly sheeting, weatherstripping used for insulation purposes.
- **Masonry** — Brick, concrete block (CMU), stone veneer, mortar/mortar mix (non-structural-concrete), masonry ties, masonry sealers.
- **Painting** — Paint, primer, stain, brushes, rollers, painter's tape, drop cloths, caulk used for paint prep, spackle for paint touch-up.
- **Plumbing** — Pipes (PVC, copper, PEX), fittings, valves, faucets, toilets, sinks (plumbing fixtures), water heaters, sump pumps, water supply lines, drain components.
- **Roofing** — Shingles, roofing felt/underlayment, flashing, roof vents, gutters/downspouts, ridge caps, roofing nails/adhesive.
- **Stucco** — Stucco mix, lath/wire mesh for stucco, EIFS components, stucco trim/accessories.
- **Specialities** — Fasteners/hardware not specific to a single category (general screws, bolts, nails not tied to framing/roofing), tools, ladders, safety equipment (gloves, glasses, respirators), adhesives/sealants not tied to a specific trade, cleaning supplies, tarps, miscellaneous hardware, delivery fees, and anything that does not clearly match another category.
- **Windows** — Windows, window screens, window hardware/locks, window flashing kits sold with the window.

**Tie-breaker guidance for ambiguous items:**
- Water heaters → \`"Plumbing"\` (not Appliances), unless clearly a standalone "tankless electric water heater appliance" bundle — default to Plumbing.
- Light fixtures (ceiling fans, recessed lights, vanity lights) → \`"Electrical"\` if sold as rough-in/functional lighting hardware; \`"Furniture/Fixtures"\` if clearly decorative/finish-stage (e.g., pendant lights, chandeliers, mirrors with lighting).
- Interior door hardware/locksets → \`"Finish Trim"\`; exterior door hardware/locksets → \`"Specialities"\` unless clearly part of a window/door special order (use vendor context, e.g., Kwikset PO sections are typically \`"Finish Trim"\` unless the item is explicitly a garage or exterior entry system, in which case use \`"Garage"\` or judge by description).
- Pavers/retaining wall block → \`"Landscaping"\` (not Masonry) when clearly used for outdoor hardscaping; use \`"Masonry"\` only for brick/block/stone used in structural or veneer wall construction.
- Caulk/adhesive/sealant → \`"Painting"\` if clearly paint-prep or finish-stage; \`"Specialities"\` if general-purpose construction adhesive/sealant with no clear trade association.
- Screws/nails/fasteners → categorize by their stated use context (e.g., "drywall screws" → Drywall, "roofing nails" → Roofing, "framing nails" → Framing-Lumber); if generic/unspecified → \`"Specialities"\`.
- When a Special Order vendor name strongly implies a category (e.g., "Woodcrafters Home Products" → likely \`"Cabinets"\` or \`"CounterTops"\`; "Capital Lumber" → likely \`"Framing-Lumber"\` or \`"Framing-Panels"\`), use that vendor context together with the item title to pick the best-fit category rather than defaulting to Specialities.
- If a single title reasonably fits two categories, choose the one representing the item's primary trade/use, not its material composition (e.g., a wood countertop support bracket → \`"CounterTops"\`, not \`"Framing-Lumber"\`).

Never leave \`category\` null. When genuinely uncertain after applying the above, use \`"Specialities"\` and flag the overall receipt as \`"needs_review"\` if this happens for a significant portion of high-value line items.

================================================================================
NUMBER & FORMAT PARSING RULES
================================================================================
- Strip all \`$\` and thousands-separator commas before converting to numbers (e.g., \`$44,719.78\` → \`44719.78\`).
- Negative totals (e.g., \`-$5,547.46\` for Discounts) should be output as their absolute value in \`total_discount\`.
- All monetary values are numbers with up to 2 decimal places, not strings.
- Dates: convert any \`M/D/YYYY\` format to \`YYYY-MM-DD\`.
- Times: convert \`H:MM AM/PM\` to 24-hour \`HH:MM\`, dropping timezone.

================================================================================
VALIDATION & STATUS
================================================================================
- Verify \`subtotal\` ≈ sum of all line item \`total_price\` values (small rounding differences are acceptable).
- Verify \`total\` ≈ \`subtotal − total_discount + total_tax\`.
- Verify every line item has a non-null \`category\` value drawn from the fixed list.
- Set \`overallStatus\`:
  - \`"success"\` — all key fields (order #, totals, all line items, categories) extracted cleanly and reconcile within rounding.
  - \`"needs_review"\` — minor ambiguities (e.g., a missing receipt number, an unreadable model/SKU, totals off by more than rounding, unclear special-order PO grouping, or multiple line items whose category assignment was uncertain and defaulted to \`"Specialities"\`).
  - \`"failed"\` — unable to extract core totals or line items reliably.
`;