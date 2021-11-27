const { MongoClient } = require('mongodb');

const uri = process.env['MONGO_URI'];

async function connectToDB(callback) {
  const client = new MongoClient(uri, {
    useNewUrlParser: true, useUnifiedTopology: true,
  });

  try {
    await client.connect();

    await callback(client);
  } catch (e) {
    console.error(e);

    throw new Error('Could not connect to mongodb');
  }
};

module.exports = connectToDB;