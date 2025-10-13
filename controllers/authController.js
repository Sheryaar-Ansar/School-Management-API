import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Parser } from "json2csv";
import nodemailer from 'nodemailer'

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, dob } = req.body;

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
      role: "super-admin",
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const registerCampusAdmin = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, dob } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered!" });
    }
    if (req.user.role !== "super-admin")
      return res
        .status(403)
        .json({ error: "You dont have permission for this action" });

    const user = new User({
      name,
      gender,
      email,
      password,
      contact,
      address,
      dob,
      role: "campus-admin",
      createdBy: req.user._id,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const addTeacherStudent = async (req, res) => {
  try {
    const { name, gender, email, password, contact, address, role, dob } =
      req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered!" });
    }

    if (req.user.role !== "super-admin" && req.user.role !== "campus-admin")
      return res
        .status(403)
        .json({ error: "You dont have permission for this action" });

    if (
      req.user.role === "campus-admin" &&
      !["teacher", "student"].includes(role)
    ) {
      return res
        .status(403)
        .json({ error: "Campus-admin can only create teacher or student" });
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
      createdBy: req.user._id,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
    const { role: userRole } = req.user;
    let filter = {};

    const {
      role,
      gender,
      isActive,
      search,
      pageNumber = 1,
      limit = 10,
      downloadCSV = "false",
    } = req.query;

    const skip = (parseInt(pageNumber) - 1) * parseInt(limit);

    if (userRole === "super-admin") {
      if (role) filter.role = role;
      if (gender) filter.gender = gender;
      if (isActive) filter.isActive = isActive === "true";
    } else if (userRole === "campus-admin") {
      filter.createdBy = req.user._id;
      filter.role = { $in: ["teacher", "student"] };
      if (gender) filter.gender = gender;
      if (role) filter.role = role;
      if (isActive) filter.isActive = isActive === "true";
    } else {
      return res.status(403).json({ message: "Access denied" });
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const usersQuery = User.find(filter)
      .select("name email role gender isActive createdAt")
      .sort({ createdAt: -1 });

    if (downloadCSV !== "true") {
      usersQuery.skip(skip).limit(parseInt(limit));
    }

    const users = await usersQuery;

    if (downloadCSV === "true") {
      const fields = [
        "name",
        "email",
        "role",
        "gender",
        "isActive",
        "createdAt",
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(users);

      res.header("Content-Type", "text/csv");
      res.attachment("users.csv");
      return res.send(csv);
    }

    const total = await User.countDocuments(filter);

    res.json({
      pageNumber: parseInt(pageNumber),
      limit: parseInt(limit),
      total,
      users,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const user = await User.findById(id)
      .select("name email role gender isActive createdBy")
      .populate("createdBy", "name email role");

    if (!user) return res.status(404).json({ message: "User not found" });

    if (userRole === "super-admin") {
      return res.json(user);
    } else if (userRole === "campus-admin") {
      if (
        user.createdBy?._id.toString() === req.user._id.toString() &&
        ["teacher", "student"].includes(user.role)
      ) {
        return res.json(user);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      return res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const targetUser = await User.findById(id);

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (req.user.role === "super-admin") {
      const user = await User.findByIdAndUpdate(id, updates, {
        new: true,
      }).select("-password");
      return res.json({
        message: "User updated successfully (super-admin)",
      });
    }

    if (req.user.role === "campus-admin") {
      if (
        targetUser.createdBy?.toString() === req.user._id.toString() &&
        ["teacher", "student"].includes(targetUser.role)
      ) {
        const user = await User.findByIdAndUpdate(id, updates, {
          new: true,
        }).select("-password");
        return res.json({
          message: "User updated successfully (campus-admin)",
        });
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

    if (!targetUser) return res.status(404).json({ message: "User not found" });

    if (req.user.role === "super-admin") {
      await targetUser.deleteOne();
      return res.json({ message: "User deleted successfully (super-admin)" });
    }

    if (req.user.role === "campus-admin") {
      if (
        targetUser.createdBy?.toString() === req.user._id.toString() &&
        ["teacher", "student"].includes(targetUser.role)
      ) {
        await targetUser.deleteOne();
        return res.json({
          message: "User deleted successfully (campus-admin)",
        });
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: "email is required" })
    const emailExist = await User.findOne({ email: email })
    if (!emailExist) return res.status(404).json({ error: "User not found" })
    const resetToken =  jwt.sign({userId: emailExist._id}, process.env.JWT_SECRET, {expiresIn: '5m'})
    const resetLink = `http://localhost:3000/api/auth/forget-password/${resetToken}`
    const transport =  nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PW
      }
    })
        const mailOptions = {
      from: `"School System" <${process.env.EMAIL_ID}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${emailExist.name || ""},</p>
        <p>You requested to reset your password. Click below to continue:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>This link will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };
    await transport.sendMail(mailOptions)
    res.json({message: "Password reset email sent successfully"})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
}

export const resetPassword = async (req,res) => {
  try {
      const { token } = req.params
      const { newPassword } = req.body
      if(!token) return res.status(400).json({error: "Token missing"})
      if(!newPassword) return res.status(400).json({error: "Password field required"})
      
      const decoded = await jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId)
      if(!user) return res.status(404).json({error: "User not found"})

      user.password = newPassword
      await user.save()
      res.json({messsage: "Password changed successfully"})
  } catch (error) {
    res.status(500).json({error: error.message})
  }
}
