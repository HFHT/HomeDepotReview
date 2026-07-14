import { Project, ReceiptAnalysis } from '../types';

/**
 * Hard-coded list of subdivisions / projects with their associated phases.
 * Replace with a MongoDB query when the persistence layer is wired up.
 */
export const DUMMY_PROJECTS: Project[] = [
  {
    id: 'proj-maple-ridge',
    name: 'Maple Ridge',
    phases: [
      'Site Prep',
      'Foundation',
      'Framing',
      'Roofing',
      'Electrical Rough-In',
      'Plumbing Rough-In',
      'HVAC',
      'Insulation',
      'Drywall',
      'Interior Finish',
      'Exterior Finish',
      'Flooring',
      'Cabinetry',
      'Landscaping',
      'Punch List'
    ]
  },
  {
    id: 'proj-cedar-creek',
    name: 'Cedar Creek',
    phases: [
      'Site Prep',
      'Foundation',
      'Framing',
      'Roofing',
      'Drywall',
      'Flooring',
      'Punch List'
    ]
  },
  {
    id: 'proj-oak-valley',
    name: 'Oak Valley',
    phases: [
      'Site Prep',
      'Foundation',
      'Framing',
      'Electrical Rough-In',
      'Plumbing Rough-In',
      'Drywall',
      'Interior Finish',
      'Landscaping'
    ]
  }
];

/**
 * Returns a deterministic dummy {@link ReceiptAnalysis} that simulates a
 * Claude AI extraction. Line item phases are biased toward the phases
 * provided by the caller (mirroring the production prompt).
 */
export function buildDummyAnalysis(suggestedPhases: string[]): ReceiptAnalysis {
  const phaseFor = (idx: number, fallback: string) =>
    suggestedPhases[idx % Math.max(suggestedPhases.length, 1)] ?? fallback;

  const lineItems = [
    {
      sku: '1001234',
      description: '2x4x8 SPF Lumber',
      quantity: 12,
      unitPrice: 4.97,
      lineTotal: 59.64,
      phase: phaseFor(0, 'Framing'),
      aiConfidence: 0.96
    },
    {
      sku: '2002345',
      description: 'Drywall Screws 1lb',
      quantity: 2,
      unitPrice: 12.48,
      lineTotal: 24.96,
      phase: phaseFor(1, 'Drywall'),
      aiConfidence: 0.94
    },
    {
      sku: '3003456',
      description: '1/2" Drywall Sheet 4x8',
      quantity: 8,
      unitPrice: 14.27,
      lineTotal: 114.16,
      phase: phaseFor(1, 'Drywall'),
      aiConfidence: 0.91
    },
    {
      sku: '4004567',
      description: 'Roofing Nails 5lb',
      quantity: 1,
      unitPrice: 22.98,
      lineTotal: 22.98,
      phase: phaseFor(0, 'Roofing'),
      aiConfidence: 0.72
    },
    {
      sku: '5005678',
      description: 'Construction Adhesive 28oz',
      quantity: 3,
      unitPrice: 6.97,
      lineTotal: 20.91,
      phase: phaseFor(0, 'Framing'),
      aiConfidence: 0.88
    }
  ];

  const subtotal = +lineItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2);
  const deliveryFee = 35.0;
  const shippingFee = 0.0;
  const taxAmount = +(subtotal * 0.0825).toFixed(2);
  const totalAmount = +(subtotal + deliveryFee + shippingFee + taxAmount).toFixed(2);

  return {
    receiptNumber: '4567891234',
    invoiceNumber: 'H8821-5544',
    storeName: 'The Home Depot',
    storeNumber: '#1234',
    purchaseDate: new Date().toISOString(),
    lineItems,
    subtotal,
    deliveryFee,
    shippingFee,
    taxAmount,
    totalAmount
  };
}