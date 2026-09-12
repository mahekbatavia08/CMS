import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import Project from "../models/Project.js";
import { syncProjectFilters } from "../services/filterService.js";

const pdfData = [
  { id: 1, name: "Happiness Residency", possession: "Completed", category: "Residential", type: "", area: "Amroli", timing: "" },
  { id: 2, name: "Nena Bungalows", possession: "On-going", category: "Residential", type: "Both", area: "New Mota Varachha", timing: "6 Month" },
  { id: 3, name: "Pragati Eco Park", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 4, name: "Pramukh ABC Bungalows", possession: "On-going", category: "Residential", type: "Open Plot", area: "Mota Varachha", timing: "6 Month" },
  { id: 5, name: "Pramukh ABC Bunglows Amroli", possession: "Completed", category: "Residential", type: "", area: "Amroli", timing: "" },
  { id: 6, name: "Pramukh ABC Embro Park", possession: "Completed", category: "Industrial", type: "Constructed", area: "Nr Ring Road", timing: "" },
  { id: 7, name: "Pramukh ABC Embro Park 1", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 8, name: "Pramukh ABC Embro Park 2", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 9, name: "Pramukh ABC Embro Park 3", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 10, name: "Pramukh ABC Embro Park 4", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 11, name: "Pramukh ABC Embro Park 5", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 12, name: "Pramukh ABC Embro Park 6", possession: "On-going", category: "Industrial", type: "Both", area: "Nr Ring Road", timing: "8 Month" },
  { id: 13, name: "Pramukh ABC Embro Park 7", possession: "On-going", category: "Industrial", type: "Both", area: "Nr Ring Road", timing: "8 Month" },
  { id: 14, name: "Pramukh ABC Embro Park 8", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 15, name: "Pramukh ABC Embro Park 9", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 16, name: "Pramukh ABC Embro Park 10", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 17, name: "Pramukh ABC Embro Park 11", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 18, name: "Pramukh ABC Embro Park 12", possession: "On-going", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 19, name: "Pramukh ABC Embro Park 13", possession: "On-going", category: "Industrial", type: "Constructed", area: "Nr Ring Road", timing: "8 Month" },
  { id: 20, name: "Pramukh ABC Techno park 14", possession: "On-going", category: "Industrial", type: "Open Plot", area: "Nr Ring Road", timing: "3 Month" },
  { id: 21, name: "Pramukh ABC Techno Park 15", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 22, name: "Pramukh ABC Techno Park 16", possession: "On-going", category: "Industrial", type: "Open Plot", area: "Nr Ring Road", timing: "12 Month" },
  { id: 23, name: "Pramukh ABC Techno Park 17", possession: "On-going", category: "Industrial", type: "Open Plot", area: "Nr Ring Road", timing: "12 Month" },
  { id: 24, name: "Pramukh ABC Techno Park 18", possession: "Coming soon", category: "Industrial", type: "Open Plot", area: "Nr Ring Road", timing: "Other" },
  { id: 25, name: "Pramukh ABC Villa", possession: "On-going", category: "Residential", type: "Open Plot", area: "New Mota Varachha", timing: "6 Month" },
  { id: 26, name: "Pramukh Avenue", possession: "Completed", category: "Residential", type: "", area: "Amroli", timing: "" },
  { id: 27, name: "Pramukh Heights", possession: "Completed", category: "Residential", type: "", area: "Amroli", timing: "" },
  { id: 28, name: "Pramukh Residency", possession: "Completed", category: "Residential", type: "", area: "Amroli", timing: "" },
  { id: 29, name: "Prem Majestica", possession: "On-going", category: "Residential", type: "Both", area: "Jahangirabad", timing: "12 Month" },
  { id: 30, name: "Shree Ganesh Industries", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 31, name: "Shree Hari Industries", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 32, name: "Shree Ram Industries", possession: "Completed", category: "Industrial", type: "", area: "Nr Ring Road", timing: "" },
  { id: 33, name: "Velvet Valley", possession: "On-going", category: "Residential", type: "Both", area: "Uttran", timing: "6 Month" },
  { id: 34, name: "Vista Velly", possession: "Coming soon", category: "Residential", type: "", area: "Uttran", timing: "" },
  { id: 35, name: "Pramukh Industrial Park 1", possession: "Coming soon", category: "Industrial", type: "Open Plot", area: "Atoadra", timing: "Other" },
  { id: 36, name: "Pramukh Industrial Park 2", possession: "Coming soon", category: "Industrial", type: "Open Plot", area: "Atoadra", timing: "Other" },
  { id: 37, name: "Pramukh Textile Park", possession: "Coming soon", category: "Industrial", type: "Open Plot", area: "Paria", timing: "Other" },
  { id: 38, name: "Maroli Plotting Project", possession: "Coming soon", category: "Industrial", type: "Open Plot", area: "Maroli", timing: "" },
];

