const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://localhost:27017/analytics_platform';

async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ U lidh me MongoDB me sukses!');
  } catch (err) {
    console.error('❌ MongoDB lidhja dështoi:', err.message);
  }
}

module.exports = { connectMongo, mongoose };