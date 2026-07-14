import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

/**
 * POST /api/receipts/upload
 * Accepts a base64-encoded image and returns a fake blob URL.
 *
 * @remarks
 * Stub implementation — replace with `@azure/storage-blob` upload
 * to the configured container when wiring up production storage.
 */
export async function uploadReceipt(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('POST /api/receipts/upload');
  const body = (await req.json().catch(() => ({}))) as { imageDataUrl?: string };

  if (!body.imageDataUrl) {
    return { status: 400, jsonBody: { error: 'imageDataUrl is required' } };
  }

  const fakeBlobName = `receipt-${Date.now()}.jpg`;
  return {
    status: 200,
    jsonBody: {
      blobUrl: `https://hfhreceipts.blob.core.windows.net/receipts/${fakeBlobName}`
    }
  };
}

app.http('uploadReceipt', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: uploadReceipt
});
