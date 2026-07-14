// shared.ts
// Reusable prompt fragments shared between the image-array prompt and the
// multi-page-PDF prompt. Content-level rules (classification, field
// extraction, output schema) live here so both variants stay in sync;
// only input-mechanics (ordering/stitching, per-unit reporting) differ
// per prompt.

import { CATEGORY_UNION_TYPE_STRING } from "./category";

export const RECEIPT_TYPE_AND_STORE_RULES = `
Home Depot receipts come in (at least) two distinct printed formats. Classify the
WHOLE receipt (a single logical document, regardless of how many images or pages
it spans) into \`receipt_type\`:

- **'register'** — a POS/thermal-style receipt. Cues: a register/transaction/
  sequence number string near the top (e.g., "0478 00061 59297"), a "SALE" /
  "CASHIER <name>" line, "AUTH CODE" / "AUTH MODE - ISSUER", quantity and unit
  price shown in shorthand as "{qty}@{unit_price}" (e.g., "2@43.98"), amounts
  with a trailing single-letter tax code (e.g., "87.96N"), and a plain store
  address + phone number printed as the very first header lines (no "Location"
  label). Discount/"Preferred Pricing" lines on this format are typically
  applied AFTER the item lines and are already netted into the printed
  SUBTOTAL — do not attempt to reconcile this; just extract values as printed
  (see the field extraction rules for details).
- **'invoice'** — a structured order/invoice-style receipt. Cues: a literal
  header such as "Customer Receipt" or "Invoice", tabular columns (Item
  Description, Model #, SKU #, Unit Price, Qty, Subtotal), an "Order #", a
  "PO / Job Name", a "Location" field distinct from "Customer Information",
  possible "Special Order Products" / "Regular Products" section groupings
  (each optionally tied to a vendor name and "PO #"), shipment/logistics
  blocks ("Delivery", "Will Call", "Delivery Address", "Delivery Date",
  "Pickup Date") interspersed between items, and a summary box with explicit
  "Subtotal / Discounts / Sales Tax / Order Total / Balance Due" labels,
  usually on the final page.
- **'other'** — use when the content doesn't clearly match either pattern
  above, is too degraded to classify, or is a different/unrecognized
  layout. Do not force a guess between 'register' and 'invoice' if the cues
  are ambiguous or absent.

Also extract \`store\`: the address of the physical retail store location,
NOT the customer/billing address and NOT a delivery/jobsite address.
- On 'register' receipts, this is the address printed at the very top of the
  receipt (often paired with a phone number).
- On 'invoice' receipts, this is the address associated with "Store #" /
  "Location" / "Store Phone #" — explicitly do NOT use the "Customer
  Information" block, "Jobsite Address" block, or "Delivery Address" block,
  even though those may be more prominent or repeated more often.
- If no store-specific address is legibly present (only customer/delivery
  info is visible), set \`store\` to \`null\`. Do not guess or substitute the
  customer/delivery address.
`;

