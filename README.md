# Habitat Tucson Receipt Review

Pass tokens and model to the getReceipts api, update the endpoint to accept them.


## Todo

Combine both field and finance into this one SWA using different routes
-- Figure out how to do a lazy load of FieldApp and FinanceApp
-- Step2Capture & Step3Review, I put a hardcode"!" need to add undefined logic: data.image_results.imageResults!.find

New functionality, finance route:
-- Replace Line Items with a table like "Cabinets for Angel's crossing", "GL Account", "Unit Price", "Amount", Job -> "AC01,CABINET" (I'm guessing this is Angels Crossing Lot1 with a phase of CABINET )
-- Is there a Sage Reference #? Or is just the Invoice Number? 

New functionality, field route:

-- uplevel to include the changes to the ReceiptAnalaysis type.
-- detect if on desktop app and then switch to a desktop UI version that also allows pdf upload. 
-- Change order of the steps: 1) capture and analyze, 2) Revew/edit, categorize and add meta data, then upload
--- Step 1
---- If new pdf upload button is clicked then ensure that it contains extractable text and that it passes minor fidelity tests. If not then inform user and treat it as a base64 file. Use pdfjs-dist (more robust) or unpdf (lighter weight)
---- Use a new endpoint for extractable text, this endpoint will use Haiku for analysis.

--- Step 2
---- Top section containing receipt#, job#, po_or_job, total, total_tax (if not null or zero), date, indicator if total is not equal to sum of line_items.total_price + prorated tax.
---- Top section accordion to show other common receipt properties (subtotal, discount, user, email, ...)
---- middle section, a way to globally set the categoriation information
---- Bottom section, a table showing line_items: title, total_price, prorated tax if (don't display if total_tax is null or zero), category, and an empty job.
----- For each line item want to capture which lot or lots to allocate/distribute cost to, and adjust the AI category (phase) as needed. 


Add a credit card statement reconciliation route
-- Button to upload pdf with extractable text (see field above)
-- Locate all the field submitted receipts and reconcile them to the invoice# field from the uploaded statement. Compare receipt total with the Amount from the statement, if the same check mark icon in green, if different x icon in red and a note textarea that opens below the line to enter reconciliation information.Create a database entry for the statement with links to the receipts database elements. Click on the receipt total show the sage entry panel for that receipt.


## Change Log

### Base Route, added base route to App.tsx and moved app specific routes down to the app.
App.tsx

### Navigation, added baseRoute for nested routes
registry.tsx, Navigation.tsx (backwards compatible)