import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MongoClient, ObjectId } from 'mongodb';

/**
 * Generates a sequential-looking internal id for a new receipt.
 */
function generateInternalId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `R-${year}-${rand}`;
}

/**
 * POST /api/receipts
 * Persists a finalized receipt and echoes back the stored document.
 *
 * @remarks
 * Stub implementation — replace with a MongoDB `insertOne` into the
 * `receipts` collection.
 */
export async function saveReceipt(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('POST /api/receipts');
  const req = await request.json() as any

  let client: MongoClient | null = null;
  context.log("ENV KEYS:", Object.keys(process.env).filter(k => k.includes("MONGO"))); context.log("MONGO_URI value:", JSON.stringify(process.env.MONGO_URI));
  try {
    if (!process.env.MONGO_URI) {
      return {
        status: 500,
        body: JSON.stringify({ err: true, message: "MONGO_URI environment variable not set." }),
      };
    }
    try {
      client = new MongoClient(process.env.MONGO_URI);
      await client.connect();
    } catch (connectError) {
      context.error("Failed to connect to MongoDB client: " + connectError);
      return {
        status: 500,
        body: JSON.stringify({ err: true, message: "Failed to connect to MongoDB client: " + connectError }),
      }
    }

    // Extract _id if it exists, otherwise generate a new one
    const _id = req._id ? new ObjectId(req._id) : new ObjectId();

    // Ensure the document being saved has the correct _id
    const documentToSave = { ...req, _id };

    let result = await client.db('Construction').collection('Receipts').replaceOne(
      { _id },
      documentToSave,
      { upsert: true }
    );
    // let result = await client.db('Construction').collection('Receipts').insertOne(req)

    const history = await client.db('Construction').collection<any>('Receipts').find().toArray()
    await client.close()
    return { body: JSON.stringify({ result: result, history: history }) }
  } catch (error) {
    context.error(error)
    return { body: JSON.stringify({ err: true, error: error }), status: 310 }
  }
}

app.http('saveReceipt', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: saveReceipt
});