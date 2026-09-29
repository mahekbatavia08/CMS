import fs from "fs";
import path from "path";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

for (const p of data) {
  const dir = path.resolve(`./server/uploads/projects/${p.slug}`);
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  console.log(`\n======================================================`);
  console.log(`PROJECT: ${p.slug} (${p.name})`);
  console.log(`Scraped images count: ${p.images.length}, Local files: ${files.length}`);
  p.images.forEach((img, idx) => {
    const isAura = /sangini_aura/i.test(img) && p.slug !== "sangini_aura";
    console.log(`  [${idx}] ${img} ${isAura ? '<<< WRONG PROJECT (AURA)' : ''}`);
  });
}
