/** @todo - this is only a prototype, use analyzeReceipt.ts as a model for final version. */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import Anthropic from '@anthropic-ai/sdk';

const HAIKU_MODEL = 'claude-3-5-haiku-20241022';
const MAX_TOKENS = 4096;

interface AnalyzeReceiptRequestBody {
  systemPrompt?: string;
  userContent?: string;
}

/**
 * Custom error carrying an explicit HTTP status code so we can
 * consistently map any failure to the correct response.
 */
class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ApiError('Server misconfiguration: ANTHROPIC_API_KEY is not set.', 500);
  }

  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

function validateRequestBody(body: unknown): Required<AnalyzeReceiptRequestBody> {
  if (!body || typeof body !== 'object') {
    throw new ApiError('Request body must be a JSON object.', 400);
  }

  const { systemPrompt, userContent } = body as AnalyzeReceiptRequestBody;

  if (typeof systemPrompt !== 'string' || systemPrompt.trim().length === 0) {
    throw new ApiError('"systemPrompt" is required and must be a non-empty string.', 400);
  }

  if (typeof userContent !== 'string' || userContent.trim().length === 0) {
    throw new ApiError('"userContent" is required and must be a non-empty string.', 400);
  }

  return { systemPrompt, userContent };
}

/**
 * Normalizes any thrown error (Anthropic SDK errors, our own ApiError,
 * or anything unexpected) into a single ApiError with an appropriate
 * status code, so the handler always has one consistent shape to return.
 */
function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Anthropic.APIError) {
    const status = error.status ?? 502;

    switch (status) {
      case 400:
        return new ApiError(`Invalid request sent to AI service: ${error.message}`, 400);
      case 401:
      case 403:
        // Never leak auth details from our own API key to the client
        return new ApiError('AI service authentication failed.', 500);
      case 404:
        return new ApiError('AI service resource not found.', 502);
      case 429:
        return new ApiError('AI service rate limit exceeded. Please try again shortly.', 429);
      case 500:
      case 502:
      case 503:
      case 529:
        return new ApiError('AI service is temporarily unavailable. Please try again shortly.', 503);
      default:
        return new ApiError(`AI service error: ${error.message}`, 502);
    }
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }

  return new ApiError('An unexpected error occurred while analyzing the receipt.', 500);
}

export async function analyzeReceipt(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError('Request body must be valid JSON.', 400);
    }

    const { systemPrompt, userContent } = validateRequestBody(body);

    const client = getAnthropicClient();

    const message = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === 'text');

    if (!textBlock || textBlock.type !== 'text') {
      throw new ApiError('AI service returned no usable text content.', 502);
    }

    return {
      status: 200,
      jsonBody: { result: textBlock.text },
    };
  } catch (error) {
    const apiError = normalizeError(error);

    // Log full detail server-side for diagnostics, but only return
    // the sanitized message to the client.
    context.error('analyzeReceipt failed:', error);

    return {
      status: apiError.statusCode,
      jsonBody: { error: apiError.message },
    };
  }
}

app.http('analyzeReceipt', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'analyze-receipt',
  handler: analyzeReceipt,
});