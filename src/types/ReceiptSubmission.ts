// /** Receipt Submission Service Interface types */

// import { ReceiptAnalysisResponse } from "./ReceiptAnalysis"
// import { ReviewHistory } from "./ReviewHistory"
// import { ReviewStatus } from "./ReviewStatus"

// /**
//  * Represents the metadata associated with a receipt submission.
//  */
// export type ReceiptSubmissionMeta = {
//     /** The date the receipt was submitted, typically in ISO 8601 format */
//     submitDate: string,
//     /** The name or identifier of the project or subdivision associated with the receipt */
//     projectOrSubdivision: string,
//     /** The lot number(s) or project number(s) associated with the receipt */
//     lotOrProjectNumbers: string,
//     /** A list of phase names or identifiers relevant to the submission */
//     phases: string[]
// }

// /**
//  * Represents a single historical record of a field modification made by a user
//  * during the receipt submission process.
//  */
// export type ReceiptSubmissionHistory = {
//     /** The `ReceiptAnalysisResponse` field that was modified by the user */
//     field: string,
//     /**
//      * The `ReceiptAnalysisResponseItems.id` field that was modified by the user,
//      * or `null` if the modified field was not a line-item.
//      */
//     line_item_id: string | null,
//     /** Indicates who made the modification. The value `"field"` is always set to indicate it was modified by field personnel */
//     by: 'field' | 'finance',
//     /** The value of the field before the user modified it */
//     old_value: string | number | null,
//     /** The value of the field after the user modified it */
//     new_value: string | number | null
// }

// /**
//  * Represents the payload required to submit a receipt for processing.
//  * This object is persisted in a Mongo database 
//  */
// export type ReceiptSubmissionRequest = {
//     _id: string,
//     /** The analyzed receipt data to be submitted */
//     receipt: ReceiptAnalysisResponse,
//     /** The identifier (e.g., username or user ID) of the user submitting the receipt */
//     user: string,
//     /** The receipt processing status for this receipt, always set to pending */
//     status: 'pending' | ReviewStatus
//     /** Metadata providing additional context for the receipt submission */
//     meta: ReceiptSubmissionMeta,
//     /**
//      * The historical record associated with the receipt submission,
//      * capturing any field-level modifications made prior to submission.
//      */
//     history: ReceiptSubmissionHistory[]
//     review: ReviewHistory[] | undefined
// }

// /**
//  * Represents the response returned after a receipt submission request.
//  */
// export type ReceiptSubmissionResponse = {
//     /**
//      * Represents an array of previously submitted receipt requests associated with this user.
//      */
//     receiptHistory: ReceiptSubmissionRequest[]
// }

/** Receipt Submission Service Interface types */

import { ReceiptAnalysisResponse } from "./ReceiptAnalysis"
import { ReviewHistory } from "./ReviewHistory"
import { ReviewStatus } from "./ReviewStatus"

/**
 * Represents the metadata associated with a receipt submission.
 */
export type ReceiptSubmissionMeta = {
    /** The date the receipt was submitted, typically in ISO 8601 format */
    submitDate: string,
    /** The name or identifier of the project or subdivision associated with the receipt */
    projectOrSubdivision: string,
    /** The lot number(s) or project number(s) associated with the receipt */
    lotOrProjectNumbers: string,
    /** A list of phase names or identifiers relevant to the submission */
    phases: string[]
    /**
     * Manual Sage 100 Cloud entry data captured by finance during review.
     * `post_date` defaults to today (ISO `YYYY-MM-DD`) when the form is opened.
     */
    sage: {
        /** The Sage-assigned reference number for this entry. */
        reference_no: string,
        /** The date this entry was posted in Sage (ISO `YYYY-MM-DD`). */
        post_date: string,
        /** Free-form notes captured alongside the Sage entry. */
        note: string
    }
}

/**
 * Represents a single historical record of a field modification made by a user
 * during the receipt submission process.
 */
export type ReceiptSubmissionHistory = {
    /** The `ReceiptAnalysisResponse` field that was modified by the user */
    field: string,
    /**
     * The `ReceiptAnalysisResponseItems.id` field that was modified by the user,
     * or `null` if the modified field was not a line-item.
     */
    line_item_id: string | null,
    /** Indicates who made the modification. The value `"field"` is always set to indicate it was modified by field personnel */
    by: 'field' | 'finance',
    /** The value of the field before the user modified it */
    old_value: string | number | null,
    /** The value of the field after the user modified it */
    new_value: string | number | null
}

/**
 * Represents the payload required to submit a receipt for processing.
 * This object is persisted in a Mongo database 
 */
export type ReceiptSubmissionRequest = {
_id: string
    /** The analyzed receipt data to be submitted */
    receipt: ReceiptAnalysisResponse,
    /** The identifier (e.g., username or user ID) of the user submitting the receipt */
    user: string,
    /** The receipt processing status for this receipt, always set to pending */
    status: 'pending' | ReviewStatus
    /** Metadata providing additional context for the receipt submission */
    meta: ReceiptSubmissionMeta,
    /**
     * The historical record associated with the receipt submission,
     * capturing any field-level modifications made prior to submission.
     */
    history: ReceiptSubmissionHistory[]
    review: ReviewHistory[] | undefined
}

/**
 * Represents the response returned after a receipt submission request.
 */
export type ReceiptSubmissionResponse = {
    /**
     * Represents an array of previously submitted receipt requests associated with this user.
     */
    history: ReceiptSubmissionRequest[]
}