const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1"; // <-- CAMBIA ESTO

const PROVIDERS = {
  "Disney Plus": { name: "Disney+", pkg: "com.disney.disneyplus", label: "Abrir en Disney+" },
  "Amazon Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" },
  "Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom", label: "Abrir en Prime Video" }
};

export async function search(query) {
  const q = query.q;
  if (!API_KEY || API_KEY.includes("PEGA_AQUI")) throw new Error("Falta poner tu API key en plugin.js");
  
  const url = `${TMDB}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(q)}&include_adult=false`;
  const r = await kino.fetch(url);
  if (!r.ok) throw new Error("TMDB respondió " + r.status);
  const data = r.json();

  return data.results.filter(x => x.media_type !== 'person').slice(0, 10).map(item => ({
    id: `${item.media_type}:${item.id}`,
    ref: `${item.media_type}:${item.id}`,
    title: item.title || item.name,
    kind: "movie",
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
    year: (item.release_date || item.first_air_date || "").slice(0,4)
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

  // Devuelve el lanzador a la app oficial
  const p = wanted[0];
  const info = PROVIDERS[p.provider_name];
  return {
    url: `intent://#Intent;package=${info.pkg};end`,
    title: info.label
  };
}
