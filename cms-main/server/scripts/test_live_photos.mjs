import fs from "fs";

const data = JSON.parse(fs.readFileSync("d:/360Eye/sangini-scraper/output/downloaded_projects.json", "utf-8"));

const isOtherProjectImage = (url, slug) => {
  const s = url.toLowerCase();
  // If image points to Content/Sangini_Aura/... but this project is not sangini_aura
  if (s.includes("content/sangini_aura/") && slug !== "sangini_aura") return true;
  if (s.includes("content/sangini_evoq/") && slug !== "sangini_evoq") return true;
  if (s.includes("content/sangini_nirvana/") && slug !== "sangini_nirvana") return true;
  if (s.includes("content/sangini_siddhanta/") && slug !== "sangini_siddhanta") return true;
  return false;
};

async function testLivePhotos() {
  for (const p of data) {
    const res = await fetch(p.sourceUrl);
    const html = await res.text();
    const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);

    const liveGallery = imgs.filter(src => {
      const s = src.toLowerCase();
      if (!/\.(jpe?g|png|webp)$/i.test(s)) return false;
      if (s.includes("icon") || s.includes("logo") || s.includes("plan") || s.includes("legal") || s.includes("map") || s.includes("rera") || s.includes("download") || s.includes("play-button") || s.includes("virtual-tour") || s.includes("call") || s.includes("strip") || s.includes("banner-strip")) return false;
      if (s.includes("flooring") || s.includes("deck") || s.includes("kitchen") || s.includes("wash") || s.includes("elevator") || s.includes("amenit") || s.includes("key_features") || s.includes("spec")) return false;
      if (isOtherProjectImage(src, p.slug)) return false;
      return true;
    });

    console.log(`[${p.slug}] Found ${liveGallery.length} genuine photos:`, liveGallery);
  }
}

testLivePhotos().catch(console.error);
