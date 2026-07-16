import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import Anthropic from "@anthropic-ai/sdk";

import { getAnthropicClient } from "../anthropicClient";
import { AnalyzeTextReceiptRequestSchema } from "../types";
import {
    callClaudeForReceipt,
    extractTextBlock,
    parseAndValidateTextReceiptJson,
    ClaudeReceiptRequest,
} from "../lib/receiptAnalysisCore";
import { buildTextRequest } from "../lib/textReceiptStrategy";

function usageOf(message: Anthropic.Messages.Message) {
    return {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        cacheCreationInputTokens: message.usage.cache_creation_input_tokens ?? 0,
        cacheReadInputTokens: message.usage.cache_read_input_tokens,
        stop_reason: message.stop_reason,
        stop_details: message.stop_details,
    };
}

async function analyzeTextReceipt(
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

    const parsedRequest = AnalyzeTextReceiptRequestSchema.safeParse(rawBody);
    if (!parsedRequest.success) {
        return {
            status: 400,
            jsonBody: {
                error: "Invalid request payload.",
                details: parsedRequest.error.flatten(),
            },
        };
    }

    const { text } = parsedRequest.data;

    /** Zod performs these tests */
    // const textError = validateReceiptText(text);
    // if (textError) {
    //     return { status: 400, jsonBody: { error: textError } };
    // }

    // -----------------------------------------------------------------------
    // 2. Build the Claude (Haiku) request
    // -----------------------------------------------------------------------
    const claudeRequest: ClaudeReceiptRequest = buildTextRequest(text);
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
                usage: usageOf(message),
            },
        };
    }

    const outcome = parseAndValidateTextReceiptJson(textBlock.text, message);
    if (!outcome.ok) {
        context.error("Model response failed validation", {
            ...outcome.body,
            raw: textBlock.text,
            usage: usageOf(message),
        });
        return { status: outcome.status, jsonBody: outcome.body };
    }

    return {
        status: 200,
        jsonBody: {
            ...outcome.response,
            usage: usageOf(message),
        },
    };
}

app.http("analyzeTextReceipt", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: analyzeTextReceipt,
});