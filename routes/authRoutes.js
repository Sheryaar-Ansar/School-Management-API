import express from "express";
import {
  login,
  register,
  getMe,
  getAllUsers,
  updateUser,
  deleteUser,
  registerCampusAdmin,
  addTeacherStudent,
  getUserById,
} from "../controllers/authController.js";
import { authenticate, authRole } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/createSuperAdmin", register);    
router.post("/register-admin", authenticate, authRole(["super-admin"]), registerCampusAdmin);
router.post("/add-user", authenticate, authRole(["campus-admin", 'super-admin']), addTeacherStudent);
router.post("/login", login);
router.get("/me", authenticate, getMe);
router.get("/users", authenticate, authRole(["super-admin", "campus-admin"]), getAllUsers);
router.get("/users/:id", authenticate, authRole(["super-admin", "campus-admin"]), getUserById);
router.put("/users/:id", authenticate, authRole(["super-admin", "campus-admin"]), updateUser);
router.delete("/users/:id", authenticate, authRole(["super-admin","campus-admin"]), deleteUser);

export default router;
