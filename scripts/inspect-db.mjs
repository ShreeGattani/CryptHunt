import { MongoClient, ObjectId } from 'mongodb';

const uri = "mongodb+srv://user:TxdZ0RDEk6pwK1ma@cluster0.aetqwrw.mongodb.net/crypthunt?retryWrites=true&w=majority";
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