const mapPossessionStatus = (status) => {
  if (!status) return "Ready Position";
  const s = status.toLowerCase();
  if (s.includes("completed")) return "Ready Position";
  if (s.includes("on-going") || s.includes("ongoing")) return "Ongoing";
  if (s.includes("coming")) return "Coming Soon";
  return "Ready Position";
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB:", process.env.MONGODB_URI);

    // 1. Create or ensure Master Portfolio card named "Pramukh ABC"
    let masterPortfolio = await Project.findOne({
      projectCategory: "portfolio",
      "general.projectName": "Pramukh ABC",
      "status.isDeleted": { $ne: true },
    });

    if (!masterPortfolio) {
      // Find any existing portfolio card to rename to Pramukh ABC
      masterPortfolio = await Project.findOne({
        projectCategory: "portfolio",
        "status.isDeleted": { $ne: true },
      });
    }

    if (!masterPortfolio) {
      masterPortfolio = await Project.create({
        projectTag: "PORT-PRAMUKH-ABC",
        projectCategory: "portfolio",
        parentProject: null,
        general: {
          projectName: "Pramukh ABC",
          builderName: "Pramukh Group",
          slug: "pramukh-abc",
          description: "Pramukh ABC Master Portfolio encompassing all 38 residential, industrial, and commercial developments across prime corridors.",
        },
        filters: {
          category: ["Residential", "Industrial"],
          propertyType: ["Open Plot", "Constructed", "Both"],
          city: "Surat",
          area: ["Amroli", "New Mota Varachha", "Nr Ring Road", "Mota Varachha", "Jahangirabad", "Uttran", "Atoadra", "Paria", "Maroli"],
        },
        status: { status: "Published", published: true, featured: true, isDeleted: false },
        mapSkin: "default",
      });
      console.log("Created Master Portfolio 'Pramukh ABC':", masterPortfolio._id);
    } else {
      masterPortfolio.general.projectName = "Pramukh ABC";
      masterPortfolio.general.builderName = "Pramukh Group";
      masterPortfolio.general.slug = "pramukh-abc";
      masterPortfolio.general.description = "Pramukh ABC Master Portfolio encompassing all 38 residential, industrial, and commercial developments across prime corridors.";
      masterPortfolio.status.isDeleted = false;
      masterPortfolio.status.status = "Published";
      await masterPortfolio.save();
      console.log("Updated existing Master Portfolio to 'Pramukh ABC':", masterPortfolio._id);
    }

    // Soft-delete any other portfolio cards so only "Pramukh ABC" remains as the single master project card
    await Project.updateMany(
      {
        projectCategory: "portfolio",
        _id: { $ne: masterPortfolio._id },
      },
      {
        $set: { "status.isDeleted": true }
      }
    );

    // 2. Insert/Update the 38 projects under this master portfolio
    let createdCount = 0;
    let updatedCount = 0;

    for (const item of pdfData) {
      const slug = slugify(item.name);
      const tag = `PROJ-${String(item.id).padStart(3, "0")}`;

      const categoryArr = item.category ? [item.category] : ["Residential"];
      const propertyTypeArr = item.type ? [item.type] : [];
      const areaArr = item.area ? [item.area] : [];
      const possStatus = mapPossessionStatus(item.possession);

      const updateData = {
        projectTag: tag,
        projectCategory: "individual",
        parentProject: masterPortfolio._id,
        general: {
          projectName: item.name,
          builderName: "Pramukh Group",
          slug: slug,
          description: `${item.name} is a prime ${item.category || "development"} project located at ${item.area || "prime location"}. Possession timing: ${item.timing || item.possession || "Ready"}.`,
          area: item.area || "",
        },
        filters: {
          category: categoryArr,
          propertyType: propertyTypeArr,
          possessionStatus: possStatus,
          city: "Surat",
          area: areaArr,
          tags: item.timing ? [item.timing] : [],
        },
        status: {
          status: "Published",
          published: true,
          featured: [1, 2, 4, 6, 12, 19, 20, 25, 29, 33, 35].includes(item.id),
          isDeleted: false,
        },
        mapSkin: "default",
      };

      const existing = await Project.findOne({
        $or: [
          { "general.projectName": item.name },
          { projectTag: tag },
          { "general.slug": slug },
        ],
      });

      if (existing) {
        Object.assign(existing, updateData);
        existing.status.isDeleted = false;
        await existing.save();
        await syncProjectFilters(existing);
        updatedCount++;
      } else {
        const created = await Project.create(updateData);
        await syncProjectFilters(created);
        createdCount++;
      }
    }

    console.log(`Successfully imported projects! Created: ${createdCount}, Updated: ${updatedCount}, Total: ${pdfData.length}`);
    process.exit(0);
  } catch (err) {
    console.error("Error importing PDF data:", err);
    process.exit(1);
  }
};

run();
