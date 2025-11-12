// live_camera_adapter.js
(function () {
  async function getLiveVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      const v = document.createElement("video");
      v.srcObject = stream;
      v.muted = true;
      v.playsInline = true;
      v.autoplay = true;
      v.style.display = "none";
      document.body.appendChild(v);
      try { await v.play(); } catch {}
      return v;
    } catch (e) {
      return null;
    }
  }

  async function getWpVideos(endpoint, keywords) {
    if (!endpoint) return [];
    try {
      const r = await fetch(endpoint);
      const d = await r.json();
      const K = (keywords || []).map(s => s.toLowerCase());
      const filtered = d.filter(m => {
        const title = (m.title?.rendered || "").toLowerCase();
        const caption = (m.caption?.rendered || "").replace(/<[^>]*>/g, "").toLowerCase();
        const desc = (m.description?.rendered || "").replace(/<[^>]*>/g, "").toLowerCase();
        const url = (m.source_url || "").toLowerCase();
        const isVid = m.mime_type && m.mime_type.startsWith("video/");
        const hasKw = !K.length || K.some(kw =>
          title.includes(kw) || caption.includes(kw) || desc.includes(kw) || url.includes(kw)
        );
        return isVid && hasKw;
      });

      const vids = [];
      for (const m of filtered) {
        const v = document.createElement("video");
        v.src = m.source_url;
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.style.display = "none";
        document.body.appendChild(v);
        // settle quickly; don’t hang boot
        await new Promise(res => {
          const ok = () => res();
          v.oncanplay = ok; v.onloadeddata = ok; v.onerror = ok;
          setTimeout(ok, 1200);
        });
        try { await v.play(); } catch {}
        vids.push(v);
      }
      return vids;
    } catch {
      return [];
    }
  }

  // Public API
  window.LiveSource = {
    // prefer: "live" (default) or "wp"
    async get({ prefer = "live", endpoint = "", keywords = [] } = {}) {
      if (prefer === "live") {
        const v = await getLiveVideo();
        if (v) return [v];
        // fallback → WP
        return await getWpVideos(endpoint, keywords);
      } else {
        const vids = await getWpVideos(endpoint, keywords);
        if (vids.length) return vids;
        const v = await getLiveVideo();
        return v ? [v] : [];
      }
    }
  };
})();
