import fs from "fs";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

async function findReraDocs() {
  for (const p of data) {
    console.log(`\n======================================================`);
    console.log(`PROJECT: ${p.name} (${p.slug})`);
    console.log(`RERA Number from scraped: ${p.reraNumber}`);

    // Check images in downloaded_projects.json
    const reraImg = p.images.find(img => /rera|formc/i.test(img));
    console.log(`RERA image in scraped data: ${reraImg || "NONE"}`);

    // Also fetch live page to see any RERA pdf or link
    try {
      const res = await fetch(p.sourceUrl, { signal: AbortSignal.timeout(6000) });
      const html = await res.text();
      const reraLinks = [...html.matchAll(/href=["']([^"']*(?:rera|formc)[^"']*)["']/gi)].map(m => m[1]);
      console.log(`RERA links in live HTML:`, reraLinks);
      
      const reraNumberMatch = html.match(/PR\/GJ\/[A-Z0-9_\/]+/i) || html.match(/RERA Reg[^\n<]+/i);
      console.log(`RERA match in HTML text:`, reraNumberMatch?.[0]);
    } catch (e) {
      console.log(`Error fetching page:`, e.message);
    }
  }
}

findReraDocs().catch(console.error);
