import Dexie, { type Table } from "dexie";

export type QCResultStatus = "Pass" | "Fail" | "Partial";

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string;
}

export interface RawMaterialLot {
  id: string;
  lotNumber: string;
  supplierId?: string;
  materialType: string;
  receivedDate: string;
  quantity: number;
}

export interface Machine {
  id: string;
  name: string;
  productionLine: string;
}

export interface Shift {
  id: string;
  name: string;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  rawMaterialLotIds: string[];
  machineId?: string;
  shiftId?: string;
  operatorName: string;
  startTime: string;
  endTime: string;
  unitsProduced: number;
}

export interface QCResult {
  id: string;
  batchId?: string;
  inspectorName: string;
  result: QCResultStatus;
  defects: string[];
  inspectionDate: string;
}

export interface DispatchOrder {
  id: string;
  orderNumber: string;
  batchIds: string[];
  clientName: string;
  dispatchDate: string;
  quantity: number;
  destination: string;
}

class TraceabilityDatabase extends Dexie {
  suppliers!: Table<Supplier, string>;
  rawMaterialLots!: Table<RawMaterialLot, string>;
  machines!: Table<Machine, string>;
  shifts!: Table<Shift, string>;
  productionBatches!: Table<ProductionBatch, string>;
  qcResults!: Table<QCResult, string>;
  dispatchOrders!: Table<DispatchOrder, string>;

  constructor() {
    super("silent-recall-traceability");

    this.version(1).stores({
      suppliers: "id, name",
      rawMaterialLots: "id, lotNumber, supplierId, materialType, receivedDate, quantity",
      machines: "id, name, productionLine",
      shifts: "id, name",
      productionBatches:
        "id, batchNumber, machineId, shiftId, operatorName, startTime, endTime, unitsProduced, *rawMaterialLotIds",
      qcResults: "id, batchId, inspectorName, result, inspectionDate",
      dispatchOrders: "id, orderNumber, clientName, dispatchDate, quantity, *batchIds",
    });
  }
}

export const db = new TraceabilityDatabase();

export interface TraceabilitySnapshot {
  suppliers: Supplier[];
  rawMaterialLots: RawMaterialLot[];
  machines: Machine[];
  shifts: Shift[];
  productionBatches: ProductionBatch[];
  qcResults: QCResult[];
  dispatchOrders: DispatchOrder[];
}

export interface DispatchOrderLookupOption {
  id: string;
  orderNumber: string;
  label: string;
}

export interface ForwardTraceLookupOption {
  value: string;
  label: string;
}

export interface ResolvedDispatchOrderTrace {
  dispatchOrder: DispatchOrder | null;
}

export interface ResolvedForwardBatchTrace {
  batchId: string;
  productionBatch: ProductionBatch | null;
  dispatchOrders: ResolvedDispatchOrderTrace[];
}

export interface ForwardTraceResolution {
  requestedValue: string;
  matchedBy: "rawMaterialLotId" | "productionBatchId" | null;
  sourceLabel: string;
  sourceBatch: ProductionBatch | null;
  sourceRawMaterialLot: RawMaterialLot | null;
  downstreamBatches: ResolvedForwardBatchTrace[];
  dispatchOrders: DispatchOrder[];
}

export interface DashboardBatchStatus {
  batch: ProductionBatch;
  machine: Machine | null;
  shift: Shift | null;
  qcResult: QCResult | null;
  rawMaterialLots: RawMaterialLot[];
  dispatchOrders: DispatchOrder[];
  rawMaterialLotCount: number;
  dispatchOrderCount: number;
  completeness: "green" | "yellow" | "red";
}

export interface DashboardSnapshot {
  totalBatches: number;
  fullyTraceableCount: number;
  qcPassCount: number;
  qcResultCount: number;
  totalUnitsDispatched: number;
  batchStatuses: DashboardBatchStatus[];
}

export interface ResolvedSupplierTrace {
  supplierId: string;
  supplier: Supplier | null;
}

export interface ResolvedRawMaterialLotTrace {
  lotId: string;
  rawMaterialLot: RawMaterialLot | null;
  supplier: ResolvedSupplierTrace;
}

