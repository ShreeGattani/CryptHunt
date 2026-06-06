import { MongoClient, ObjectId } from 'mongodb';

import fs from 'fs';
import path from 'path';

// Simple fallback to load .env if process.env.DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
      if (match && match[1]) {
        process.env.DATABASE_URL = match[1];
      }
    }
  } catch (e) {
    // Ignore error loading .env
  }
}

const uri = process.env.DATABASE_URL;
if (!uri) {
  console.error("Error: DATABASE_URL environment variable is not defined.");
  console.error("Please define it in your environment or in a .env file.");
  process.exit(1);
}
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  const db = client.db("crypthunt");
  const user = await db.collection("User").findOne({ username: 'shreeeee' });
  console.log("Raw user document keys and values:");
  for (const [key, value] of Object.entries(user)) {
    console.log(`${key}: ${value} (type: ${typeof value})`);
  }
}

main().catch(console.error).finally(() => client.close());
