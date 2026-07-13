/**
 * @fileoverview Type definitions for the Receipt Analysis Service.
 * 
 * These types define the contract between the client application and the
 * receipt analysis backend (powered by Claude). They cover the request
 * payload (base64-encoded receipt images), the structured response data
 * extracted from receipts, and the per-image quality/status metadata used
 * to determine whether extracted data should be trusted, flagged for
 * review, or rejected.
 */

/**
 * Request payload for the Receipt Analysis Service.
 *
 * An array of images to be analyzed. Each entry represents a single page
 * or photo of a receipt, encoded as a Base64 string along with its media
 * type (MIME type) so the service can correctly decode it.
 *
 * @example
 * const request: ReceiptAnalysisRequest = [
 *   { imageBase64: "iVBORw0KGgoAAAANSUhEUg...", mediaType: "image/png" }
 * ];
 */
export type ReceiptAnalysisRequest = {
    /** The image converted to a Base64-encoded string. */
    imageBase64: string,
    /** The MIME type of the image file (e.g., "image/png", "image/jpeg"). */
    mediaType: string
}[]

/**
 * Represents a single line item extracted from a receipt.
 *
 * All fields may be `null` if the value could not be confidently read
 * from the image (e.g., due to blur, glare, or cropping).
 */
export type ReceiptAnalysisResponseItems = {
    /** A unique identifier for this line item using crypto.randomUUID()*/
    id: string
    /** SKU or UPC code for the item, or `null` if not shown/readable. */
    sku_or_upc: string | null,
    /** Model for the item, or `null` if not shown/readable. */
    model: string | null,
    /** Invoice style receipts have some line items that are special order, capture the po if they exist */
    special_order_po?: string | null | undefined,
    /** Product or service name/description. */
    title: string | null,
    /** Unit price of the item. */
    unit_price: number | null,
    /** Quantity purchased. */
    quantity: number | null
    /** Discount applied to this line item, or `null` if not shown. */
    discount: number | null
    /** Total price for this line item (after discount, if applicable). */
    total_price: number | null
}

/**
 * Summary information extracted from a receipt, applicable to the
 * receipt as a whole (as opposed to individual line items).
 */
export type ReceiptAnalysisResponse = {
    /** Name of the receipt issuer (e.g., store or company name). */
    supplier: string | null,
    /** The receipt or transaction number. */
    receipt_number: string | null
    /** The type of receipt, the AI field extraction prompt differs by the receipt type */
    receipt_type: 'register' | 'invoice' | 'other'
    /** The store and store location. */
    store: string | null,
    store_location: string | null,
    /** The email address for the customer, or `null` if not shown */
    customer_email: string | null,
    /** The order number, or `null` if not shown */
    order_number: string | null,
    /** The PO or Job, or `null` if not shown */
    po_or_job: string | null,
    /** The project name, or `null` if not shown */
    project_name: string | null,
    /** Date on the receipt, YYYY-MM-DD if available. */
    date: string | null,
    /** Time on the receipt, 24 hour format HH:MM */
    time: string | null,
    /** Grand total amount on the receipt. */
    total: number | null,
    /** Total discount applied to the receipt, or `null` if not shown. */
    total_discount: number | null
    /** Total tax amount on the receipt, or `null` if not shown. */
    total_tax: number | null
    /** Subtotal or null if not shown */
    subtotal: number | null
    /** The payment method used (e.g., "Visa", "Cash"), or `null` if not shown. */
    payment_method: string | null,
    /** The individual line items extracted from the receipt. */
    line_items: ReceiptAnalysisResponseItems[],
    /** The per-image analysis results with an overall status. */
    image_results: ReceiptAnalysisImageResults
}

/**
 * Aggregated results for a batch of analyzed receipt images.
 *
 * Combines the per-image analysis results with an overall status
 * summarizing the batch as a whole.
 */
export type ReceiptAnalysisImageResults = {
    /** Analysis result for each image in the request, in order. Applies only to register receipts or scanned image receipts.*/
    imageResults?: ReceiptAnalysisImageResult[] | undefined;
    /** Overall status derived from all image results in the batch. */
    overallStatus: ImageProcessingStatus;
}

/**
 * Indicates the outcome of processing a receipt image.
 *
 * - `'success'`: Confidence is high and no issues were reported for the image.
 * - `'needs_review'`: Data was extracted but with low/medium confidence on
 *   specific fields, partial extraction occurred, or quality issues
 *   (blurry, glare, too dark, etc.) were detected.
 * - `'failed'`: The image was explicitly flagged as unreadable/invalid,
 *   confidence was too low to trust, or JSON schema validation failed.
 */
export type ImageProcessingStatus =
    'success' |
    'needs_review' |
    'failed';

/**
 * Specific quality or content issues that can be detected on a receipt
 * image during analysis. Used to explain why a field is `null` or why
 * an image's status is `needs_review`/`failed`.
 */
export type ReceiptImageIssue =
    | 'blurry'
    | 'glare'
    | 'too_dark'
    | 'cropped_or_cut_off'
    | 'not_a_receipt'
    | 'duplicate_page'
    | 'wrong_orientation'
    | 'unreadable_text'
    | 'low_confidence_extraction';

// ... unchanged types above ...

/**
 * The analysis result for a single receipt image, including its
 * processing status, confidence level, any detected issues, and an
 * optional human-readable message.
 */
export type ReceiptAnalysisImageResult = {
    /** Index of the image, correlating to its position in the original request array. */
    imageIndex: number;
    /** Processing status for this specific image. */
    status: ImageProcessingStatus;
    /** Confidence level of the extracted data, or `null` if not applicable (e.g., failed status). */
    confidence: 'high' | 'medium' | 'low' | null;
    /** List of detected quality or content issues for this image. */
    issues: ReceiptImageIssue[];
    /**
     * Human-readable message shown to the user, if applicable
     * (e.g., "Image is too blurry to read line items").
     */
    message: string | null;
    /**
     * The blob storage file name assigned to this image at submission time
     * (populated client-side in Step 3, prior to upload — not set by the
     * AI analysis service).
     */
    fileName?: string | null;
}

/**
 * Prompt guidance to include when instructing Claude to analyze receipt images.
 *
 * For each image, extract whatever data is visible. If any value is
 * uncertain due to image quality (blur, glare, cropping, dark, obstruction),
 * set that field to `null`, add the relevant issue tag, and set confidence
 * accordingly. If the image cannot be read at all or is not a receipt, set
 * status to `'failed'`. Do not guess values that cannot be clearly read.
 */