import { chromium } from "playwright";
import mongoose from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config({ path: "../server/.env" });

const Admin = mongoose.model("Admin", new mongoose.Schema({}, { strict: false }), "admins");
await mongoose.connect(process.env.MONGODB_URI);
const admin = await Admin.findOne({});
const token = jwt.sign({ id: admin._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
await mongoose.disconnect();

const projectId = "6a996a7916fb88835f35789d"; // Emerald Heights, individual, no parent

const browser = await chromium.launch();
const page = await browser.newPage();

page.on("console", (msg) => console.log("[console]", msg.type(), msg.text()));
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

const patchRequests = [];
page.on("request", (req) => {
  if (req.method() === "PATCH" && req.url().includes(`/projects/${projectId}`)) {
    patchRequests.push({ url: req.url(), body: req.postData() });
  }
});

await page.goto("http://localhost:5173/login");
await page.evaluate((t) => sessionStorage.setItem("accessToken", t), token);

await page.goto(`http://localhost:5173/projects/${projectId}/edit`, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Find the YouTube Link input by its placeholder
const ytInput = page.locator('input[placeholder="https://youtube.com/..."]');
await ytInput.waitFor({ state: "visible", timeout: 10000 });
await ytInput.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
await ytInput.blur();

console.log("Value in field after fill:", await ytInput.inputValue());

// Wait past the 1200ms autosave debounce
await page.waitForTimeout(2500);

console.log("PATCH requests captured:", JSON.stringify(patchRequests, null, 2));

await browser.close();
