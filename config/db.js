import mongoose from 'mongoose';

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('FATAL: MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;