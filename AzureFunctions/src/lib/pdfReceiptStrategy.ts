import Anthropic from "@anthropic-ai/sdk";
// import { HOME_DEPOT_RECEIPT_EXTRACTION_PROMPT } from "../prompts/promptForPdf";
import { CLAUDE_PDF_MODEL, CLAUDE_PDF_MAX_TOKENS, CLAUDE_PDF_BETA_HEADERS } from "../anthropicClient";
import { ReceiptImage } from "../types";
import { estimateBase64ByteLength, ClaudeReceiptRequest } from "./receiptAnalysisCore";
import { SYSTEM_PROMPT_PDF } from "../prompts/pdfPrompt";

// Anthropic's documented per-request PDF constraints: 32MB and 100 pages.
export const MAX_PDF_BYTES = 32 * 1024 * 1024;
export const MAX_PDF_PAGES = 100;

type Base64PdfSource = Extract<
  Anthropic.Messages.DocumentBlockParam["source"],
  { type: "base64" }
>;

/**
 * Best-effort page-count heuristic. Counts top-level "/Type /Page" object
 * dictionaries (excluding "/Type /Pages", the page-tree node). This works
 * for simple, uncompressed PDFs but can under/over-count PDFs that use
 * object streams or compressed cross-reference tables (common output from
 * modern scanners/exporters). Treat this as a soft signal only — it exists
 * to catch obviously-oversized documents cheaply. For a guaranteed-accurate
 * count, integrate a real parser (e.g. `pdf-lib`) instead.
 */
function estimatePageCount(buffer: Buffer): number | undefined {
  try {
    const text = buffer.toString("latin1");
    const matches = text.match(/\/Type\s*\/Page(?!s)/g);
    return matches?.length;
  } catch {
    return undefined;
  }
}

export function validatePdf(image: ReceiptImage): string | undefined {
  const estimatedBytes = estimateBase64ByteLength(image.imageBase64);
  if (estimatedBytes > MAX_PDF_BYTES) {
    return `PDF exceeds the maximum allowed size of ${MAX_PDF_BYTES} bytes (~${(
      MAX_PDF_BYTES /
      (1024 * 1024)
    ).toFixed(0)}MB).`;
  }

  try {
    const buffer = Buffer.from(image.imageBase64, "base64");
    const pageCount = estimatePageCount(buffer);
    if (pageCount !== undefined && pageCount > MAX_PDF_PAGES) {
      return `PDF appears to contain ${pageCount} pages, exceeding the maximum of ${MAX_PDF_PAGES} pages supported per request.`;
    }
  } catch {
    // If we can't decode/inspect it, let Anthropic's API surface the real error.
  }

  return undefined;
}

export function buildPdfRequest(image: ReceiptImage): ClaudeReceiptRequest {
  const documentBlock: Anthropic.Messages.DocumentBlockParam = {
    type: "document",
    source: {
      type: "base64",
      media_type: "application/pdf",
      data: image.imageBase64,
    } satisfies Base64PdfSource,
  };

  const instructionBlock: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text:
      "The document above is a single, potentially multi-page PDF receipt. " +
      "Treat all pages as belonging to one receipt. Analyze it per the " +
      "system instructions and return only the JSON object.",
  };

  return {
    model: CLAUDE_PDF_MODEL,
    maxTokens: CLAUDE_PDF_MAX_TOKENS,
    systemPrompt: SYSTEM_PROMPT_PDF,
    content: [documentBlock, instructionBlock],
    betaHeaders: CLAUDE_PDF_BETA_HEADERS,
  };
}