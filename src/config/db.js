import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('Startup failed: MONGO_URI is not set. Check your .env file.');
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected💕💯: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed❌: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
