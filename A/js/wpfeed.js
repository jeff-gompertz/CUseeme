// === WORDPRESS FEED HOOK ===
async function fetchWPFeed(keyword = "") {
  try {
    const API = `https://jeffgompertz.site/wp-json/wp/v2/posts?search=${encodeURIComponent(
      keyword
    )}&per_page=5`;
    const res = await fetch(API);
    const posts = await res.json();

    if (!posts.length) {
      addTickerLine(`∅ No posts found for "${keyword}"`);
      return;
    }

    posts.forEach((p, i) => {
      const title = p.title?.rendered.replace(/<[^>]*>/g, "") || "untitled";
      const excerpt =
        p.excerpt?.rendered.replace(/<[^>]*>/g, "").trim() || "";
      const line = `${i + 1}. ${title} — ${excerpt.slice(0, 90)}...`;
      addTickerLine(line);
      setTimeout(() => speakLine(title), 1000 * i);
    });
  } catch (err) {
    addTickerLine(`⚠️ WP fetch error: ${err.message}`);
  }
}

// keep feed alive
setInterval(() => fetchWPFeed(""), 60000);
fetchWPFeed("");
