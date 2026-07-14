
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

/**
 * Lazily instantiates a singleton Anthropic client using the API key
 * from application settings (ANTHROPIC_API_KEY).
 */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing required application setting: ANTHROPIC_API_KEY"
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const CLAUDE_MODEL =
  process.env.CLAUDE_MODEL ?? "claude-sonnet-4-5-20250929";

export const CLAUDE_MAX_TOKENS = Number(
  process.env.CLAUDE_MAX_TOKENS ?? 8192
);

/**
 * Model used specifically for PDF (document block) receipts. Defaults to the
 * same model as images, but can be overridden independently — e.g. if a
 * cheaper/faster model handles long multi-page PDFs well enough, or if a
 * newer model needs to be pinned separately from the image path.
 */
export const CLAUDE_PDF_MODEL = process.env.CLAUDE_PDF_MODEL ?? CLAUDE_MODEL;

export const CLAUDE_PDF_MAX_TOKENS = Number(
  process.env.CLAUDE_PDF_MAX_TOKENS ?? CLAUDE_MAX_TOKENS
);

/**
 * Optional comma-separated list of Anthropic beta feature flags required for
 * PDF/document support on some models (e.g. "pdfs-2024-09-25"). Leave unset
 * for models where PDF support is generally available (no beta flag needed).
 */
export const CLAUDE_PDF_BETA_HEADERS = (
  process.env.CLAUDE_PDF_BETA_HEADERS ?? ""
)
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);