export const FIELD_EXTRACTION_RULES = `
Follow these field-level rules when populating the JSON:

- **Numbers** (unit_price, quantity, discount, total_price, total, total_discount,
  total_tax, subtotal): strip currency symbols and thousands separators; return
  as plain numbers (not strings). Discounts should be positive numbers
  representing the amount subtracted, never negative. If a value is not
  printed or not legible, use \`null\` — do not guess or compute a value that
  isn't actually shown, EXCEPT where explicitly stated below.

- **Shorthand quantity/price** ("register" format): if a line shows a combined
  "{qty}@{unit_price}" token (e.g., "2@43.98"), parse it as \`quantity = 2\` and
  \`unit_price = 43.98\`. Do not treat this token as part of \`title\` or
  \`sku_or_upc\`. Also strip trailing single-letter tax-code suffixes from
  printed amounts (e.g., "87.96N" → 87.96) before parsing as a number.

- **Quantities with a printed unit** (e.g., "216 ft 0 in" for linear-foot
  moulding, paired with a unit_price shown "per linear foot"/"each"): parse
  the numeric quantity in its primary printed unit as a decimal (convert any
  secondary unit into a fraction of the primary — e.g., "216 ft 6 in" →
  216.5), and set \`quantity_unit\` to the unit as printed (e.g., "linear
  foot", "each", "ft"). Leave \`quantity_unit\` as \`null\` when no unit is
  printed (the common case — plain integer quantities).

- **Per-item discount attribution** — two distinct patterns appear on Home
  Depot receipts; apply whichever matches:
  1. **Unambiguous, single-item discount (common on 'invoice'-format
     receipts):** an item's price block shows a struck-through original
     unit price immediately followed by a lower active unit price, and one
     or more annotation lines directly beneath it (e.g., "DISCOUNT $X.XX OFF
     EACH", "PREFERRED PRICING $X.XX OFF EACH") before the next numbered
     item begins. Multiple such annotation lines may stack under the same
     item. In this case the attribution is unambiguous:
       - \`unit_price\` = the active (lower, non-struck-through) unit price.
       - \`discount\` = (struck-through original unit price − active unit
         price) × \`quantity\`. If the original struck-through price isn't
         legible, instead sum all "$X.XX OFF EACH" amounts for that item and
         multiply by \`quantity\`.
       - \`total_price\` = active unit price × \`quantity\` (this should match
         the printed line "Subtotal"/total column — prefer the printed value
         if it disagrees with the computed one, and flag
         \`low_confidence_extraction\` on the affected page/image).
  2. **Ambiguous, section-level discount (common on 'register'-format
     receipts):** a discount/"Preferred Pricing" line follows multiple items
     or a section header (e.g., "Pro Xtra Preferred Pricing") without a
     clear 1:1 mapping to one item. In this case, leave the affected line
     items' \`discount\` as \`null\`, fold that amount into the receipt-level
     \`total_discount\` instead, and flag \`low_confidence_extraction\` on the
     relevant image/page with an explanatory \`message\`.
  Only use pattern 1 when the mapping to a single item is visually
  unambiguous (the annotation line(s) sit directly under one item, before
  the next item number/description starts). When in doubt, prefer pattern 2.

- **Vendor / PO grouping** ("invoice" format): a "Special Order Products"
  section is typically introduced by a line starting with a small box icon
  (📦) followed by a vendor name and, often, a PO number (e.g., "📦 Kwikset
  PO # 81531369", "📦 Woodcrafters Home Products PO # 81531368"). Treat this
  box-icon line as the section's header — NOT as a line item — and capture
  its vendor name and PO number into \`vendor\`/\`po_number\` for every item
  printed beneath it, until the next section header, a change of vendor, or
  the end of the receipt. Items under a plain "Regular Products" header, or
  under no section header at all, get \`vendor: null, po_number: null\`.

- **Strip redundant "S/O {Vendor}" tokens from titles**: within a Special
  Order Products section, an item's printed title may itself repeat the
  vendor as a leading "S/O {Vendor}" token — shorthand for "Special Order
  <Vendor>" (e.g., a title printed as "S/O Kwikset (CP) 690 Balboa Entry
  Door Knob and Single Cylinder Deadbolt Combo Pack..."). Since the vendor
  is already captured separately in the \`vendor\` field, remove this
  "S/O {Vendor}" token from \`title\` rather than leaving it embedded in the
  product description. Apply this only when:
    - the token appears as a clearly-delimited segment of the title (most
      often a leading prefix) matching the pattern "S/O" immediately
      followed by a vendor name, and
    - the vendor named matches (or closely matches) the vendor already
      established for that item from the section's box-icon header.
  After stripping the token, trim any leftover leading punctuation or
  whitespace (e.g., a stray "-", ":", or double space) so \`title\` reads as
  a clean product description. If no such token is present, leave \`title\`
  unchanged — never strip an unrelated occurrence of the substring "S/O"
  that doesn't match this vendor-prefix pattern.

- **Non-item content to ignore** — do not extract these as line items and do
  not let them affect totals or field values:
  - Non-informational sub-lines that are not separate line items (e.g.,
    "MAX REFUND VALUE $70.36/2" on register receipts).
  - Shipment/fulfillment logistics blocks interspersed between items on
    invoice-format receipts (e.g., "Delivery", "Will Call", "Delivery
    Address", "Delivery Options", "Delivery Date", "Pickup Date", "Estimated
    Arrival", "Alternate Pickup Person"). These describe how/when
    surrounding items will be fulfilled, not a purchasable item.
  - Repeated page/header branding (store name, "Store #", "Location", sales
    person, date/time, page-number footer) reprinted at the top or bottom of
    every page/image of the same receipt — extract each such field only
    once for the whole receipt, not once per page/image.
  - A line item whose price nets to zero because a discount fully offsets it
    (e.g., an "Outside Delivery" fee shown as "$79.00 / each" struck through
    down to "$0.00 / each") is still a legitimate line item and SHOULD be
    included in \`line_items\` with \`total_price: 0\` — do not silently drop
    it, since doing so would break the printed item-number sequence.

- **Placeholder / non-values**: if a field's printed value is a known
  placeholder rather than a real identifier or amount (e.g., "TBD", "TBD
  after payment is processed", "Pending", or "N/A" used in a column to mean
  "not applicable"), set that field to \`null\` rather than extracting the
  placeholder text literally.

- **date**: normalize to ISO 8601 date-only format \`YYYY-MM-DD\`. If only
  partial date info is visible (e.g., year missing), return \`null\`.

- **time**: normalize to 24-hour \`HH:MM\` (zero-padded, no seconds, no
  timezone suffix — e.g., "3:05 PM MST" → "15:05"). If no time is printed,
  or only a partial/ambiguous time is visible, return \`null\`. Extract
  \`date\` and \`time\` independently — do not infer one from the other.

- **sku_or_upc**: the "SKU #" column value, returned exactly as printed
  (preserve leading zeros, dashes, etc.) as a string; \`null\` if printed as
  "N/A" or not present.

- **model** (per line item): the "Model #" column value, preserved exactly
  as printed as a string. Apply the placeholder rule above — a printed
  "N/A" in this column means \`null\`, not the literal text "N/A". This is
  distinct from \`sku_or_upc\` — extract both independently when both
  columns are present.

- **title**: the product/service description as printed, after applying the
  "S/O {Vendor}" stripping rule above. Do not otherwise translate or "clean
  up" beyond trimming whitespace and joining text that was only split
  because it wrapped across a line, column, or page boundary.

- **category** (per line item): classify using the dedicated category
  classification rules (see Step 5). Unlike other fields, \`category\` must
  NEVER be \`null\` — fall back to \`"Specialties"\` per that step's guidance
  rather than guessing a more specific category or leaving it empty.

- **store_number**: the store's own numeric identifier as printed next to a
  "Store #" label (e.g., "Store # 0481" → "0481"). Preserve exactly as
  printed (including leading zeros) as a string. This is distinct from
  \`receipt_number\`/\`order_number\` (transaction identifiers) and from
  \`store\` (the physical address) — do not conflate them. \`null\` if no
  "Store #" is legible.

- **receipt_number** / **order_number**: these are frequently distinct
  identifiers on invoice-format receipts (e.g., a "Receipt #" that may read
  "TBD after payment is processed" alongside an always-present "Order #").
  Extract each independently into its own field; apply the placeholder rule
  above to either one individually — a placeholder \`receipt_number\` does
  not mean \`order_number\` should also be nulled, and vice versa. On
  register-format receipts, there is typically only one such identifier;
  populate \`receipt_number\` with it and leave \`order_number\` as \`null\`
  unless a separate order number is also printed.

- **po_or_job**: the value of a "PO / Job Name" field when printed (invoice
  format only, e.g., "Angels Crossing 3 Bedroom Door Hardware"). \`null\` if
  not present (typical for register-format receipts). Do not confuse this
  with a Special Order line item's \`po_number\`, or with the receipt-level
  \`order_number\` — these are three independent identifiers.

- **email**: the email address printed in the "Customer Information" block,
  if present. Do not substitute a store/support email or any other email
  found elsewhere on the receipt. \`null\` if no customer email is legible.

- **id** (per line item): generate a random UUID v4-formatted string for each
  line item (unique per item, not tied to any printed value).

- Never fabricate a value that is not visibly present in at least one
  image/page. If uncertain, prefer \`null\` over a guess. This applies
  equally to \`receipt_type\` (prefer 'other' over forcing 'register' or
  'invoice'), \`store\`/\`store_number\` (prefer \`null\` over substituting an
  unrelated identifier or address), and \`vendor\`/\`po_number\`/\`po_or_job\`/
  \`order_number\`/\`email\`/\`model\` (prefer \`null\` over inventing a value
  that isn't clearly printed). The one deliberate exception is \`category\`,
  which must always be populated per its own rule (Step 5) even when
  uncertain.

- It IS acceptable to compute \`total_price\` for a line item from
  \`unit_price × quantity − discount\` if the components are clearly legible
  and the printed total is missing or unreadable — but if you do this, treat
  that field's confidence as no higher than "medium" and flag
  \`low_confidence_extraction\` on the corresponding image/page.

- Payment method / tender information is NOT required — do not extract it,
  and do not add any payment-related field to the output.
`;