export interface ResolvedBatchTrace {
  batchId: string;
  productionBatch: ProductionBatch | null;
  machine: Machine | null;
  shift: Shift | null;
  qcResult: QCResult | null;
  rawMaterialLots: ResolvedRawMaterialLotTrace[];
}

export interface BackwardTraceResolution {
  requestedValue: string;
  matchedBy: "id" | "orderNumber" | null;
  dispatchOrder: DispatchOrder | null;
  batches: ResolvedBatchTrace[];
}

function createRecordId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function createRawMaterialLot(input: Omit<RawMaterialLot, "id">) {
  const record: RawMaterialLot = { id: createRecordId("raw-lot"), ...input };
  await db.rawMaterialLots.add(record);
  return record;
}

export async function createProductionBatch(input: Omit<ProductionBatch, "id">) {
  const record: ProductionBatch = { id: createRecordId("batch"), ...input };
  await db.productionBatches.add(record);
  return record;
}

export async function createQCResult(input: Omit<QCResult, "id">) {
  const record: QCResult = { id: createRecordId("qc"), ...input };
  await db.qcResults.add(record);
  return record;
}

export async function createDispatchOrder(input: Omit<DispatchOrder, "id">) {
  const record: DispatchOrder = { id: createRecordId("dispatch"), ...input };
  await db.dispatchOrders.add(record);
  return record;
}

export async function createSupplier(input: Omit<Supplier, "id">) {
  const record: Supplier = { id: createRecordId("supplier"), ...input };
  await db.suppliers.add(record);
  return record;
}

export async function createMachine(input: Omit<Machine, "id">) {
  const record: Machine = { id: createRecordId("machine"), ...input };
  await db.machines.add(record);
  return record;
}

export async function createShift(input: Omit<Shift, "id">) {
  const record: Shift = { id: createRecordId("shift"), ...input };
  await db.shifts.add(record);
  return record;
}

const seedSuppliers: Supplier[] = [
  {
    id: "sup-aurora-steel",
    name: "Aurora Steel Supply",
    contactInfo: "Marta Chen | orders@aurorasteel.example | +1 (555) 210-1101",
  },
  {
    id: "sup-prairie-rubber",
    name: "Prairie Rubber Components",
    contactInfo: "Leon Brooks | accounts@prairierubber.example | +1 (555) 210-2202",
  },
  {
    id: "sup-precision-fasteners",
    name: "Precision Fasteners Co.",
    contactInfo: "Aisha Patel | sales@precisionfasteners.example | +1 (555) 210-3303",
  },
];

const seedRawMaterialLots: RawMaterialLot[] = [
  {
    id: "lot-steel-240901",
    lotNumber: "AST-240901-A",
    supplierId: "sup-aurora-steel",
    materialType: "Cold-rolled steel coil",
    receivedDate: "2026-09-01",
    quantity: 4200,
  },
  {
    id: "lot-steel-240915",
    lotNumber: "AST-240915-B",
    supplierId: "sup-aurora-steel",
    materialType: "Galvanized steel sheet",
    receivedDate: "2026-09-15",
    quantity: 3100,
  },
  {
    id: "lot-rubber-240904",
    lotNumber: "PRC-240904-A",
    supplierId: "sup-prairie-rubber",
    materialType: "Molded rubber seal stock",
    receivedDate: "2026-09-04",
    quantity: 1850,
  },
  {
    id: "lot-rubber-240918",
    lotNumber: "PRC-240918-B",
    supplierId: "sup-prairie-rubber",
    materialType: "Heat-resistant rubber compound",
    receivedDate: "2026-09-18",
    quantity: 1960,
  },
  {
    id: "lot-fastener-240902",
    lotNumber: "PFC-240902-A",
    supplierId: "sup-precision-fasteners",
    materialType: "M8 zinc-plated fasteners",
    receivedDate: "2026-09-02",
    quantity: 12500,
  },
  {
    id: "lot-fastener-240916",
    lotNumber: "PFC-240916-B",
    supplierId: "sup-precision-fasteners",
    materialType: "M10 locking fasteners",
    receivedDate: "2026-09-16",
    quantity: 9800,
  },
  {
    id: "lot-gasket-240919",
    lotNumber: "PRC-240919-C",
    supplierId: "sup-prairie-rubber",
    materialType: "Oil-resistant gasket blank",
    receivedDate: "2026-09-19",
    quantity: 1430,
  },
  {
    id: "lot-adhesive-240925",
    lotNumber: "AST-240925-C",
    supplierId: "sup-aurora-steel",
    materialType: "Structural adhesive cartridge batch",
    receivedDate: "2026-09-25",
    quantity: 620,
  },
  {
    id: "lot-fastener-240927",
    lotNumber: "PFC-240927-C",
    supplierId: "sup-precision-fasteners",
    materialType: "Torque-set studs",
    receivedDate: "2026-09-27",
    quantity: 7600,
  },
  {
    id: "lot-legacy-240930",
    lotNumber: "LEG-240930-Z",
    supplierId: "sup-legacy-unlisted",
    materialType: "Legacy blended subcomponent",
    receivedDate: "2026-09-30",
    quantity: 540,
  },
];

