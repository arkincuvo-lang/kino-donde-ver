const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";

const PROVIDERS = {
  "Disney Plus": { name: "Disney+", pkg: "com.disney.disneyplus", label: "Abrir en Disney+" },
  "Amazon Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" },
  "Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" }
};

export async function search(query) {
  // Kino a veces manda string, a veces objeto {q: "..."} - soportamos los dos
  const q = typeof query === "string" ? query : (query.q || query.query || "");
  if (!q || q.trim().length < 2) return [];

  const url = `${TMDB}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(q)}&include_adult=false`;
  const r = await kino.fetch(url);
  
  if (!r.ok) {
    throw new Error(`TMDB error ${r.status} - revisa tu API key`);
  }
  
  const data = r.json();
  if (!data.results) return [];

  return data.results
    .filter(x => x.media_type !== 'person' && (x.title || x.name))
    .slice(0, 10)
    .map(item => ({
      id: `${item.media_type}:${item.id}`,
      ref: `${item.media_type}:${item.id}`,
      title: item.title || item.name,
      kind: item.media_type === 'tv' ? 'tv' : 'movie',
      poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null
    }));
}

export async function resolve(ref) {
  const [type, tmdbId] = ref.split(":");
  const endpoint = type === "tv" ? "tv" : "movie";
  const url = `${TMDB}/${endpoint}/${tmdbId}/watch/providers?api_key=${API_KEY}`;
  const r = await kino.fetch(url);
  const data = r.json();
  const mx = data.results?.MX || data.results?.US;

  if (!mx) throw new Error("No hay datos de JustWatch para este título");

  const all = [...(mx.flatrate||[]), ...(mx.free||[]), ...(mx.rent||[]), ...(mx.buy||[])];
  const wanted = all.filter(p => PROVIDERS[p.provider_name]);

  if (wanted.length === 0) {
    const otros = all.map(p => p.provider_name).join(", ") || "ninguna";
    throw new Error(`No está en Disney+ ni Prime. Está en: ${otros}`);
  }

  const p = wanted[0];
  const info = PROVIDERS[p.provider_name];
  return {
    url: `intent://#Intent;package=${info.pkg};end`,
    title: info.label
  };
}
