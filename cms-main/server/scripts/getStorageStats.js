import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import Project from "../models/Project.js";

const getStats = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const totalProjects = await Project.countDocuments({ "status.isDeleted": { $ne: true } });
  const portfolios = await Project.find({ projectCategory: "portfolio", "status.isDeleted": { $ne: true } });
  const individualProjects = await Project.find({ projectCategory: "individual", "status.isDeleted": { $ne: true } });

  const publishedCount = await Project.countDocuments({ "status.published": true, "status.isDeleted": { $ne: true } });
  const draftCount = await Project.countDocuments({ "status.published": false, "status.isDeleted": { $ne: true } });
  
  console.log("=== PROJECT STORAGE SUMMARY ===");
  console.log(`Total Active Documents: ${totalProjects}`);
  console.log(`Master Portfolios: ${portfolios.length}`);
  console.log(`Individual Projects: ${individualProjects.length}`);
  console.log(`Published Projects: ${publishedCount}`);
  console.log(`Draft Projects: ${draftCount}`);

  for (const p of portfolios) {
    const children = await Project.find({ parentProject: p._id, "status.isDeleted": { $ne: true } });
    console.log(`\nMaster Card: "${p.general?.projectName}"`);
    console.log(` -> Sub-projects Stored Inside: ${children.length}`);
  }

  process.exit(0);
};

getStats();
