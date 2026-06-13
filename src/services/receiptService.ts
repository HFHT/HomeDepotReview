/**
 * @file STUB receipt service returning in-memory test data so the finance
 * review app runs end-to-end without a backend.
 *
 * @remarks
 * ⚠ Replace internals with calls to the real backend once these endpoints are
 * wired into `src/api`:
 *  - GET   /api/receipts?status=...
 *  - GET   /api/receipts/{id}
 *  - PATCH /api/receipts/{id}
 *  - POST  /api/receipts/{id}/status
 *  - POST  /api/receipts/{id}/sage
 */
import type { Receipt, ReviewStatus, SageEntryMetadata, AuditChange } from './receiptTypes';

/**
 * @file Test fixtures for the Receipt domain type.
 *
 * @remarks
 * Sample data intended for local development, Storybook, and unit tests.
 * Values are representative of Home Depot receipts processed by the
 * Claude-extraction pipeline.
 */

export const DB: Receipt[] = [
  {
    _id: 'rcpt_0001',
    created: { date: '2024-01-15T09:23:11.000Z', by: 'jdoe@field.example.com' },
    receiptDate: '2024-01-14',
    receiptNumber: '1042-00012345',
    receiptPO: 'PO-2024-0098',
    receiptTotal: 184.73,
    receiptSubtotal: 169.94,
    receiptDiscount: 0,
    receiptTax: 14.79,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '1042',
    paymentMethod: 'Visa ****4321',
    images: ['s3://receipts/rcpt_0001/front.jpg'],
    lineItems: [
      {
        description: '2x4x8 Premium Stud',
        quantity: 24,
        unitPrice: 4.28,
        total: 102.72,
        sku_or_upc: '0012345678905',
        category: 'Lumber',
      },
      {
        description: 'Wood Screws 3in (1lb box)',
        quantity: 2,
        unitPrice: 8.97,
        total: 17.94,
        sku_or_upc: '0098765432101',
        category: 'Fasteners',
      },
      {
        description: 'Construction Adhesive 10oz',
        quantity: 7,
        unitPrice: 7.04,
        total: 49.28,
        sku_or_upc: null,
        category: 'Adhesives',
      },
    ],
    auditTrail: [
      {
        fieldKey: 'receiptTotal',
        lineItemIndex: undefined,
        lineItemDescription: undefined,
        originalValue: '184.00',
        changedValue: '184.73',
        layer: 'Field',
        changedAt: '2024-01-15T09:25:00.000Z',
        changedBy: 'jdoe@field.example.com',
      },
    ],
    reviewStatus: 'entered_in_sage',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-01-15T09:23:11.000Z',
        changedBy: 'jdoe@field.example.com',
        reason: null,
      },
      {
        status: 'entered_in_sage',
        changedAt: '2024-01-16T14:02:00.000Z',
        changedBy: 'finance1@example.com',
        reason: null,
      },
    ],
    sageEntryMetadata: {
      sageReference: 'SAGE-INV-55012',
      postingDate: '2024-01-16',
      notes: 'Posted to job 2024-0098.',
    },
  },
  {
    _id: 'rcpt_0002',
    created: { date: '2024-02-03T16:40:55.000Z', by: 'msmith@field.example.com' },
    receiptDate: '2024-02-03',
    receiptNumber: '0876-00099812',
    receiptPO: null,
    receiptTotal: 56.18,
    receiptSubtotal: 51.97,
    receiptDiscount: 5.0,
    receiptTax: 4.21,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '0876',
    paymentMethod: 'Mastercard ****8899',
    images: [
      's3://receipts/rcpt_0002/front.jpg',
      's3://receipts/rcpt_0002/back.jpg',
    ],
    lineItems: [
      {
        description: 'LED Shop Light 4ft',
        quantity: 3,
        unitPrice: 18.99,
        total: 56.97,
        sku_or_upc: '0044556677889',
        category: 'Lighting',
      },
    ],
    auditTrail: [],
    reviewStatus: 'pending',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-02-03T16:40:55.000Z',
        changedBy: 'msmith@field.example.com',
        reason: null,
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: null,
    },
  },
  {
    _id: 'rcpt_0003',
    created: { date: '2024-02-20T11:05:00.000Z', by: 'awong@field.example.com' },
    receiptDate: '2024-02-19',
    receiptNumber: '2231-00045566',
    receiptPO: 'PO-2024-0145',
    receiptTotal: 412.55,
    receiptSubtotal: 381.02,
    receiptDiscount: 0,
    receiptTax: 31.53,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '2231',
    paymentMethod: 'Net 30 Account',
    images: ['s3://receipts/rcpt_0003/front.jpg'],
    lineItems: [
      {
        description: 'Concrete Mix 60lb',
        quantity: 30,
        unitPrice: 6.48,
        total: 194.4,
        sku_or_upc: '0011223344556',
        category: 'Concrete',
      },
      {
        description: 'Rebar #4 20ft',
        quantity: 18,
        unitPrice: 9.37,
        total: 168.66,
        sku_or_upc: '0066778899001',
        category: 'Concrete',
      },
      {
        description: 'Tie Wire 200ft',
        quantity: 2,
        unitPrice: 8.98,
        total: 17.96,
        sku_or_upc: null,
        category: 'Fasteners',
      },
    ],
    auditTrail: [
      {
        fieldKey: 'unitPrice',
        lineItemIndex: 1,
        lineItemDescription: 'Rebar #4 20ft',
        originalValue: '9.30',
        changedValue: '9.37',
        layer: 'Finance',
        changedAt: '2024-02-21T10:00:00.000Z',
        changedBy: 'finance2@example.com',
      },
    ],
    reviewStatus: 'in_review',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-02-20T11:05:00.000Z',
        changedBy: 'awong@field.example.com',
        reason: null,
      },
      {
        status: 'in_review',
        changedAt: '2024-02-21T09:45:00.000Z',
        changedBy: 'finance2@example.com',
        reason: 'Verifying rebar pricing against vendor sheet.',
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: 'Awaiting price confirmation.',
    },
  },
  {
    _id: 'rcpt_0004',
    created: { date: '2024-03-01T08:12:30.000Z', by: 'bnguyen@field.example.com' },
    receiptDate: '2024-03-01',
    receiptNumber: '1042-00012999',
    receiptPO: 'PO-2024-0160',
    receiptTotal: 27.39,
    receiptSubtotal: 25.36,
    receiptDiscount: 0,
    receiptTax: 2.03,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '1042',
    paymentMethod: 'Visa ****4321',
    images: ['s3://receipts/rcpt_0004/front.jpg'],
    lineItems: [
      {
        description: 'Painters Tape 1.88in',
        quantity: 4,
        unitPrice: 6.34,
        total: 25.36,
        sku_or_upc: '0022113344551',
        category: 'Paint Supplies',
      },
    ],
    auditTrail: [],
    reviewStatus: 'on_hold',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-03-01T08:12:30.000Z',
        changedBy: 'bnguyen@field.example.com',
        reason: null,
      },
      {
        status: 'on_hold',
        changedAt: '2024-03-02T13:20:00.000Z',
        changedBy: 'finance1@example.com',
        reason: 'Missing PO approval signature.',
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: 'Hold until PO approval received.',
    },
  },
  {
    _id: 'rcpt_0005',
    created: { date: '2024-03-11T19:55:42.000Z', by: 'jdoe@field.example.com' },
    receiptDate: '2024-03-11',
    receiptNumber: '3390-00078234',
    receiptPO: null,
    receiptTotal: 0,
    receiptSubtotal: 0,
    receiptDiscount: 0,
    receiptTax: 0,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '3390',
    images: ['s3://receipts/rcpt_0005/blurry.jpg'],
    lineItems: [],
    auditTrail: [],
    reviewStatus: 'rejected',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-03-11T19:55:42.000Z',
        changedBy: 'jdoe@field.example.com',
        reason: null,
      },
      {
        status: 'rejected',
        changedAt: '2024-03-12T08:30:00.000Z',
        changedBy: 'finance2@example.com',
        reason: 'Image unreadable; please re-scan.',
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: null,
    },
  },
  {
    _id: 'rcpt_0006',
    created: { date: '2024-03-22T07:18:09.000Z', by: 'awong@field.example.com' },
    receiptDate: '2024-03-21',
    receiptNumber: '0876-00100450',
    receiptPO: 'PO-2024-0177',
    receiptTotal: 233.61,
    receiptSubtotal: 215.94,
    receiptDiscount: 10.0,
    receiptTax: 17.67,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '0876',
    paymentMethod: 'Amex ****1007',
    images: ['s3://receipts/rcpt_0006/front.jpg'],
    lineItems: [
      {
        description: 'Cordless Drill 20V Kit',
        quantity: 1,
        unitPrice: 129.0,
        total: 129.0,
        sku_or_upc: '0055667788990',
        category: 'Power Tools',
      },
      {
        description: 'Drill Bit Set 21pc',
        quantity: 1,
        unitPrice: 24.97,
        total: 24.97,
        sku_or_upc: '0033445566778',
        category: 'Power Tool Accessories',
      },
      {
        description: 'Work Gloves Large',
        quantity: 6,
        unitPrice: 10.33,
        total: 61.98,
        sku_or_upc: null,
        category: 'Safety',
      },
    ],
    auditTrail: [
      {
        fieldKey: 'receiptDiscount',
        lineItemIndex: undefined,
        lineItemDescription: undefined,
        originalValue: '0.00',
        changedValue: '10.00',
        layer: 'Field',
        changedAt: '2024-03-22T07:20:00.000Z',
        changedBy: 'awong@field.example.com',
      },
      {
        fieldKey: 'category',
        lineItemIndex: 2,
        lineItemDescription: 'Work Gloves Large',
        originalValue: null,
        changedValue: 'Safety',
        layer: 'Finance',
        changedAt: '2024-03-23T11:11:00.000Z',
        changedBy: 'finance1@example.com',
      },
    ],
    reviewStatus: 'entered_in_sage',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-03-22T07:18:09.000Z',
        changedBy: 'awong@field.example.com',
        reason: null,
      },
      {
        status: 'in_review',
        changedAt: '2024-03-23T10:50:00.000Z',
        changedBy: 'finance1@example.com',
        reason: null,
      },
      {
        status: 'entered_in_sage',
        changedAt: '2024-03-23T11:15:00.000Z',
        changedBy: 'finance1@example.com',
        reason: null,
      },
    ],
    sageEntryMetadata: {
      sageReference: 'SAGE-INV-55190',
      postingDate: '2024-03-23',
      notes: 'Tool kit allocated to job 2024-0177.',
    },
  },
  {
    _id: 'rcpt_0007',
    created: { date: '2024-04-05T14:33:21.000Z', by: 'msmith@field.example.com' },
    receiptDate: '2024-04-05',
    receiptNumber: '2231-00046120',
    receiptPO: 'PO-2024-0190',
    receiptTotal: 98.42,
    receiptSubtotal: 91.13,
    receiptDiscount: 0,
    receiptTax: 7.29,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '2231',
    paymentMethod: 'Net 30 Account',
    images: ['s3://receipts/rcpt_0007/front.jpg'],
    lineItems: [
      {
        description: 'PVC Pipe 1in x 10ft',
        quantity: 10,
        unitPrice: 4.62,
        total: 46.2,
        sku_or_upc: '0077889900112',
        category: 'Plumbing',
      },
      {
        description: 'PVC Elbow 1in',
        quantity: 20,
        unitPrice: 0.89,
        total: 17.8,
        sku_or_upc: '0088990011223',
        category: 'Plumbing',
      },
      {
        description: 'PVC Cement 8oz',
        quantity: 3,
        unitPrice: 9.04,
        total: 27.12,
        sku_or_upc: null,
        category: 'Plumbing',
      },
    ],
    auditTrail: [],
    reviewStatus: 'in_review',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-04-05T14:33:21.000Z',
        changedBy: 'msmith@field.example.com',
        reason: null,
      },
      {
        status: 'in_review',
        changedAt: '2024-04-06T09:00:00.000Z',
        changedBy: 'finance2@example.com',
        reason: null,
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: null,
    },
  },
  {
    _id: 'rcpt_0008',
    created: { date: '2024-04-18T10:02:47.000Z', by: 'bnguyen@field.example.com' },
    receiptDate: '2024-04-17',
    receiptNumber: '1042-00013500',
    receiptPO: null,
    receiptTotal: 745.9,
    receiptSubtotal: 689.72,
    receiptDiscount: 0,
    receiptTax: 56.18,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '1042',
    paymentMethod: 'Visa ****4321',
    images: [
      's3://receipts/rcpt_0008/page1.jpg',
      's3://receipts/rcpt_0008/page2.jpg',
    ],
    lineItems: [
      {
        description: 'Plywood 3/4in 4x8 Sheet',
        quantity: 15,
        unitPrice: 42.98,
        total: 644.7,
        sku_or_upc: '0099001122334',
        category: 'Lumber',
      },
      {
        description: 'Wood Glue 16oz',
        quantity: 5,
        unitPrice: 9.0,
        total: 45.0,
        sku_or_upc: null,
        category: 'Adhesives',
      },
    ],
    auditTrail: [
      {
        fieldKey: 'quantity',
        lineItemIndex: 0,
        lineItemDescription: 'Plywood 3/4in 4x8 Sheet',
        originalValue: '14',
        changedValue: '15',
        layer: 'Field',
        changedAt: '2024-04-18T10:05:00.000Z',
        changedBy: 'bnguyen@field.example.com',
      },
    ],
    reviewStatus: 'pending',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-04-18T10:02:47.000Z',
        changedBy: 'bnguyen@field.example.com',
        reason: null,
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: null,
    },
  },
  {
    _id: 'rcpt_0009',
    created: { date: '2024-05-02T12:47:00.000Z', by: 'jdoe@field.example.com' },
    receiptDate: '2024-05-02',
    receiptNumber: '3390-00079001',
    receiptPO: 'PO-2024-0210',
    receiptTotal: 63.44,
    receiptSubtotal: 58.74,
    receiptDiscount: 0,
    receiptTax: 4.7,
    receiptBalanceDue: 12.0,
    vendor: 'The Home Depot',
    storeNumber: '3390',
    paymentMethod: 'Cash',
    images: ['s3://receipts/rcpt_0009/front.jpg'],
    lineItems: [
      {
        description: 'Caulk Gun',
        quantity: 2,
        unitPrice: 7.49,
        total: 14.98,
        sku_or_upc: '0010101010101',
        category: 'Tools',
      },
      {
        description: 'Silicone Sealant 10oz',
        quantity: 8,
        unitPrice: 5.47,
        total: 43.76,
        sku_or_upc: '0020202020202',
        category: 'Adhesives',
      },
    ],
    auditTrail: [
      {
        fieldKey: 'receiptBalanceDue',
        lineItemIndex: undefined,
        lineItemDescription: undefined,
        originalValue: '0.00',
        changedValue: '12.00',
        layer: 'Finance',
        changedAt: '2024-05-03T15:30:00.000Z',
        changedBy: 'finance1@example.com',
      },
    ],
    reviewStatus: 'on_hold',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-05-02T12:47:00.000Z',
        changedBy: 'jdoe@field.example.com',
        reason: null,
      },
      {
        status: 'on_hold',
        changedAt: '2024-05-03T15:32:00.000Z',
        changedBy: 'finance1@example.com',
        reason: 'Outstanding balance due of $12.00.',
      },
    ],
    sageEntryMetadata: {
      sageReference: null,
      postingDate: null,
      notes: 'Balance owed; do not post until settled.',
    },
  },
  {
    _id: 'rcpt_0010',
    created: { date: '2024-05-19T17:09:55.000Z', by: 'awong@field.example.com' },
    receiptDate: '2024-05-18',
    receiptNumber: '0876-00101998',
    receiptPO: 'PO-2024-0225',
    receiptTotal: 1289.07,
    receiptSubtotal: 1199.99,
    receiptDiscount: 50.0,
    receiptTax: 139.08,
    receiptBalanceDue: 0,
    vendor: 'The Home Depot',
    storeNumber: '0876',
    paymentMethod: 'Mastercard ****8899',
    images: ['s3://receipts/rcpt_0010/front.jpg'],
    lineItems: [
      {
        description: 'Tankless Water Heater',
        quantity: 1,
        unitPrice: 899.0,
        total: 899.0,
        sku_or_upc: '0030303030303',
        category: 'Plumbing',
      },
      {
        description: 'Water Heater Install Kit',
        quantity: 1,
        unitPrice: 89.99,
        total: 89.99,
        sku_or_upc: '0040404040404',
        category: 'Plumbing',
      },
      {
        description: 'Copper Pipe 3/4in 10ft',
        quantity: 12,
        unitPrice: 17.58,
        total: 211.0,
        sku_or_upc: '0050505050505',
        category: 'Plumbing',
      },
    ],
    auditTrail: [
      {
        fieldKey: 'description',
        lineItemIndex: 0,
        lineItemDescription: 'Tankless Water Heater',
        originalValue: 'Tankless Heater',
        changedValue: 'Tankless Water Heater',
        layer: 'Field',
        changedAt: '2024-05-19T17:12:00.000Z',
        changedBy: 'awong@field.example.com',
      },
      {
        fieldKey: 'receiptDiscount',
        lineItemIndex: undefined,
        lineItemDescription: undefined,
        originalValue: '0.00',
        changedValue: '50.00',
        layer: 'Finance',
        changedAt: '2024-05-20T09:40:00.000Z',
        changedBy: 'finance2@example.com',
      },
    ],
    reviewStatus: 'entered_in_sage',
    reviewHistory: [
      {
        status: 'pending',
        changedAt: '2024-05-19T17:09:55.000Z',
        changedBy: 'awong@field.example.com',
        reason: null,
      },
      {
        status: 'in_review',
        changedAt: '2024-05-20T09:30:00.000Z',
        changedBy: 'finance2@example.com',
        reason: null,
      },
      {
        status: 'entered_in_sage',
        changedAt: '2024-05-20T09:45:00.000Z',
        changedBy: 'finance2@example.com',
        reason: null,
      },
    ],
    sageEntryMetadata: {
      sageReference: 'SAGE-INV-55402',
      postingDate: '2024-05-20',
      notes: 'Capital equipment; coded to job 2024-0225.',
    },
  },
];

