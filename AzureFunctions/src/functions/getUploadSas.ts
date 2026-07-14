// Azure Function: getUploadSas.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import {
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const accountName = process.env.STORAGE_ACCOUNT_NAME!;
const containerName = process.env.STORAGE_CONTAINER_NAME!;
const storageKey = process.env.STORAGE_ACCOUNT_KEY!;

export async function getUploadSas(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {

    ctx.log('accountName', accountName, containerName, storageKey)

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, storageKey);
    var expiryDate = new Date();
    expiryDate.setMinutes(expiryDate.getMinutes() + 10);

    const sas = generateBlobSASQueryParameters({
      containerName: containerName,
      permissions: ContainerSASPermissions.parse('cw'),
      expiresOn: expiryDate,
    }, sharedKeyCredential);

    return {
      jsonBody: {
        containerUrl: `https://${accountName}.blob.core.windows.net/${containerName}?${sas}`,
      },
    };
  } catch (err: any) {
    ctx.error("getUploadSas failed", err);
    return { status: 500, jsonBody: { error: err.message ?? String(err) } };
  }
}

app.http("getUploadSas", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: getUploadSas,
});