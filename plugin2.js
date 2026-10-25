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

    const data = r.json();
    
    if (!data.results || data.results.length === 0) {
      return [{
        id: "no-results",
        ref: "no-results",
        title: `TMDB respondió 0 para "${q}"`,
        kind: "movie"
      }];
    }

    return data.results.slice(0,5).map(item => ({
      id: `${item.media_type}:${item.id}`,
      ref: `${item.media_type}:${item.id}`,
      title: item.title || item.name,
      kind: "movie",
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
  return { url: "https://www.disneyplus.com", title: "Abrir Disney+ prueba" };
}
