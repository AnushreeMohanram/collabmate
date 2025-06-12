// createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load .env variables

// Load your User model (update path if different)
const User = require('./models/User'); // Adjust this path as needed
console.log('Mongo URI:', process.env.MONGO_URI);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
  createAdmin();
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
});

// Create the admin user
async function createAdmin() {
  const name = 'Admin';
  const email = 'admin@collabmate.com';
  const password = 'Admin@123'; // You can prompt this dynamically if needed

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log("⚠️ Admin already exists:", email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await newAdmin.save();
    console.log(`✅ Admin created: ${email} (Password: ${password})`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create admin:", err);
    process.exit(1);
  }
}
