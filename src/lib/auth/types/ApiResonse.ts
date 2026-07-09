/** API response framework types */

import { ReceiptAnalysisResponse } from "../../../types/ReceiptAnalysis"
import { ReceiptHistoryResponse } from "../../../types/ReceiptHistory"
import { ReceiptSubmissionResponse } from "../../../types/ReceiptSubmission"
import { SelectsValue } from "../../stores/types/SelectsValue"

/**
 * Represents an error returned from an API call.
 *
 * @typedef {Object} ApiResponseError
 * @property {string} message - A human-readable description of the error.
 * @property {string | number | null} code - An identifier for the error type.
 * Can be a string code, numeric HTTP status code, or `null` if no code is available.
 */
export type ApiResponseError = {
    message: string,
    code: string | number | null
}

/**
 * Generic wrapper for API responses used throughout the application.
 *
 * Encapsulates either a successful response payload (which may be one of
 * several receipt-related response types) or an error object describing
 * what went wrong during the request.
 *
 * @typedef {Object} ApiRespone
 * @property {ReceiptAnalysisResponse | ReceiptSubmissionResponse | ReceiptHistoryResponse} response -
 * The successful response payload returned by the API. The shape depends on
 * which endpoint was called (receipt analysis, submission, or history).
 * @property {ApiResponseError | undefined} error -
 * Present when the API call fails; contains details about the error.
 * Will be `undefined` when the request succeeds.
 */
export type ApiResponse = {
    response: ReceiptAnalysisResponse | ReceiptSubmissionResponse | ReceiptHistoryResponse | SelectsValue,
    error: ApiResponseError | undefined
}