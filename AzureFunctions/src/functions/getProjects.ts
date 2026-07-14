import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { MongoClient } from 'mongodb';

/**
 * GET /api/projects
 * Returns the list of subdivisions / projects (with their phases).
 *
 * @remarks
 * Stub implementation — replace with MongoDB query against the `projects`
 * collection when persistence is wired up.
 */
export async function getProjects(
  _req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET /api/projects');

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
    const settings = await client.db('Settings').collection<any>('_Receipts').findOne({ _id: 0 })
    await client.close()
    if (!settings || settings.length === 0) {
      return { status: 404, body: JSON.stringify({ err: true, message: "No settings found." }) };
    }
    return { body: JSON.stringify({ ...settings }) }
  } catch (error) {
    context.error(error)
    return { body: JSON.stringify({ err: true, error: error }), status: 310 }
  }
}

app.http('getProjects', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getProjects
});