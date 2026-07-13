# Habitat Tucson Receipt Review

Pass tokens and model to the getReceipts api, update the endpoint to accept them.


## Todo
Move HomeDepotReceipt into field route, make default route field
-- uplevel to include the changes to the ReceiptAnalaysis type.
-- detect if on desktop app and then switch to a desktop UI version that allows pdf upload. 
-- Change order of the steps: 1) capture, 2) categorize and add meta data, 3) Review/edit receipt for upload


Combine both field and finance into this one SWA using different routes
-- Figure out how to do a lazy load of FieldApp and FinanceApp
-- Step2Capture & Step3Review, I put a hardcode"!" need to add undefined logic: data.image_results.imageResults!.find

New functionality, finance route:
-- Replace Line Items with a table like "Cabinets for Angel's crossing", "GL Account", "Unit Price", "Amount", Job -> "AC01,CABINET" (I'm guessing this is Angels Crossing Lot1 with a phase of CABINET )
-- Is there a Sage Reference #? Or is just the Invoice Number? 

Add a credit card statement reconciliation route

## Change Log

### Base Route, added base route to App.tsx and moved app specific routes down to the app.
App.tsx

### Navigation, added baseRoute for nested routes
registry.tsx, Navigation.tsx (backwards compatible)