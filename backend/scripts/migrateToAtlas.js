import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = 'mongodb://localhost:27017/student-management-system';
const ATLAS_URI = process.env.MONGO_URI || 'mongodb+srv://Admin:SMS-admin@sms.83tvecw.mongodb.net/student-management?retryWrites=true&w=majority&appName=SMS';

async function migrate() {
  let localConn;
  let atlasConn;

  try {
    console.log('Connecting to Local MongoDB...');
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('Connected to Local MongoDB.');

    console.log('Connecting to Atlas MongoDB...');
    atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('Connected to Atlas MongoDB.');

    // Get list of collections from local database
    const collections = await localConn.db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections locally.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      console.log(`\nMigrating collection: "${colName}"...`);

      // Read documents from local
      const localCollection = localConn.db.collection(colName);
      const docs = await localCollection.find({}).toArray();
      console.log(`- Local documents count: ${docs.length}`);

      // Get target collection in Atlas
      const atlasCollection = atlasConn.db.collection(colName);

      // Drop existing collection in Atlas to avoid duplicates
      try {
        await atlasCollection.drop();
        console.log(`- Cleared existing Atlas collection: "${colName}"`);
      } catch (dropErr) {
        // Ignore if collection doesn't exist
      }

      if (docs.length > 0) {
        // Insert documents into Atlas
        const result = await atlasCollection.insertMany(docs);
        console.log(`- Successfully inserted ${result.insertedCount} documents into Atlas.`);
      } else {
        console.log(`- Collection is empty, skipping insertion.`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (localConn) await localConn.close();
    if (atlasConn) await atlasConn.close();
  }
}

migrate();
