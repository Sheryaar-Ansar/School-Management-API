import express from "express";
import "dotenv/config";
import connectDB from "./db/index.js";
import authRoutes from "./routes/authRoutes.js"

import campusRoutes from './routes/campusRoutes.js'

const app = express();

connectDB();
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes)
app.use('/api/campuses', campusRoutes)


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on localhost:${port}`);
});