// Deliberately left "open" (no closing brace) — each prompt appends its own
// *_results section immediately after \`line_items\`, then closes the object.
export const HEADER_AND_LINE_ITEM_SCHEMA = `{
  "supplier": string | null,
  "receipt_type": "register" | "invoice" | "other",
  "store": string | null,
  "store_number": string | null,
  "receipt_number": string | null,
  "order_number": string | null,
  "po_or_job": string | null,
  "date": string | null,
  "time": string | null,
  "email": string | null,
  "total": number | null,
  "total_discount": number | null,
  "total_tax": number | null,
  "subtotal": number | null,
  "line_items": [
    {
      "id": string,
      "sku_or_upc": string | null,
      "model": string | null,
      "title": string | null,
      "vendor": string | null,
      "po_number": string | null,
      "category": ${CATEGORY_UNION_TYPE_STRING},
      "unit_price": number | null,
      "quantity": number | null,
      "quantity_unit": string | null,
      "discount": number | null,
      "total_price": number | null
    }
  ]`;

export const STRICT_JSON_OUTPUT_RULES_COMMON = `- Output must be valid JSON — no comments, no trailing commas, no markdown code
  fences, no extra keys, no explanatory text before or after the JSON.
- Every key defined above must be present, even if its value is null or an
  empty array.`;