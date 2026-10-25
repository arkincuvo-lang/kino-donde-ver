const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";

const PROVIDERS = {
  "Disney Plus": { pkg: "com.disney.disneyplus", label: "Abrir en Disney+" },
  "Amazon Prime Video": { pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" },
  "Prime Video": { pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" }
};

export async function search(query) {
  const q = typeof query === "string" ? query : (query.q || query.query || "");
  if (!q || q.trim().length < 1) return [];

  const url = `${TMDB}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(q)}&include_adult=false`;
  try {
    const r = await kino.fetch(url);
    if (!r.ok) return [];
    const data = r.json();
    return (data.results || [])
      .filter(x => x.media_type !== 'person')
      .slice(0, 10)
      .map(item => ({
        id: `${item.media_type}:${item.id}`,
        ref: `${item.media_type}:${item.id}`,
        title: item.title || item.name,
        kind: "movie",
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null
      }));
  } catch (e) {
    return [];
  }
}

export async function resolve(ref) {
  const [type, tmdbId] = ref.split(":");
  const endpoint = type === "tv" ? "tv" : "movie";
  const url = `${TMDB}/${endpoint}/${tmdbId}/watch/providers?api_key=${API_KEY}`;
  const r = await kino.fetch(url);
  const data = r.json();
  const mx = data.results?.MX || data.results?.US;
  if (!mx) throw new Error("Sin datos MX");
  const all = [...(mx.flatrate||[]), ...(mx.free||[]), ...(mx.rent||[]), ...(mx.buy||[])];
  const wanted = all.filter(p => PROVIDERS[p.provider_name]);
  if (wanted.length === 0) throw new Error(`No está en Disney+ ni Prime. Está en: ${all.map(p=>p.provider_name).join(", ")}`);
  const info = PROVIDERS[wanted[0].provider_name];
  return { url: `intent://#Intent;package=${info.pkg};end`, title: info.label };
}
