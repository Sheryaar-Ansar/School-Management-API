import axios from "axios";
import "dotenv/config";

export const openrouter = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "http://localhost:5000",
    "X-Title": "School Management System",
    "Content-Type": "application/json",
  },
});
