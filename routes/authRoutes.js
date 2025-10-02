import express from "express";
import {
  signup,
  login,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
} from "../controllers/authController.js";
const router = express.Router();

router.post("/register", signup);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/users", authenticate, authRole(["super-admin"]), getAllUsers);
router.put("/users/:id", authenticate, authRole(["super-admin", "campus-admin"]), updateUser);
router.delete("/users/:id", authenticate, authRole(["super-admin"]), deleteUser);
export default router;
