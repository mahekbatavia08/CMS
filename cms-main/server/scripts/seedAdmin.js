import "dotenv/config";
import mongoose from "mongoose";

import Admin from "../models/Admin.js";

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✓ Connected to MongoDB");

    const existingAdmin = await Admin.findOne({
      email: "admin@gmail.com",
    });

    if (existingAdmin) {
      console.log("⚠ Admin already exists.");
      process.exit(0);
    }

    await Admin.create({
      name: "Administrator",
      email: "admin@gmail.com",
      password: "Admin@123",
      isActive: true,
    });

    console.log("");
    console.log("==================================");
    console.log("✓ Admin created successfully");
    console.log("==================================");
    console.log("");
    console.log("Email    : admin@gmail.com");
    console.log("Password : Admin@123");
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();