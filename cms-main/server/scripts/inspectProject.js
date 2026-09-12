import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import Project from "../models/Project.js";

const del = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const res = await Project.deleteOne({ _id: "6a9e95ad43b3e74759a16cd5" });
  console.log("Deleted old corrupt document:", res);
  const remainingNaN = await Project.find({ projectTag: /NaN/i });
  console.log("Remaining NaN documents in database:", remainingNaN.length);
  process.exit(0);
};

del();