const seedMachines: Machine[] = [
  {
    id: "machine-stamping-01",
    name: "Press Line A",
    productionLine: "Chassis Stamping",
  },
  {
    id: "machine-assembly-02",
    name: "Assembly Cell B",
    productionLine: "Powertrain Assembly",
  },
];

const seedShifts: Shift[] = [
  { id: "shift-day", name: "Day Shift" },
  { id: "shift-swing", name: "Swing Shift" },
  { id: "shift-night", name: "Night Shift" },
];

const seedProductionBatches: ProductionBatch[] = [
  {
    id: "batch-001",
    batchNumber: "PB-26-0901-A",
    rawMaterialLotIds: ["lot-steel-240901", "lot-fastener-240902"],
    machineId: "machine-stamping-01",
    shiftId: "shift-day",
    operatorName: "Rina Patel",
    startTime: "2026-09-29T06:15:00Z",
    endTime: "2026-09-29T09:05:00Z",
    unitsProduced: 420,
  },
  {
    id: "batch-002",
    batchNumber: "PB-26-0904-B",
    rawMaterialLotIds: ["lot-rubber-240904", "lot-gasket-240919"],
    machineId: "machine-assembly-02",
    shiftId: "shift-swing",
    operatorName: "Diego Alvarez",
    startTime: "2026-09-29T14:30:00Z",
    endTime: "2026-09-29T18:10:00Z",
    unitsProduced: 365,
  },
  {
    id: "batch-003",
    batchNumber: "PB-26-0904-C",
    rawMaterialLotIds: ["lot-steel-240915", "lot-adhesive-240925"],
    machineId: "machine-stamping-01",
    shiftId: "shift-night",
    operatorName: "Mei Lin",
    startTime: "2026-09-30T00:20:00Z",
    endTime: "2026-09-30T03:50:00Z",
    unitsProduced: 275,
  },
  {
    id: "batch-004",
    batchNumber: "PB-26-0905-A",
    rawMaterialLotIds: ["lot-fastener-240916", "lot-rubber-240918"],
    machineId: "machine-assembly-02",
    shiftId: "shift-day",
    operatorName: "Owen Brooks",
    startTime: "2026-09-30T08:00:00Z",
    endTime: "2026-09-30T11:25:00Z",
    unitsProduced: 510,
  },
  {
    id: "batch-005",
    batchNumber: "PB-26-0905-B",
    rawMaterialLotIds: ["lot-fastener-240927"],
    machineId: "machine-stamping-01",
    shiftId: "shift-swing",
    operatorName: "Nadia Hassan",
    startTime: "2026-09-30T15:10:00Z",
    endTime: "2026-09-30T18:40:00Z",
    unitsProduced: 610,
  },
  {
    id: "batch-006",
    batchNumber: "PB-26-0906-A",
    rawMaterialLotIds: ["lot-legacy-240930", "lot-fastener-240916"],
    machineId: "machine-assembly-02",
    shiftId: "shift-night",
    operatorName: "Jamal Reed",
    startTime: "2026-10-01T00:05:00Z",
    endTime: "2026-10-01T03:15:00Z",
    unitsProduced: 290,
  },
  {
    id: "batch-007",
    batchNumber: "PB-26-0906-B",
    rawMaterialLotIds: ["lot-steel-240901", "lot-rubber-240918"],
    machineId: "machine-stamping-01",
    shiftId: "shift-day",
    operatorName: "Tessa Morgan",
    startTime: "2026-10-01T07:00:00Z",
    endTime: "2026-10-01T10:35:00Z",
    unitsProduced: 455,
  },
  {
    id: "batch-008",
    batchNumber: "PB-26-0906-C",
    rawMaterialLotIds: ["lot-missing-777", "lot-fastener-240927"],
    machineId: "machine-assembly-02",
    shiftId: "shift-swing",
    operatorName: "Luis Moreno",
    startTime: "2026-10-01T15:45:00Z",
    endTime: "2026-10-01T19:00:00Z",
    unitsProduced: 240,
  },
];

