const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const database = client.db('forexflow');

  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

connectToMongoDB();
