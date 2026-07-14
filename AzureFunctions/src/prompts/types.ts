// types.ts
// Shared type definitions for Home Depot receipt extraction output.
// Both the image-array prompt and the multi-page-PDF prompt produce a
// payload matching ReceiptHeaderFields; the *Results wrapper is
// intentionally identical in shape between the two (image_results vs
// page_results are the same structure, just with different index/array
// key names).

import type { Category } from "./category";

export type ReceiptType = "register" | "invoice" | "other";

export type ExtractionStatus = "success" | "needs_review" | "failed";

export type ConfidenceLevel = "high" | "medium" | "low" | null;

export type ImageIssueTag =
  | "blurry"
  | "glare"
  | "too_dark"
  | "cropped_or_cut_off"
  | "not_a_receipt"
  | "duplicate_page"
  | "wrong_orientation"
  | "unreadable_text"
  | "low_confidence_extraction";

// PDFs can additionally flag a page where the printed "Page X of Y"
// sequence suggests a page is missing. This is a per-page issue tag only
// (it lives on PageResult.issues) — it has no wrapper-level counterpart.
export type PageIssueTag = ImageIssueTag | "missing_page";

export interface LineItem {
  id: string;
  sku_or_upc: string | null;
  model: string | null;
  title: string | null;
  vendor: string | null;
  po_number: string | null;
  category: Category;
  unit_price: number | null;
  quantity: number | null;
  quantity_unit: string | null;
  discount: number | null;
  total_price: number | null;
}

export interface ReceiptHeaderFields {
  supplier: string | null;
  receipt_type: ReceiptType;
  store: string | null;
  store_number: string | null;
  receipt_number: string | null;
  order_number: string | null;
  po_or_job: string | null;
  /** ISO 8601 date-only, e.g. "2026-04-21" */
  date: string | null;
  /** 24-hour "HH:MM", e.g. "15:05" */
  time: string | null;
  email: string | null;
  total: number | null;
  total_discount: number | null;
  total_tax: number | null;
  subtotal: number | null;
  line_items: LineItem[];
}

export interface ImageResult {
  imageIndex: number;
  status: ExtractionStatus;
  confidence: ConfidenceLevel;
  issues: ImageIssueTag[];
  message: string | null;
}

export interface ImageResultsWrapper {
  imageResults: ImageResult[];
  overallStatus: ExtractionStatus;
}

export interface PageResult {
  pageIndex: number;
  status: ExtractionStatus;
  confidence: ConfidenceLevel;
  issues: PageIssueTag[];
  message: string | null;
}

// Structurally identical to ImageResultsWrapper by design — same two keys,
// same shapes, just "page" naming instead of "image".
export interface PageResultsWrapper {
  pageResults: PageResult[];
  overallStatus: ExtractionStatus;
}

export interface ReceiptExtractionFromImages extends ReceiptHeaderFields {
  image_results: ImageResultsWrapper;
}

export interface ReceiptExtractionFromPdf extends ReceiptHeaderFields {
  page_results: PageResultsWrapper;
}