const seedQCResults: QCResult[] = [
  {
    id: "qc-001",
    batchId: "batch-001",
    inspectorName: "Hannah Cole",
    result: "Pass",
    defects: [],
    inspectionDate: "2026-09-29T10:20:00Z",
  },
  {
    id: "qc-002",
    batchId: "batch-002",
    inspectorName: "Hannah Cole",
    result: "Partial",
    defects: ["Seal compression out of tolerance on 4 units"],
    inspectionDate: "2026-09-29T19:20:00Z",
  },
  {
    id: "qc-003",
    batchId: "batch-003",
    inspectorName: "Victor Shah",
    result: "Pass",
    defects: [],
    inspectionDate: "2026-09-30T05:00:00Z",
  },
  {
    id: "qc-004",
    batchId: "batch-004",
    inspectorName: "Victor Shah",
    result: "Fail",
    defects: ["Thread torque out of spec", "Surface scratches on 9 assemblies"],
    inspectionDate: "2026-09-30T12:05:00Z",
  },
  {
    id: "qc-005",
    batchId: "batch-005",
    inspectorName: "Lena Ortiz",
    result: "Pass",
    defects: [],
    inspectionDate: "2026-09-30T20:15:00Z",
  },
  {
    id: "qc-006",
    batchId: "batch-006",
    inspectorName: "Lena Ortiz",
    result: "Partial",
    defects: ["One weld seam inconsistency"],
    inspectionDate: "2026-10-01T04:10:00Z",
  },
  {
    id: "qc-007",
    batchId: "batch-007",
    inspectorName: "Marcus Lee",
    result: "Pass",
    defects: [],
    inspectionDate: "2026-10-01T11:05:00Z",
  },
];

const seedDispatchOrders: DispatchOrder[] = [
  {
    id: "order-001",
    orderNumber: "DO-260901-01",
    batchIds: ["batch-001"],
    clientName: "Northstar Auto",
    dispatchDate: "2026-09-30",
    quantity: 420,
    destination: "Detroit, MI",
  },
  {
    id: "order-002",
    orderNumber: "DO-260902-02",
    batchIds: ["batch-002", "batch-003"],
    clientName: "Summit Fleet Service",
    dispatchDate: "2026-10-01",
    quantity: 640,
    destination: "Columbus, OH",
  },
  {
    id: "order-003",
    orderNumber: "DO-260903-03",
    batchIds: ["batch-004"],
    clientName: "Metro Parts Wholesale",
    dispatchDate: "2026-10-01",
    quantity: 510,
    destination: "Indianapolis, IN",
  },
  {
    id: "order-004",
    orderNumber: "DO-260904-04",
    batchIds: ["batch-005", "batch-006"],
    clientName: "GreenRoad Motors",
    dispatchDate: "2026-10-02",
    quantity: 900,
    destination: "Louisville, KY",
  },
  {
    id: "order-005",
    orderNumber: "DO-260905-05",
    batchIds: ["batch-007"],
    clientName: "Harbor EV Service",
    dispatchDate: "2026-10-02",
    quantity: 455,
    destination: "Buffalo, NY",
  },
  {
    id: "order-006",
    orderNumber: "DO-260906-06",
    batchIds: ["batch-008", "batch-ghost-404"],
    clientName: "Atlas Dealership Group",
    dispatchDate: "2026-10-03",
    quantity: 240,
    destination: "Pittsburgh, PA",
  },
];

