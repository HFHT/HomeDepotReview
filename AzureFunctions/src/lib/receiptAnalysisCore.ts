import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import {
  ReceiptAnalysisResponseSchema,
  ReceiptAnalysisResponse,
} from "../types";

/**
 * Rough estimate of decoded byte size from a base64 string length,
 * without actually decoding (avoids allocating large buffers just to check).
 */
export function estimateBase64ByteLength(base64: string): number {
  const cleaned = base64.replace(/=+$/, "");
  return Math.floor((cleaned.length * 3) / 4);
}

/**
 * Extracts a JSON object from a model response that may (despite instructions)
 * be wrapped in markdown code fences or have leading/trailing whitespace/text.
 */
export function extractJsonPayload(text: string): unknown {
  let candidate = text.trim();

  const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    candidate = fenceMatch[1].trim();
  }

  if (!candidate.startsWith("{")) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      candidate = candidate.slice(start, end + 1);
    }
  }

  return JSON.parse(candidate);
}

/**
 * Ensures every line item has a well-formed UUID, generating one server-side
 * if the model omitted it or produced something invalid.
 */
export function ensureLineItemIds(response: ReceiptAnalysisResponse): void {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  for (const item of response.line_items) {
    if (!item.id || !uuidPattern.test(item.id)) {
      item.id = randomUUID();
    }
  }
}

/**
 * Parameters needed to invoke Claude for receipt extraction, regardless of
 * whether the source content is images or a PDF document block.
 */
export interface ClaudeReceiptRequest {
  model: string;
  maxTokens: number;
  systemPrompt: string;
  content: Anthropic.Messages.ContentBlockParam[];
  betaHeaders?: string[];
}

export async function callClaudeForReceipt(
  anthropic: Anthropic,
  params: ClaudeReceiptRequest
): Promise<Anthropic.Messages.Message> {
  const options = params.betaHeaders?.length
    ? { headers: { "anthropic-beta": params.betaHeaders.join(",") } }
    : undefined;

  return anthropic.messages.create(
    {
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: 0,
      system: params.systemPrompt,
      messages: [
        {
          role: "user",
          content: params.content,
        },
      ],
    },
    options
  );
}

export function extractTextBlock(
  message: Anthropic.Messages.Message
): Anthropic.Messages.TextBlock | undefined {
  return message.content.find(
    (block): block is Anthropic.Messages.TextBlock => block.type === "text"
  );
}

export type ReceiptAnalysisOutcome =
  | { ok: true; response: ReceiptAnalysisResponse }
  | { ok: false; status: number; body: Record<string, unknown> };

/**
 * Shared JSON-extraction + schema-validation + UUID-backfill pipeline used by
 * both the image and PDF paths, since the extraction JSON contract is
 * identical for both.
 */
export function parseAndValidateReceiptJson(
  rawText: string, message: Anthropic.Messages.Message
): ReceiptAnalysisOutcome {
  let parsedJson: unknown;
  try {
    parsedJson = extractJsonPayload(rawText);
  } catch {
    return {
      ok: false,
      status: 502,
      body: {
        error: "Model response was not valid JSON.",
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

  const parsedResponse = ReceiptAnalysisResponseSchema.safeParse(parsedJson);
  if (!parsedResponse.success) {
    return {
      ok: false,
      status: 502,
      body: {
        error: "Model response did not match the expected schema.",
        details: parsedResponse.error.flatten(),
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

  const response = parsedResponse.data;
  ensureLineItemIds(response);
  return { ok: true, response };
}