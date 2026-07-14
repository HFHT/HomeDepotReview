import Anthropic from "@anthropic-ai/sdk";
// import { SYSTEM_PROMPT } from "../prompt";
import { CLAUDE_MODEL, CLAUDE_MAX_TOKENS } from "../anthropicClient";
import { ReceiptImage } from "../types";
import { estimateBase64ByteLength, ClaudeReceiptRequest } from "./receiptAnalysisCore";
import { SYSTEM_PROMPT_IMAGES } from "../prompts/imagePrompt";

// Anthropic's per-image limit is ~5MB.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type Base64ImageSource = Extract<
  Anthropic.Messages.ImageBlockParam["source"],
  { type: "base64" }
>;

export interface ImageValidationError {
  index: number;
  message: string;
}

export function validateImages(images: ReceiptImage[]): ImageValidationError[] {
  const errors: ImageValidationError[] = [];

  images.forEach((image, index) => {
    const estimatedBytes = estimateBase64ByteLength(image.imageBase64);
    if (estimatedBytes > MAX_IMAGE_BYTES) {
      errors.push({
        index,
        message: `Image at index ${index} exceeds the maximum allowed size of ${MAX_IMAGE_BYTES} bytes.`,
      });
    }
  });

  return errors;
}

export function buildImageRequest(
  images: ReceiptImage[]
): ClaudeReceiptRequest {
  const imageBlocks: Anthropic.Messages.ImageBlockParam[] = images.map(
    (image) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: image.mediaType as Base64ImageSource["media_type"],
        data: image.imageBase64,
      } satisfies Base64ImageSource,
    })
  );

  const instructionBlock: Anthropic.Messages.TextBlockParam = {
    type: "text",
    text:
      `There are ${images.length} image(s) above, in order (index 0 to ${images.length - 1
      }). ` +
      "Analyze them per the system instructions and return only the JSON object.",
  };

  return {
    model: CLAUDE_MODEL,
    maxTokens: CLAUDE_MAX_TOKENS,
    systemPrompt: SYSTEM_PROMPT_IMAGES,
    content: [...imageBlocks, instructionBlock],
  };
}