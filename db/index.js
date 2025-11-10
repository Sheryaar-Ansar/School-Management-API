import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/school-management-system";

  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });
    logger.info("MongoDB connected successfully!");
  } catch (error) {
    logger.error("MongoDB connection failed:", error);
    process.exit(1); // Stop the server if DB is not connected
  }
};

export default connectDB;
