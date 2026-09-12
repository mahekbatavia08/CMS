import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import Project from "../models/Project.js";

const verify = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const portfolios = await Project.find({ projectCategory: "portfolio", "status.isDeleted": { $ne: true } });
  console.log("Active Master Portfolios:", portfolios.map(p => ({ id: p._id, name: p.general?.projectName })));
  
  for (const p of portfolios) {
    const childProjects = await Project.find({ parentProject: p._id, "status.isDeleted": { $ne: true } }).select("general.projectName filters.category filters.possessionStatus");
    console.log(`\nPortfolio [${p.general?.projectName}] has ${childProjects.length} child projects:`);
    childProjects.forEach((cp, idx) => {
      console.log(` ${idx + 1}. ${cp.general?.projectName} (${cp.filters?.category?.join(", ") || "-"} | ${cp.filters?.possessionStatus || "-"})`);
    });
  }
  process.exit(0);
};

verify();
