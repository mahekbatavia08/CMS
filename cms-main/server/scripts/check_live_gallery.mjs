async function checkPage(url) {
  console.log("Checking:", url);
  const res = await fetch(url);
  const html = await res.text();

  // Find gallery section or images
  const galleryMatches = [...html.matchAll(/<div[^>]+class=["'][^"']*gallery[^"']*["'][^>]*>[\s\S]*?<\/div>/gi)].map(m => m[0]);
  console.log("Gallery containers:", galleryMatches.length);

  // Find all images
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)].map(m => m[1]);
  console.log("Total imgs in HTML:", imgs.length);
  imgs.forEach((src, i) => console.log(`  [${i}] ${src}`));

  // Find all lightboxes or <a> tags with images (photos)
  const aImgs = [...html.matchAll(/<a[^>]+href=["']([^"']+\.(?:jpg|jpeg|png|webp))["'][^>]*>/gi)].map(m => m[1]);
  console.log("A href image links (lightbox/gallery links):", aImgs);
}

checkPage("https://www.sanginigroup.com/commercial_projects/sangini_edge").catch(console.error);