/** Simulated network latency for realism. */
const delay = <T,>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

/** Finance-team receipt review service (stubbed). */
export const receiptService = {
  /**
   * Lists receipts whose status is within the supplied set.
   * @param statuses - allowed statuses for the active list group.
   * @returns Matching receipts, newest first.
   */
  async list(statuses: ReviewStatus[]): Promise<Receipt[]> {
    const rows = DB.filter((r) => statuses.includes(r.reviewStatus)).sort(
      (a, b) => +new Date(b.created.date) - +new Date(a.created.date),
    );
    return delay(rows);
  },

  /**
   * Fetches a single receipt by id.
   * @param receiptId - Mongo `_id`.
   * @throws If no receipt matches.
   */
  async get(receiptId: string): Promise<Receipt> {
    const found = DB.find((r) => r._id === receiptId);
    if (!found) throw new Error(`Receipt ${receiptId} not found`);
    return delay(found);
  },

  /**
   * Persists a full receipt (finance edits + audit trail). Stub upserts memory.
   * @param receipt - the edited receipt.
   */
  async save(receipt: Receipt): Promise<Receipt> {
    const i = DB.findIndex((r) => r._id === receipt._id);
    if (i >= 0) DB[i] = structuredClone(receipt);
    return delay(receipt);
  },

  /**
   * Transitions review status, appending a `reviewHistory` entry.
   * @param receiptId - Mongo `_id`.
   * @param status - target status.
   * @param by - acting user.
   * @param reason - required for `rejected`/`on_hold`.
   */
  async setStatus(
    receiptId: string,
    status: ReviewStatus,
    by: string,
    reason: string | null = null,
  ): Promise<Receipt> {
    const r = DB.find((x) => x._id === receiptId);
    if (!r) throw new Error(`Receipt ${receiptId} not found`);
    r.reviewStatus = status;
    r.reviewHistory.push({ status, changedAt: new Date().toISOString(), changedBy: by, reason });
    return delay(r);
  },

  /**
   * Records the manual Sage 100 Cloud entry and marks the receipt complete.
   * @param receiptId - Mongo `_id`.
   * @param metadata - Sage reference #, posting date, notes.
   * @param by - acting user.
   */
  async enterInSage(receiptId: string, metadata: SageEntryMetadata, by: string): Promise<Receipt> {
    const r = DB.find((x) => x._id === receiptId);
    if (!r) throw new Error(`Receipt ${receiptId} not found`);
    r.sageEntryMetadata = metadata;
    r.reviewStatus = 'entered_in_sage';
    r.reviewHistory.push({ status: 'entered_in_sage', changedAt: new Date().toISOString(), changedBy: by, reason: null });
    return delay(r);
  },
};