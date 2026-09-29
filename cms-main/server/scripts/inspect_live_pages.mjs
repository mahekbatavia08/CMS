import fs from "fs";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

async function inspectLivePages() {
  for (const p of data) {
    try {
      const res = await fetch(p.sourceUrl, { signal: AbortSignal.timeout(10000) });
      const html = await res.text();

      // Find all img tags in the HTML
      const allImgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);

      // Filter images that belong to this project (e.g. contain /Content/<Project>/)
      // or are actual photos
      console.log(`\n================================================`);
      console.log(`Project: ${p.name} (${p.slug})`);
      console.log(`Total <img> in HTML: ${allImgs.length}`);
      
      const projectSpecific = allImgs.filter(src => {
        const s = src.toLowerCase();
        return (
          !s.includes("facebook.com") &&
          !s.includes("google") &&
          !s.includes("social_media") &&
          (s.endsWith(".jpg") || s.endsWith(".jpeg") || s.endsWith(".png") || s.endsWith(".webp"))
        );
      });
      console.log(`Project specific images count: ${projectSpecific.length}`);
      projectSpecific.forEach((src, idx) => console.log(`  [${idx}] ${src}`));
    } catch (err) {
      console.warn(`Error on ${p.slug}: ${err.message}`);
    }
  }
}

inspectLivePages().catch(console.error);
