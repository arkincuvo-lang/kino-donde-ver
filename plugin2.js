const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";

const PROVIDERS = {
  "Disney Plus": { name: "Disney+", pkg: "com.disney.disneyplus" },
  "Star Plus": { name: "Disney+", pkg: "com.disney.disneyplus" },
  "Amazon Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom" },
  "Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom" }
};

async function getMXProviders(type, id) {
  try {
    const url = `${TMDB}/${type === "tv" ? "tv" : "movie"}/${id}/watch/providers?api_key=${API_KEY}`;
    const r = await kino.fetch(url);
    if (!r.ok) return [];
    const data = r.json();
    const mx = data.results?.MX || data.results?.US;
    if (!mx) return [];
    const all = [...(mx.flatrate||[]), ...(mx.free||[]), ...(mx.rent||[]), ...(mx.buy||[])];
    return all.filter(p => PROVIDERS[p.provider_name]).map(p => PROVIDERS[p.provider_name].name);
  } catch {
    return [];
  }
}

export async function search(query) {
  const q = typeof query === "string" ? query : (query.q || query.query || "");
  if (!q || q.trim().length < 1) return [];
  
  const url = `${TMDB}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(q)}&include_adult=false`;
  const r = await kino.fetch(url);
  if (!r.ok) return [];
  const data = r.json();

  const items = (data.results || []).filter(x => x.media_type !== 'person').slice(0, 8);

  const withProviders = await Promise.all(items.map(async item => {
    const provs = await getMXProviders(item.media_type, item.id);
    const label = provs.length ? ` • ${provs.join(" / ")}` : "";
    return {
      id: `tmdb_${item.media_type}_${item.id}`,
      ref: `${item.media_type}:${item.id}`,
      title: `${item.title || item.name || "Sin titulo"}${label}`,
      kind: item.media_type === "tv" ? "series" : "movie",
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null
    };
  }));

  return withProviders;
}

export async function resolve(ref) {
  const [type, tmdbId] = ref.split(":");
  const url = `${TMDB}/${type === "tv" ? "tv" : "movie"}/${tmdbId}/watch/providers?api_key=${API_KEY}`;
  const r = await kino.fetch(url);
  const data = r.json();
  const mx = data.results?.MX || data.results?.US;
  
  if (!mx) throw new Error("No hay datos MX");
  
  const all = [...(mx.flatrate||[]), ...(mx.free||[]), ...(mx.rent||[]), ...(mx.buy||[])];
  const wanted = all.filter(p => PROVIDERS[p.provider_name]);
  
  if (wanted.length === 0) {
    throw new Error(`No está en Disney+ ni Prime. Está en: ${all.map(p=>p.provider_name).join(", ")}`);
  }
  
  const p = PROVIDERS[wanted[0].provider_name];
  return {
    url: `intent://#Intent;action=android.intent.action.VIEW;package=${p.pkg};end`,
    title: `Abrir en ${p.name}`
  };
}
