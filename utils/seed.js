require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const User = require("../models/User");

const categories = [
  { name: "Nature", icon: "🌲", description: "Mountains, lakes, valleys" },
  { name: "Food", icon: "🍽️", description: "Restaurants and local cuisine" },
  { name: "Adventure", icon: "🧗", description: "Hiking, trekking, sports" },
  { name: "Shopping", icon: "🛍️", description: "Markets and malls" },
  { name: "Historical", icon: "🏛️", description: "Forts, monuments, heritage" },
  { name: "Religious", icon: "🕌", description: "Mosques, temples, shrines" },
];

(async () => {
  try {
    await connectDB();

    // Seed categories
    await Category.deleteMany();
    await Category.insertMany(categories);
    console.log(`✅ Seeded ${categories.length} categories`);

    // Seed an admin (only if it doesn't exist)
    const adminEmail = "admin@tourismapp.com";
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: "admin123", // CHANGE THIS after first login!
        role: "admin",
      });
      console.log(`✅ Created admin: ${adminEmail} / admin123 (change it!)`);
    } else {
      console.log("ℹ️  Admin user already exists");
    }

    await mongoose.connection.close();
    console.log("✅ Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
})();
