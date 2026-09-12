import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import Project from "../models/Project.js";

const fix = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const nanProjects = await Project.find({ projectTag: /NaN/i });
  console.log("Found NaN projects:", nanProjects.length);
  for (let p of nanProjects) {
    const newTag = "PROJ-FIX-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    await Project.updateOne({ _id: p._id }, { $set: { projectTag: newTag } });
    console.log("Fixed project tag for:", p._id, "->", newTag);
  }
  process.exit(0);
};

fix();