let seedPromise: Promise<void> | null = null;

export async function seedDemoData() {
  if (!seedPromise) {
    seedPromise = (async () => {
      await db.open();

      const existingSupplier = await db.suppliers.get(seedSuppliers[0].id);
      if (existingSupplier) {
        return;
      }

      await db.transaction(
        "rw",
        [
          db.suppliers,
          db.rawMaterialLots,
          db.machines,
          db.shifts,
          db.productionBatches,
          db.qcResults,
          db.dispatchOrders,
        ],
        async () => {
          await db.suppliers.bulkAdd(seedSuppliers);
          await db.rawMaterialLots.bulkAdd(seedRawMaterialLots);
          await db.machines.bulkAdd(seedMachines);
          await db.shifts.bulkAdd(seedShifts);
          await db.productionBatches.bulkAdd(seedProductionBatches);
          await db.qcResults.bulkAdd(seedQCResults);
          await db.dispatchOrders.bulkAdd(seedDispatchOrders);
        },
      );
    })();
  }

  try {
    await seedPromise;
  } finally {
    seedPromise = null;
  }
}

export async function loadTraceabilitySnapshot(): Promise<TraceabilitySnapshot> {
  await db.open();

  const [suppliers, rawMaterialLots, machines, shifts, productionBatches, qcResults, dispatchOrders] =
    await Promise.all([
      db.suppliers.toArray(),
      db.rawMaterialLots.toArray(),
      db.machines.toArray(),
      db.shifts.toArray(),
      db.productionBatches.toArray(),
      db.qcResults.toArray(),
      db.dispatchOrders.toArray(),
    ]);

  return {
    suppliers,
    rawMaterialLots,
    machines,
    shifts,
    productionBatches,
    qcResults,
    dispatchOrders,
  };
}

export function getDispatchOrderLookupOptions(snapshot: TraceabilitySnapshot) {
  return snapshot.dispatchOrders
    .map((dispatchOrder) => ({
      id: dispatchOrder.id,
      orderNumber: dispatchOrder.orderNumber,
      label: `${dispatchOrder.orderNumber} - ${dispatchOrder.clientName} (${dispatchOrder.id})`,
    }))
    .sort((left, right) => left.orderNumber.localeCompare(right.orderNumber));
}

export function getForwardTraceLookupOptions(snapshot: TraceabilitySnapshot) {
  const rawMaterialLotOptions = snapshot.rawMaterialLots.map((lot) => ({
    value: lot.id,
    label: `Raw lot: ${lot.lotNumber} (${lot.id})`,
  }));

  const productionBatchOptions = snapshot.productionBatches.map((batch) => ({
    value: batch.id,
    label: `Batch: ${batch.batchNumber} (${batch.id})`,
  }));

  return [...rawMaterialLotOptions, ...productionBatchOptions].sort((left, right) => left.label.localeCompare(right.label));
}

