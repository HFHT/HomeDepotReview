import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_HAIKU_MODEL, CLAUDE_HAIKU_MAX_TOKENS } from "../anthropicClient";
import { HAIKU_SYSTEM_PROMPT } from "../prompts/pdfExtractedText";
import { ClaudeReceiptRequest } from "./receiptAnalysisCore";
// import { MAX_TEXT_RECEIPT_CHARS } from "../types";

// /**
//  * Validates the raw extracted-text payload before it's sent to the model.
//  * Returns an error message string if invalid, or null if OK.
//  */
// export function validateReceiptText(text: string): string | null {
//   if (!text || text.trim().length === 0) {
//     return "text must not be empty.";
//   }
//   if (text.length > MAX_TEXT_RECEIPT_CHARS) {
//     return `text exceeds the maximum allowed length of ${MAX_TEXT_RECEIPT_CHARS} characters (received ${text.length}).`;
//   }
//   return null;
// }

export function buildTextRequest(text: string): ClaudeReceiptRequest {
  const contentBlock: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text,
  };

  const instructionBlock: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text:
      "Analyze the extracted receipt text above per the system instructions " +
      "and return only the JSON object.",
  };

  return {
    model: CLAUDE_HAIKU_MODEL,
    maxTokens: CLAUDE_HAIKU_MAX_TOKENS,
    systemPrompt: HAIKU_SYSTEM_PROMPT,
    content: [contentBlock, instructionBlock],
  };
}