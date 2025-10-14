import mongoose from "mongoose";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/school-management-system";
    await mongoose.connect(mongoURI);
    logger.info("MongoDB connected successfully!");
  } catch (error) {
    logger.error(error.message);
  }
};

export default connectDB