export function resolveForwardTraceFromSnapshot(
  snapshot: TraceabilitySnapshot,
  requestedValue: string,
): ForwardTraceResolution | null {
  const normalizedValue = requestedValue.trim();

  if (!normalizedValue) {
    return null;
  }

  const rawMaterialLotsById = new Map(snapshot.rawMaterialLots.map((lot) => [lot.id, lot]));
  const batchesById = new Map(snapshot.productionBatches.map((batch) => [batch.id, batch]));
  const dispatchOrdersByBatchId = new Map<string, DispatchOrder[]>();

  for (const dispatchOrder of snapshot.dispatchOrders) {
    for (const batchId of dispatchOrder.batchIds) {
      const existingOrders = dispatchOrdersByBatchId.get(batchId) ?? [];
      existingOrders.push(dispatchOrder);
      dispatchOrdersByBatchId.set(batchId, existingOrders);
    }
  }

  const sourceRawMaterialLot = rawMaterialLotsById.get(normalizedValue) ?? null;
  const sourceBatch = !sourceRawMaterialLot ? batchesById.get(normalizedValue) ?? null : null;

  if (!sourceRawMaterialLot && !sourceBatch) {
    return null;
  }

  const matchedBy = sourceRawMaterialLot ? "rawMaterialLotId" : "productionBatchId";
  const sourceLabel = sourceRawMaterialLot
    ? `Raw lot ${sourceRawMaterialLot.lotNumber}`
    : `Batch ${sourceBatch?.batchNumber ?? normalizedValue}`;

  const downstreamBatchIds = sourceRawMaterialLot
    ? snapshot.productionBatches
        .filter((batch) => batch.rawMaterialLotIds.includes(sourceRawMaterialLot.id))
        .map((batch) => batch.id)
    : [normalizedValue];

  const downstreamBatches = downstreamBatchIds.map<ResolvedForwardBatchTrace>((batchId) => {
    const productionBatch = batchesById.get(batchId) ?? null;
    const dispatchOrders = dispatchOrdersByBatchId.get(batchId) ?? [];

    return {
      batchId,
      productionBatch,
      dispatchOrders: dispatchOrders.map((dispatchOrder) => ({ dispatchOrder })),
    };
  });

  const dispatchOrderMap = new Map<string, DispatchOrder>();

  for (const batch of downstreamBatches) {
    for (const entry of batch.dispatchOrders) {
      if (entry.dispatchOrder) {
        dispatchOrderMap.set(entry.dispatchOrder.id, entry.dispatchOrder);
      }
    }
  }

  const dispatchOrders = Array.from(dispatchOrderMap.values()).sort((left, right) =>
    left.dispatchDate.localeCompare(right.dispatchDate),
  );

  return {
    requestedValue: normalizedValue,
    matchedBy,
    sourceLabel,
    sourceBatch,
    sourceRawMaterialLot,
    downstreamBatches,
    dispatchOrders,
  };
}

export function calculateTraceabilityCompleteness(snapshot: TraceabilitySnapshot): DashboardSnapshot {
  const suppliersById = new Map(snapshot.suppliers.map((supplier) => [supplier.id, supplier]));
  const rawMaterialLotsById = new Map(snapshot.rawMaterialLots.map((lot) => [lot.id, lot]));
  const machinesById = new Map(snapshot.machines.map((machine) => [machine.id, machine]));
  const shiftsById = new Map(snapshot.shifts.map((shift) => [shift.id, shift]));
  const qcResultsByBatchId = new Map(
    snapshot.qcResults.filter((qcResult) => Boolean(qcResult.batchId)).map((qcResult) => [qcResult.batchId as string, qcResult]),
  );

  const dispatchOrdersByBatchId = new Map<string, DispatchOrder[]>();
  for (const dispatchOrder of snapshot.dispatchOrders) {
    for (const batchId of dispatchOrder.batchIds) {
      const existingOrders = dispatchOrdersByBatchId.get(batchId) ?? [];
      existingOrders.push(dispatchOrder);
      dispatchOrdersByBatchId.set(batchId, existingOrders);
    }
  }

  const batchStatuses = snapshot.productionBatches.map<DashboardBatchStatus>((batch) => {
    const machine = batch.machineId ? machinesById.get(batch.machineId) ?? null : null;
    const shift = batch.shiftId ? shiftsById.get(batch.shiftId) ?? null : null;
    const qcResult = qcResultsByBatchId.get(batch.id) ?? null;
    const rawMaterialLots = batch.rawMaterialLotIds
      .map((lotId) => rawMaterialLotsById.get(lotId) ?? null)
      .filter((lot): lot is RawMaterialLot => Boolean(lot));
    const dispatchOrders = dispatchOrdersByBatchId.get(batch.id) ?? [];

    const hasAllRawLots = batch.rawMaterialLotIds.length > 0 && rawMaterialLots.length === batch.rawMaterialLotIds.length;
    const hasAllSuppliers = rawMaterialLots.every((lot) => Boolean(lot.supplierId) && Boolean(suppliersById.get(lot.supplierId as string)));
    const hasMachine = Boolean(machine);
    const hasShift = Boolean(shift);
    const hasQc = Boolean(qcResult);
    const hasDispatch = dispatchOrders.length > 0;

    let completeness: DashboardBatchStatus["completeness"] = "yellow";

    if (hasMachine && hasShift && hasAllRawLots && hasAllSuppliers && hasQc && hasDispatch) {
      completeness = "green";
    } else if (!hasQc || !hasAllRawLots || !hasDispatch || !hasMachine || !hasShift) {
      completeness = "red";
    }

    return {
      batch,
      machine,
      shift,
      qcResult,
      rawMaterialLots,
      dispatchOrders,
      rawMaterialLotCount: rawMaterialLots.length,
      dispatchOrderCount: dispatchOrders.length,
      completeness,
    };
  });

  const fullyTraceableCount = batchStatuses.filter((status) => status.completeness === "green").length;
  const qcPassCount = snapshot.qcResults.filter((qcResult) => qcResult.result === "Pass").length;
  const qcResultCount = snapshot.qcResults.length;
  const totalUnitsDispatched = snapshot.dispatchOrders.reduce((total, dispatchOrder) => total + dispatchOrder.quantity, 0);

  return {
    totalBatches: snapshot.productionBatches.length,
    fullyTraceableCount,
    qcPassCount,
    qcResultCount,
    totalUnitsDispatched,
    batchStatuses,
  };
}

