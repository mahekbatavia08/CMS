import fs from "fs";
import path from "path";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

const isOtherProjectImage = (url, slug) => {
  const s = url.toLowerCase();
  if (s.includes("content/sangini_aura/") && slug !== "sangini_aura") return true;
  if (s.includes("content/sangini_evoq/") && slug !== "sangini_evoq") return true;
  if (s.includes("content/sangini_nirvana/") && slug !== "sangini_nirvana") return true;
  if (s.includes("content/sangini_siddhanta/") && slug !== "sangini_siddhanta") return true;
  return false;
};

const isIconOrUiGraphic = (url) => {
  const s = url.toLowerCase();
  return (
    s.includes("icon") ||
    s.includes("logo") ||
    s.includes("social_media") ||
    s.includes("play-button") ||
    s.includes("virtual-tour") ||
    s.includes("download") ||
    s.includes("call") ||
    s.includes("map") ||
    s.includes("strip") ||
    s.includes("key_features") ||
    s.includes("amenit") ||
    s.includes("spec") ||
    s.includes("flooring") ||
    s.includes("deck") ||
    s.includes("kitchen") ||
    s.includes("wash") ||
    s.includes("elevator") ||
    s.includes("sbi")
  );
};

const isFloorPlanImage = (url) => {
  const s = url.toLowerCase();
  return (
    s.includes("/plans/") ||
    s.includes("/layoutplans/") ||
    s.includes("/onsite/") ||
    s.includes("floor") ||
    s.includes("plan") ||
    s.includes("penthouse") ||
    s.includes("unit")
  );
};

const isLegalDocumentImage = (url) => {
  const s = url.toLowerCase();
  return (
    s.includes("legal") ||
    s.includes("rera") ||
    s.includes("certificate") ||
    s.includes("permission") ||
    s.includes("noc") ||
    s.includes("na_order") ||
    s.includes("naorder") ||
    s.includes("landdocument") ||
    s.includes("formc") ||
    s.includes("airport")
  );
};

async function downloadLivePhotos() {
  const manifest = {};

  for (const p of data) {
    const slug = p.slug;
    const targetDir = path.resolve(`./server/uploads/projects/${slug}`);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    let imgs = [];
    try {
      const res = await fetch(p.sourceUrl, { signal: AbortSignal.timeout(8000) });
      const html = await res.text();
      imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
    } catch (e) {
      console.warn(`Failed fetch for ${slug}:`, e.message);
    }

    const genuinePhotos = [];
    for (const src of imgs) {
      const s = src.toLowerCase();
      if (!/\.(jpe?g|png|webp)$/i.test(s)) continue;
      if (isOtherProjectImage(src, slug)) continue;
      if (isIconOrUiGraphic(src)) continue;
      if (isFloorPlanImage(src)) continue;
      if (isLegalDocumentImage(src)) continue;

      let fullUrl = src;
      if (!fullUrl.startsWith("http")) {
        fullUrl = new URL(src, p.sourceUrl).href;
      }

      if (!genuinePhotos.includes(fullUrl)) {
        genuinePhotos.push(fullUrl);
      }
    }

    console.log(`[${slug}] Downloading ${genuinePhotos.length} genuine photos...`);
    const savedLocal = [];

    for (let i = 0; i < genuinePhotos.length; i++) {
      const photoUrl = genuinePhotos[i];
      const ext = path.extname(new URL(photoUrl).pathname) || ".jpg";
      const fileName = `live_photo_${i + 1}${ext}`;
      const filePath = path.join(targetDir, fileName);

      if (!fs.existsSync(filePath)) {
        try {
          const fres = await fetch(photoUrl, { signal: AbortSignal.timeout(10000) });
          if (fres.ok) {
            const buf = Buffer.from(await fres.arrayBuffer());
            fs.writeFileSync(filePath, buf);
            console.log(`   Saved ${fileName} (${(buf.length / 1024).toFixed(0)} KB)`);
          }
        } catch (err) {
          console.warn(`   Failed to download ${photoUrl}: ${err.message}`);
        }
      }

      if (fs.existsSync(filePath)) {
        savedLocal.push(`/uploads/projects/${slug}/${fileName}`);
      }
    }

    manifest[slug] = savedLocal;
  }

  fs.writeFileSync(
    path.resolve("./server/uploads/projects/live_photos_manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );
  console.log("All genuine live photos processed and manifest saved!");
}

downloadLivePhotos().catch(console.error);
