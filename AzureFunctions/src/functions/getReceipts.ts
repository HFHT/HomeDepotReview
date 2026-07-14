import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MongoClient } from 'mongodb';

/**
 * GET /api/receipts
 * Returns an empty array for now.
 *
 * @remarks
 * Stub implementation — replace with a MongoDB `find` filtered by the
 * authenticated user's OID.
 */
export async function getReceipts(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET /api/receipts');
  const user = request.query.get('user')
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
    const filter: Record<string, any> = {}
    if (user !== null) {
      filter.user = user
    }

    const history = await client
      .db('Construction')
      .collection<any>('Receipts')
      .find(filter)
      .toArray()
    // const history = await client.db('Construction').collection<any>('Receipts').find({ user: user }).toArray()
    await client.close()
    return { body: JSON.stringify({ history: history }) }
  } catch (error) {
    context.error(error)
    return { body: JSON.stringify({ err: true, error: error }), status: 310 }
  }
}

app.http('getReceipts', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getReceipts
});