export function resolveBackwardTraceFromSnapshot(
  snapshot: TraceabilitySnapshot,
  requestedValue: string,
): BackwardTraceResolution | null {
  const normalizedValue = requestedValue.trim();

  if (!normalizedValue) {
    return null;
  }

  const suppliersById = new Map(snapshot.suppliers.map((supplier) => [supplier.id, supplier]));
  const rawMaterialLotsById = new Map(snapshot.rawMaterialLots.map((lot) => [lot.id, lot]));
  const machinesById = new Map(snapshot.machines.map((machine) => [machine.id, machine]));
  const shiftsById = new Map(snapshot.shifts.map((shift) => [shift.id, shift]));
  const batchesById = new Map(snapshot.productionBatches.map((batch) => [batch.id, batch]));
  const qcResultsByBatchId = new Map(
    snapshot.qcResults
      .filter((qcResult) => Boolean(qcResult.batchId))
      .map((qcResult) => [qcResult.batchId as string, qcResult]),
  );

  const dispatchOrder =
    snapshot.dispatchOrders.find((candidate) => candidate.id === normalizedValue) ??
    snapshot.dispatchOrders.find((candidate) => candidate.orderNumber === normalizedValue) ??
    null;

  if (!dispatchOrder) {
    return null;
  }

  const batches = dispatchOrder.batchIds.map<ResolvedBatchTrace>((batchId) => {
    const productionBatch = batchesById.get(batchId) ?? null;

    if (!productionBatch) {
      return {
        batchId,
        productionBatch: null,
        machine: null,
        shift: null,
        qcResult: null,
        rawMaterialLots: [],
      };
    }

    return {
      batchId,
      productionBatch,
      machine: productionBatch.machineId ? machinesById.get(productionBatch.machineId) ?? null : null,
      shift: productionBatch.shiftId ? shiftsById.get(productionBatch.shiftId) ?? null : null,
      qcResult: qcResultsByBatchId.get(productionBatch.id) ?? null,
      rawMaterialLots: productionBatch.rawMaterialLotIds.map((lotId) => {
        const rawMaterialLot = rawMaterialLotsById.get(lotId) ?? null;
        const supplier = rawMaterialLot?.supplierId ? suppliersById.get(rawMaterialLot.supplierId) ?? null : null;

        return {
          lotId,
          rawMaterialLot,
          supplier: {
            supplierId: rawMaterialLot?.supplierId ?? "",
            supplier,
          },
        };
      }),
    };
  });

  return {
    requestedValue: normalizedValue,
    matchedBy: dispatchOrder.id === normalizedValue ? "id" : "orderNumber",
    dispatchOrder,
    batches,
  };
}