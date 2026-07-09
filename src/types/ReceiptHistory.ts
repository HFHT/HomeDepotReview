/** Receipt History Service Interface types */

import { ReceiptSubmissionRequest } from "./ReceiptSubmission"
import { ReviewStatus } from "./ReviewStatus"

/**
 * Request payload for retrieving a user's receipt history.
 */
export type ReceiptHistoryRequest = {
    /** The username or user identifier to pull the receipt history for. */
    user: string
}

/**
 * A single historical receipt record, identical to `ReceiptSubmissionRequest`
 * except that `status` reflects the full review lifecycle (`ReviewStatus`)
 * rather than the submission-time literal `'pending'`.
 */
type ReceiptHistoryEntry = Omit<ReceiptSubmissionRequest, 'status'> & {
    /** The current review status of this receipt, updated as it moves through the review lifecycle */
    status: ReviewStatus
}

/**
 * Response payload containing a user's receipt history.
 *
 * Represents an array of previously submitted receipt requests
 * associated with the queried user, with `status` re-cast to `ReviewStatus`
 * to reflect any lifecycle changes since submission.
 */
export type ReceiptHistoryResponse = {
    history: ReceiptHistoryEntry[]
}