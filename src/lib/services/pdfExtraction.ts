// pdfExtraction.ts
import { getDocumentProxy } from 'unpdf';

export class PdfExtractionError extends Error { constructor(message: string, public cause?: unknown) { super(message); this.name = 'PdfExtractionError'; } } 
export interface TextItem { str: string; x: number; y: number; }

export async function extractStructuredTextFromFile(file: File): Promise<string> {
  let pdfData: Uint8Array;

  try {
    const arrayBuffer = await file.arrayBuffer();
    pdfData = new Uint8Array(arrayBuffer);
  } catch (err) {
    // Terminal: can't even read the file
    throw new PdfExtractionError('Failed to read the uploaded file.', err);
  }

  let pdf;
  try {
    pdf = await getDocumentProxy(pdfData);
  } catch (err) {
    // Terminal: not a valid/loadable PDF
    throw new PdfExtractionError(
      'Failed to load PDF document. The file may be corrupted, empty, or password-protected.',
      err
    );
  }

  if (pdf.numPages === 0) {
    throw new PdfExtractionError('The PDF contains no pages.');
  }

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();

      const items: TextItem[] = content.items
        .filter((item: any) => 'str' in item && item.str.trim().length > 0)
        .map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }));

      if (items.length === 0) {
        // Non-terminal: page has no extractable text (e.g. scanned image)
        console.warn(`Page ${pageNum} contains no extractable text.`);
        pageTexts.push(`--- PAGE ${pageNum} of ${pdf.numPages} (no text found) ---`);
        continue;
      }

      const rows = groupIntoRows(items);
      const pageText = rows.map((row) => row.map((i) => i.str).join('\t')).join('\n');

      pageTexts.push(`--- PAGE ${pageNum} of ${pdf.numPages} ---\n${pageText}`);
    } catch (pageError) {
      // Non-terminal: log and continue processing remaining pages
      console.error(`Failed to extract text from page ${pageNum}:`, pageError);
      pageTexts.push(`--- PAGE ${pageNum} of ${pdf.numPages} (extraction failed) ---`);
    }
  }

  const result = pageTexts.join('\n\n');

  if (!result.replace(/---.*---/g, '').trim()) {
    // Terminal: every page failed or had no text — nothing usable to send to Haiku
    throw new PdfExtractionError(
      'No text could be extracted from any page. The PDF may be a scanned image without OCR text.'
    );
  }

  return result;
}

function groupIntoRows(items: TextItem[], yTolerance = 2): TextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const rows: TextItem[][] = [];
  let currentRow: TextItem[] = [];
  let lastY: number | null = null;

  for (const item of sorted) {
    if (lastY === null || Math.abs(item.y - lastY) <= yTolerance) {
      currentRow.push(item);
    } else {
      rows.push(currentRow);
      currentRow = [item];
    }
    lastY = item.y;
  }
  if (currentRow.length) rows.push(currentRow);

  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}