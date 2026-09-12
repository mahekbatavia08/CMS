import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: "./.env" });

const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      totalSize += getDirectorySize(fullPath);
    } else if (file.isFile()) {
      try {
        const stats = fs.statSync(fullPath);
        totalSize += stats.size;
      } catch (e) {}
    }
  }
  return totalSize;
};

const runStats = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const dbStats = await db.stats();

  // Check uploads folder sizes
  const projectRoot = path.resolve(".");
  const uploadsDir = path.join(projectRoot, "server", "public", "uploads");
  const serverUploadsDir = path.join(projectRoot, "server", "uploads");
  const clientUploadsDir = path.join(projectRoot, "client", "public", "uploads");
  
  const uploadsSize = getDirectorySize(uploadsDir) + getDirectorySize(serverUploadsDir) + getDirectorySize(clientUploadsDir);
  const totalProjectDirSize = getDirectorySize(projectRoot);

  const bytesToMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);
  const bytesToGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(4);

  console.log("=== DISK & DATABASE STORAGE STATS ===");
  console.log(`MongoDB Data Size: ${bytesToMB(dbStats.dataSize)} MB (${bytesToGB(dbStats.dataSize)} GB)`);
  console.log(`MongoDB Total Disk Storage: ${bytesToMB(dbStats.storageSize)} MB (${bytesToGB(dbStats.storageSize)} GB)`);
  console.log(`MongoDB Index Size: ${bytesToMB(dbStats.indexSize)} MB (${bytesToGB(dbStats.indexSize)} GB)`);
  console.log(`Uploaded Files & Media: ${bytesToMB(uploadsSize)} MB (${bytesToGB(uploadsSize)} GB)`);
  console.log(`Full Project Codebase + Node Modules + Media: ${bytesToMB(totalProjectDirSize)} MB (${bytesToGB(totalProjectDirSize)} GB)`);

  process.exit(0);
};

runStats();
