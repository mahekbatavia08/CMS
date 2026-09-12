import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
dotenv.config({ path: "./.env" });

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const fixLegacy = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const collection = db.collection("projects");

    const allProjects = await collection.find({}).toArray();
    console.log(`Found ${allProjects.length} total projects in MongoDB.`);

    const usedSlugs = new Set();
    const usedTags = new Set();

    // First collect existing valid unique slugs and tags
    for (const p of allProjects) {
      if (p.general && p.general.slug) {
        usedSlugs.add(p.general.slug);
      }
      if (p.projectTag) {
        usedTags.add(p.projectTag);
      }
    }

    let fixedCount = 0;

    for (let index = 0; index < allProjects.length; index++) {
      const p = allProjects[index];
      let needsUpdate = false;
      const updateFields = {};

      // 1. Fix status if string or invalid
      if (typeof p.status === "string" || !p.status) {
        const rawStr = String(p.status || "").trim().toLowerCase();
        const isPub = rawStr === "active" || rawStr === "published";
        const statusVal = isPub ? "Published" : rawStr === "archived" ? "Archived" : "Draft";
        updateFields.status = {
          status: statusVal,
          published: isPub,
          featured: false,
          isDeleted: false,
        };
        needsUpdate = true;
      } else if (typeof p.status === "object") {
        if (p.status.status === "active") {
          updateFields["status.status"] = "Published";
          updateFields["status.published"] = true;
          needsUpdate = true;
        }
      }

      // 2. Fix general object & slug uniqueness
      let generalObj = p.general;
      if (!generalObj || typeof generalObj !== "object") {
        generalObj = {};
        needsUpdate = true;
      }
      const rawName = generalObj.projectName || p.projectName || `Project ${index + 1}`;
      const rawBuilder = generalObj.builderName || p.builderName || rawName || "Developer";

      let baseSlug = (generalObj.slug || p.slug || rawName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) || `project-${index + 1}`;

      // Check if this slug is duplicated across different IDs
      let targetSlug = baseSlug;
      let counter = 1;

      // Check if another project uses this slug
      const isDuplicate = allProjects.some((other) => String(other._id) !== String(p._id) && other.general && other.general.slug === targetSlug);

      if (isDuplicate || (generalObj.slug !== targetSlug && usedSlugs.has(targetSlug))) {
        targetSlug = `${baseSlug}-${String(p._id).slice(-4)}`;
        needsUpdate = true;
      }

      generalObj.projectName = rawName;
      generalObj.builderName = rawBuilder;
      generalObj.slug = targetSlug;
      usedSlugs.add(targetSlug);
      updateFields.general = generalObj;

      // 3. Fix projectTag uniqueness
      let tag = p.projectTag;
      const isTagDuplicate = !tag || allProjects.some((other) => String(other._id) !== String(p._id) && other.projectTag === tag);
      if (isTagDuplicate) {
        tag = `P${String(index + 1).padStart(4, "0")}-${String(p._id).slice(-4)}`;
        updateFields.projectTag = tag;
        needsUpdate = true;
      }
      usedTags.add(tag);

      if (needsUpdate || Object.keys(updateFields).length > 0) {
        await collection.updateOne({ _id: p._id }, { $set: updateFields });
        fixedCount++;
      }
    }

    console.log(`Successfully repaired ${fixedCount} project documents in MongoDB.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

fixLegacy();
