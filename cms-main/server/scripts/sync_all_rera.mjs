import fs from "fs";
import path from "path";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

async function syncReraDocs() {
  const reraManifest = {};

  for (const p of data) {
    const slug = p.slug;
    const targetDir = path.resolve(`./server/uploads/projects/${slug}`);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    let reraUrl = "";
    let reraName = p.reraNumber ? `RERA Reg. No: ${p.reraNumber}` : `${p.name} RERA Certificate`;

    // 1. Try to find direct PDF link on the live project page
    try {
      const res = await fetch(p.sourceUrl, { signal: AbortSignal.timeout(6000) });
      const html = await res.text();
      const pdfs = [...html.matchAll(/href=["']([^"']*(?:rera|formc)[^"']*\.pdf)["']/gi)].map(m => m[1]);
      if (pdfs.length > 0) {
        reraUrl = new URL(pdfs[0], p.sourceUrl).href;
      }
    } catch {}

    // 2. If no direct PDF, check if scraped images have a RERA certificate image
    if (!reraUrl) {
      const reraImg = p.images.find(img => /(?:rera|formc)/i.test(img) && !/icon|logo/i.test(img));
      if (reraImg) {
        reraUrl = reraImg;
      }
    }

    // 3. Fallback: Check Gujarat RERA portal search URL
    if (!reraUrl && p.reraNumber) {
      reraUrl = `https://gujrera.gujarat.gov.in/#/home`;
    }

    if (reraUrl && reraUrl.startsWith("http")) {
      const isPdf = /\.pdf/i.test(reraUrl);
      const ext = isPdf ? ".pdf" : (path.extname(new URL(reraUrl).pathname) || ".jpg");
      const targetFileName = `rera_certificate${ext}`;
      const targetFilePath = path.join(targetDir, targetFileName);

      console.log(`[${slug}] Downloading RERA doc from ${reraUrl}...`);
      try {
        const fileRes = await fetch(reraUrl, { signal: AbortSignal.timeout(15000) });
        if (fileRes.ok) {
          const buf = Buffer.from(await fileRes.arrayBuffer());
          fs.writeFileSync(targetFilePath, buf);
          console.log(`   Saved: ${targetFileName} (${(buf.length / 1024).toFixed(0)} KB)`);
          reraManifest[slug] = {
            url: `/uploads/projects/${slug}/${targetFileName}`,
            name: reraName,
            originalUrl: reraUrl,
          };
        }
      } catch (err) {
        console.warn(`   Download error for ${slug}: ${err.message}`);
        reraManifest[slug] = {
          url: reraUrl,
          name: reraName,
          originalUrl: reraUrl,
        };
      }
    } else {
      reraManifest[slug] = {
        url: reraUrl || "",
        name: reraName,
      };
    }
  }

  fs.writeFileSync(
    path.resolve("./server/uploads/projects/rera_manifest.json"),
    JSON.stringify(reraManifest, null, 2),
    "utf-8"
  );
  console.log("RERA sync complete and manifest saved!");
}

syncReraDocs().catch(console.error);
