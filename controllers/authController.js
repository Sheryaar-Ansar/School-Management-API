import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Campus from "../models/Campus.js";

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d", 
  });
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, dob } = req.body;
    const superAdmin = req.user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered!" });
    }
    if(req.user.role !== "super-admin") return res.status(403).json({error: 'Forbidden: You dont have permission for this action'})

    const user = new User({
      name,
      gender,
      email,
      password,
      contact,
      address,
      dob,
      role: "campus-admin",
      createdBy: superAdmin
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addTeacherStudent = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, role, dob } = req.body;
    const campusAdmin = req.user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered!" });
    }
    if(req.user.role !== 'super-admin' && req.user.role !== 'campus-admin') return res.status(403).json({error: 'Forbidden: You dont have permission for this action'})
    const user = new User({
      name,
      gender,
      email,
      password,
      contact,
      address,
      dob,
      role,
      createdBy: campusAdmin
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
export const register = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, role, dob } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    const user = new User({
      name,
      gender,
      email,
      password,
      contact,
      address,
      dob,
      role,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password!" });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let users = [];

    if (role === "super-admin") {
      users = await User.find()
        .select("-password")
        .populate("createdBy", "name email role")
    }

    else if (role === "campus-admin") {
      const campus = await Campus.findOne({ campusAdmin: _id }).select("_id")

      if (!campus) {
        return res.status(404).json({ message: "No campus assigned to this admin" })
      }

      users = await User.find({
        campus: campus._id, 
        role: { $in: ["teacher", "student"] },
      })
        .select("-password")
        .populate("createdBy", "name email role")
    }

    else {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(users)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error fetching users", error: error.message })
  }
}

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.role === "super-admin") {
      const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
      return res.json({ message: "User updated successfully (super-admin)", user });
    }

    if (req.user.role === "campus-admin") {
      if (
        targetUser.campus?.toString() === req.user.campus?.toString() &&
        ["teacher", "student"].includes(targetUser.role)
      ) {
        const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-password");
        return res.json({ message: "User updated successfully (campus-admin)", user });
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.user.role === "super-admin") {
      await targetUser.deleteOne();
      return res.json({ message: "User deleted successfully (super-admin)" });
    }

    if (req.user.role === "campus-admin") {
      if (
        targetUser.campus?.toString() === req.user.campus?.toString() &&
        ["teacher", "student"].includes(targetUser.role)
      ) {
        await targetUser.deleteOne();
        return res.json({ message: "User deleted successfully (campus-admin)" });
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
