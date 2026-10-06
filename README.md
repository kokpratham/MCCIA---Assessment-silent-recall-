# Silent Recall Traceability

An offline-first Next.js 14 App Router demo for auto-parts traceability. All core data lives in Dexie.js over IndexedDB, so the app can create records, trace relationships, and render QR tags without depending on a network round trip.

## Data Model

The app stores these records locally:

- `Supplier { id, name, contactInfo }`
- `RawMaterialLot { id, lotNumber, supplierId, materialType, receivedDate, quantity }`
- `Machine { id, name, productionLine }`
- `Shift { id, name }`
- `ProductionBatch { id, batchNumber, rawMaterialLotIds, machineId, shiftId, operatorName, startTime, endTime, unitsProduced }`
- `QCResult { id, batchId, inspectorName, result, defects, inspectionDate }`
- `DispatchOrder { id, orderNumber, batchIds, clientName, dispatchDate, quantity, destination }`

Reference fields are intentionally permissive. A `supplierId`, `batchId`, `machineId`, `shiftId`, or array of linked IDs can be missing or can point to a record that does not exist yet. That is intentional so the app can demonstrate trace gaps.

## Offline-First Architecture

The app uses Dexie.js as a thin wrapper over IndexedDB:

- entry forms write directly to the local database
- trace screens read directly from the local database
- QR tag pages render from the record ID already stored locally
- the sync badge is mocked and does not gate any user action

Because the data path is browser-local, the app keeps working offline. The seeded demo data is loaded on first use, and new entries are written locally immediately. A small persistent badge in the header shows `Online` or `Offline`, along with how many changes are stored locally.

`Sync Now` is only a demo control. When the browser is online it briefly shows a syncing state and then clears the local pending count. No user flow depends on sync success.

## Missing-Link Handling

Traceability gaps are shown instead of hidden:

- Backward trace shows missing dispatch orders, batches, lots, suppliers, machines, shifts, and QC results as `Not recorded`
- Forward trace shows missing source lots, missing suppliers, and missing downstream links as `Not recorded`
- Dashboard completeness marks each batch as `green`, `yellow`, or `red` based on whether the chain is fully linked, partially linked, or broken
- Debug tables dump all seeded records so gaps can be verified directly

## QR Only Tags

Created records go to a printable tag view that renders a QR code with the record ID only. This satisfies the `QR only, no RFID hardware` constraint. The tag page is print-friendly and can be used as a simple shop-floor label.

## Language Toggle

The top navigation includes an EN/MR toggle backed by a small dictionary object. It switches visible labels on the shared nav, main screen titles, and form/button text without introducing a full i18n library.

## Routes

- `/` home
- `/debug` seeded tables
- `/dashboard` traceability summary
- `/trace/backward` reverse trace from dispatch order to supplier
- `/trace/forward` forward trace from lot or batch to shipments
- `/entry/raw-material`
- `/entry/batch`
- `/entry/qc`
- `/entry/dispatch`
- `/tag/[entity]/[id]` printable QR tag view

## Run Locally

```bash
npm install
npm run dev
```

Open the local dev server in the browser, then use the nav links to move between entry, trace, dashboard, and debug screens.
