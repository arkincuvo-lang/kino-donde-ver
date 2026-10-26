const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";

export async function search(query) {
  const q = typeof query === "string" ? query : (query.q || query.query || "");
  if (!q) return [];

  const url = `${TMDB}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(q)}&include_adult=false`;

  try {
    const r = await kino.fetch(url);
    
    if (!r.ok) {
      // Si falla, lo mostramos como un resultado para que lo veas en la tele
      return [{
        id: "error",
        ref: "error",
        title: `ERROR TMDB ${r.status} - revisa hosts en kino-plugin.json`,
        kind: "movie"
      }];
    }

    const data = await r.json();
    
    if (!data.results || data.results.length === 0) {
      return [{
        id: "no-results",
        ref: "no-results",
        title: `TMDB respondió 0 para "${q}"`,
        kind: "movie"
      }];
    }

return data.results
  .filter(item => item.media_type !== "person")
  .slice(0, 10)
  .map(item => ({
    id: `tmdb_${item.media_type}_${item.id}`,
    ref: `${item.media_type}:${item.id}`,
    title: item.title || item.name || "Sin titulo",
    kind: item.media_type === "tv" ? "series" : "movie",
    poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null
  }));

  } catch (e) {
    // Este es el importante: si kino.fetch falla por red, lo verás aquí
    return [{
      id: "catch",
      ref: "catch",
      title: `FALLO FETCH: ${e.message}`,
      kind: "movie"
    }];
  }
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
  if (wanted.length === 0) throw new Error(`No está en Disney+ ni Prime. Está en: ${all.map(p=>p.provider_name).join(", ")}`);
  
  const p = PROVIDERS[wanted[0].provider_name];
  // ESTE es el que sí abre la app en Xiaomi Stick
  return {
    url: `intent://#Intent;action=android.intent.action.VIEW;package=${p.pkg};end`,
    title: `Abrir en ${p.name}`
  };
}
