import express from "express";
import {
  login,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  registerAdmin,
  addTeacherStudent,
} from "../controllers/authController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/register-admin", authenticate, authRole(["super-admin"]), registerAdmin);
router.post("/add-user", authenticate, authRole(["campus-admin"]), addTeacherStudent);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/users", authenticate, authRole(["super-admin, campus-admin"]), getAllUsers);
router.put("/users/:id", authenticate, authRole(["super-admin", "campus-admin"]), updateUser);
router.delete("/users/:id", authenticate, authRole(["super-admin"]), deleteUser);

export default router;
