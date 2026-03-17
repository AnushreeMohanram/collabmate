const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); 


const User = require('./models/User'); 
console.log('Mongo URI:', process.env.MONGO_URI);


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB");
  createAdmin();
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
});


async function createAdmin() {
  const name = 'Admin';
  const email = 'admin@collabmate.com';
  const password = 'Admin@123'; 

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
