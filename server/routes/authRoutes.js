const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const allowedRoles = ["user", "admin"];
    const userRole = allowedRoles.includes(role) ? role : "user"; // Defaults to 'user'

    // Check if user already exists (case-insensitive due to schema lowercase: true)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Password hashing is handled by the pre-save hook in the User model,
    // so we can just create the user with the plain password here.
    const newUser = new User({
      name,
      email,
      password, // Plain password here, it will be hashed by pre('save') hook
      role: userRole,
    });
    await newUser.save(); // This will trigger the pre-save hook to hash the password

    // Generate JWT token for the newly registered user
    const token = jwt.sign(
      { _id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // Respond with the token and user data, similar to login
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar, // Include avatar if you want it immediately on frontend
      },
    });

  } catch (err) {
    console.error("Error in /register:", err);
    // Handle specific MongoDB duplicate key error (E11000) if for some reason
    // the findOne check was bypassed or a race condition occurred.
    if (err.code === 11000) {
      return res.status(400).json({ message: "User with this email already exists." });
    }
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Use the comparePassword method from the User model
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Sign JWT with user ID and role
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar, // Include avatar for login response as well
      },
    });
    
  } catch (err) {
    console.error("Error in /login:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

router.get("/test", (req, res) => {
  res.send("Auth route works!");
});

// Get user by email
router.get('/email/:email', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email })
      .select('-password'); // Don't send password to client
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Fetch User by Email Error:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
