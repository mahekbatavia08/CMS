import fs from "fs";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

for (const p of data) {
  console.log(`\n======================================================`);
  console.log(`SLUG: ${p.slug} (${p.name})`);
  p.images.forEach((img, idx) => {
    console.log(`[${idx}] ${img}`);
  });
}
