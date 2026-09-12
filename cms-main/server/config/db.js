import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
  try {
    // Only override system DNS when explicitly opted in via env var —
    // avoid silently changing DNS resolution for the whole process.
    if (process.env.MONGO_DNS_OVERRIDE === "true") {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    }

    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-repair any legacy un-migrated project documents
    try {
      const collection = conn.connection.db.collection("projects");
      const unmigrated = await collection.find({
        $or: [
          { status: { $type: "string" } },
          { status: null },
          { projectTag: { $exists: false } },
          { general: { $exists: false } }
        ]
      }).toArray();

      if (unmigrated.length > 0) {
        for (let i = 0; i < unmigrated.length; i++) {
          const doc = unmigrated[i];
          const rawStr = String(doc.status || "").trim().toLowerCase();
          const isPub = rawStr === "active" || rawStr === "published";
          const statusVal = isPub ? "Published" : rawStr === "archived" ? "Archived" : "Draft";
          
          const gen = doc.general || {};
          const name = gen.projectName || doc.projectName || `Project ${i + 1}`;
          const builder = gen.builderName || doc.builderName || "Pramukh Group";
          const slug = gen.slug || doc.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `project-${i + 1}`;

          await collection.updateOne(
            { _id: doc._id },
            {
              $set: {
                status: {
                  status: statusVal,
                  published: isPub,
                  featured: false,
                  isDeleted: false
                },
                general: {
                  projectName: name,
                  builderName: builder,
                  slug: `${slug}-${String(doc._id).slice(-4)}`
                },
                projectTag: doc.projectTag || `P${Date.now()}-${String(doc._id).slice(-4)}`
              }
            }
          );
        }
      }
    } catch (migErr) {
      console.error("Auto-repair non-critical notice:", migErr.message);
    }
  } catch (error) {
    console.error("MongoDB Connection Error:");
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
