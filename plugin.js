const TMDB = "https://api.themoviedb.org/3";
const PROVIDERS = {
  "Disney Plus": { name: "Disney+", pkg: "com.disney.disneyplus", label: "Abrir en Disney+" },
  "Amazon Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" },
  "Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" }
};

function getKey() { return kino.settings.tmdb_key; }

export async function search(q) {
  const key = getKey();
  if (!key) return [];
  const res = await kino.http.get(`${TMDB}/search/multi?api_key=${key}&language=es-MX&query=${encodeURIComponent(q)}&include_adult=false`);
  const data = JSON.parse(res.body);
  return data.results.filter(r => r.media_type !== 'person').slice(0, 12).map(item => ({
    id: `${item.media_type}:${item.id}`,
    title: `${item.title || item.name}`,
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
    year: (item.release_date || item.first_air_date || "").slice(0,4),
    description: "Toca para ver dónde está"
  }));
}

export async function resolve(id) {
  const key = getKey();
  const [type, tmdbId] = id.split(":");
  const endpoint = type === "tv" ? "tv" : "movie";
  const res = await kino.http.get(`${TMDB}/${endpoint}/${tmdbId}/watch/providers?api_key=${key}`);
  const data = JSON.parse(res.body);
  const mx = data.results?.MX || data.results?.US;
  if (!mx) throw new Error("No hay datos de JustWatch para este título.");
  const all = [...(mx.flatrate||[]), ...(mx.free||[]), ...(mx.rent||[]), ...(mx.buy||[])];
  const wanted = all.filter(p => PROVIDERS[p.provider_name]);
  if (wanted.length === 0) {
    const otros = all.map(p => p.provider_name).join(", ") || "ninguna";
    throw new Error(`No está en Disney+ ni Prime. Está en: ${otros}`);
  }
  return wanted.map(p => {
    const info = PROVIDERS[p.provider_name];
    return {
      title: info.label,
      url: `intent://#Intent;package=${info.pkg};end`,
      quality: info.name
    };
  });
}

export async function home() { return []; }
