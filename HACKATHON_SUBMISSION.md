# Silent Recall

## 1. Problem

Precision Auto Parts cannot quickly answer which raw-material lot, machine, shift, and supplier were responsible for a given dispatch order. That delay is critical during defect traceback, containment, and customer recalls, especially when the system must work on a shop floor with unreliable connectivity.

## 2. Solution Overview

Silent Recall links `Supplier -> Raw Material Lot -> Production Batch (machine, shift, operator) -> QC Result -> Dispatch Order`. It supports backward trace from a dispatch order to its sources and forward trace from a source lot or batch to every affected shipment and client, enabling recall impact analysis.

## 3. Architecture & Key Design Decision

All operational data is stored client-side in the browser through IndexedDB, accessed with Dexie.js. The core application has zero network dependency: entry, trace lookups, seeded data, and QR tag rendering work fully offline by construction rather than depending on a complex sync engine. Trace lookups are local IndexedDB reads and resolve in under a millisecond in the demo, comfortably satisfying the `<30 second` requirement. A small mocked sync control demonstrates that synchronization is optional and never gates the core workflow.

## 4. Missing-Record Handling

Every reference field tolerates missing or broken links. The trace UI explicitly labels gaps as **Not recorded** instead of hiding them or throwing an error. This reflects real manufacturing data, where a missing QC result, supplier record, raw-material lot, or downstream batch must remain visible for audit and remediation.

## 5. Screens Built

- Backward Trace — `[SCREENSHOT]`
- Forward Trace — `[SCREENSHOT]`
- Dashboard — `[SCREENSHOT]`
- Data Entry + QR Codes — `[SCREENSHOT]`

## 6. Rule-Compliance Checklist

| Brief rule | How Silent Recall satisfies it |
|---|---|
| Works offline on the shop floor | Core writes and reads use local IndexedDB; no network request is required. |
| Trace results within 30 seconds | Trace paths are local reads; demo resolutions complete in under 1 ms. |
| Supports defect traceback and recalls | Backward and forward trace screens expose source responsibility and affected shipments. |
| Use QR only; no RFID hardware | Each created record receives a printable QR tag encoding its record ID. |
| Handle incomplete real-world records | Broken references remain visible as **Not recorded** throughout trace and dashboard views. |

## 7. Links

- GitHub repository: `[GITHUB REPO URL]`
- Live deployment: `[LIVE DEPLOYMENT URL]`
