import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import Project from "../models/Project.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/portfolio-cms");
    console.log("Connected to MongoDB");

    const projects = await Project.find({
      projectCategory: "individual",
      parentProject: { $ne: null }
    });

    console.log(`Found ${projects.length} child projects.`);

    let updatedCount = 0;

    for (const p of projects) {
      const name = (p.general?.projectName || "").toLowerCase();
      let changed = false;

      let cats = Array.isArray(p.filters?.category) ? [...p.filters.category] : [];
      let types = Array.isArray(p.filters?.propertyType) ? [...p.filters.propertyType] : [];
      let poss = p.filters?.possessionStatus || "";

      // 1. Normalize Category
      if (cats.length === 0) {
        if (name.includes("industr") || name.includes("textile park") || name.includes("eco park") || name.includes("embro park")) {
          cats = ["Industrial"];
        } else if (name.includes("commercial") || name.includes("techno park") || name.includes("market") || name.includes("trade") || name.includes("business")) {
          cats = ["Commercial"];
        } else {
          cats = ["Residential"];
        }
        changed = true;
      }

      // 2. Normalize Types
      if (types.length === 0 || types.includes("Both") || types.includes("Open Plot") || types.includes("Constructed")) {
        const cleanTypes = [];
        for (const t of types) {
          if (t === "Both") cleanTypes.push("Bungalow", "Villa");
          else if (t === "Open Plot") cleanTypes.push("Plot");
          else if (t === "Constructed") cleanTypes.push("Plot");
          else cleanTypes.push(t);
        }

        if (cleanTypes.length === 0) {
          if (name.includes("bungalow") || name.includes("bunglow")) cleanTypes.push("Bungalow");
          if (name.includes("villa")) cleanTypes.push("Villa");
          if (name.includes("plot") || name.includes("park") || name.includes("industr")) cleanTypes.push("Plot");
          if (name.includes("shop")) cleanTypes.push("Shop");
          if (name.includes("office")) cleanTypes.push("Office");
          if (name.includes("penthouse")) cleanTypes.push("Penthouse");
          if (name.includes("2 bhk") || name.includes("2bhk")) cleanTypes.push("2 BHK");
          if (name.includes("3 bhk") || name.includes("3bhk")) cleanTypes.push("3 BHK");
          if (name.includes("4 bhk") || name.includes("4bhk")) cleanTypes.push("4 BHK");
          
          if (cleanTypes.length === 0) {
            if (cats.includes("Industrial")) cleanTypes.push("Plot");
            else if (cats.includes("Commercial")) cleanTypes.push("Shop", "Office");
            else cleanTypes.push("2 BHK", "3 BHK");
          }
        }

        types = Array.from(new Set(cleanTypes));
        changed = true;
      }

      // 3. Normalize Possession Status
      const lowerPoss = poss.toLowerCase();
      let newPoss = poss;
      if (!poss || lowerPoss.includes("completed") || lowerPoss.includes("ready")) {
        newPoss = "Ready Possession";
      } else if (lowerPoss.includes("on-going") || lowerPoss.includes("ongoing") || lowerPoss.includes("under")) {
        newPoss = "Ongoing";
      } else if (lowerPoss.includes("coming") || lowerPoss.includes("soon")) {
        newPoss = "Coming Soon";
      }

      if (newPoss !== poss) {
        poss = newPoss;
        changed = true;
      }

      if (changed) {
        p.filters = {
          ...(p.filters ? p.filters.toObject?.() || p.filters : {}),
          category: cats,
          propertyType: types,
          possessionStatus: poss
        };
        await p.save();
        updatedCount++;
        console.log(`Updated: ${p.general?.projectName} -> Cat: ${cats.join(', ')} | Types: ${types.join(', ')} | Poss: ${poss}`);
      }
    }

    console.log(`Successfully updated ${updatedCount} child projects.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
