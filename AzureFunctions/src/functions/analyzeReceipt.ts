
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicClient } from "../anthropicClient";
import { ReceiptAnalysisRequestSchema } from "../types";
import {
  callClaudeForReceipt,
  extractTextBlock,
  parseAndValidateReceiptJson,
  ClaudeReceiptRequest,
} from "../lib/receiptAnalysisCore";
import { validateImages, buildImageRequest } from "../lib/imageReceiptStrategy";
import { validatePdf, buildPdfRequest } from "../lib/pdfReceiptStrategy";

async function analyzeReceipt(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  // -----------------------------------------------------------------------
  // 1. Parse & validate the request body
  // -----------------------------------------------------------------------
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return {
      status: 400,
      jsonBody: { error: "Request body must be valid JSON." },
    };
  }

  const parsedRequest = ReceiptAnalysisRequestSchema.safeParse(rawBody);
  if (!parsedRequest.success) {
    return {
      status: 400,
      jsonBody: {
        error: "Invalid request payload.",
        details: parsedRequest.error.flatten(),
      },
    };
  }

  const items = parsedRequest.data;
  const pdfItems = items.filter((i) => i.mediaType === "application/pdf");

  // Moved to Zod.
  // // Business rule: a multi-page PDF is one receipt. Don't allow mixing a PDF
  // // with other images/pages in the same request.
  // if (pdfItems.length > 0 && items.length > 1) {
  //   return {
  //     status: 400,
  //     jsonBody: {
  //       error:
  //         "A PDF must be submitted alone (as the only item in the array), not combined with other images or PDFs.",
  //     },
  //   };
  // }

  // -----------------------------------------------------------------------
  // 2. Validate + build the Claude request via the appropriate strategy
  // -----------------------------------------------------------------------
  let claudeRequest: ClaudeReceiptRequest;

  if (pdfItems.length === 1) {
    const pdfError = validatePdf(pdfItems[0]);
    if (pdfError) {
      return { status: 400, jsonBody: { error: pdfError } };
    }
    claudeRequest = buildPdfRequest(pdfItems[0]);
  } else {
    const imageErrors = validateImages(items);
    if (imageErrors.length > 0) {
      return {
        status: 400,
        jsonBody: {
          error: imageErrors[0].message,
          details: imageErrors,
        },
      };
    }
    claudeRequest = buildImageRequest(items);
  }

  const anthropic = getAnthropicClient();

  let message: Anthropic.Messages.Message;
  try {
    message = await callClaudeForReceipt(anthropic, claudeRequest);
  } catch (err) {
    context.error("Anthropic API call failed", err);
    return {
      status: 502,
      jsonBody: {
        error: "Failed to reach receipt analysis model.",
        details: err instanceof Error ? err.message : String(err),
      },
    };
  }

  // -----------------------------------------------------------------------
  // 3. Extract, parse, and validate the model's JSON response
  // -----------------------------------------------------------------------
  const textBlock = extractTextBlock(message);
  if (!textBlock) {
    context.error("Model response contained no text block", message);
    return {
      status: 502,
      jsonBody: {
        error: "Model returned no analyzable content.",
        usage: {
          inputTokens: message.usage.input_tokens,
          outputTokens: message.usage.output_tokens,
          cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
          cacheReadInputTokens: message.usage.cache_read_input_tokens,
          stop_reason: message.stop_reason,
          stop_details: message.stop_details
        }
      },
    };
  }

  const outcome = parseAndValidateReceiptJson(textBlock.text, message);
  if (!outcome.ok) {
    context.error("Model response failed validation", {
      ...outcome.body,
      raw: textBlock.text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: message.usage.cache_read_input_tokens,
        stop_reason: message.stop_reason,
        stop_details: message.stop_details
      }
    });
    return { status: outcome.status, jsonBody: outcome.body };
  }

  return {
    status: 200,
    jsonBody: {
      ...outcome.response,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: message.usage.cache_read_input_tokens,
        stop_reason: message.stop_reason,
        stop_details: message.stop_details
      }
    }
  };
}

app.http("analyzeReceipt", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: analyzeReceipt,
});