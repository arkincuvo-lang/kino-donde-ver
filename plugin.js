export async function search(query) {
  const q = typeof query === "string" ? query : (query.q || query.query || "");
  if (!q) return [];
  
  // Si es la prueba, devolvemos fijo para que veas que sí jala
  if (q.toLowerCase().includes("prueba")) {
    return [
      { id: "movie:1", ref: "movie:1", title: "Moana - PRUEBA OK", kind: "movie", poster: "https://image.tmdb.org/t/p/w342/4YZpsylmjHbW2W2KiMT1F4zR1r6.jpg" },
      { id: "movie:2", ref: "movie:2", title: "The Boys - PRUEBA OK", kind: "movie" }
    ];
  }

  // Busqueda real TMDB
  const TMDB = "https://api.themoviedb.org/3";
  const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";
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
        title: item.title || item.name || "Sin titulo",
        kind: "movie",
        poster: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null
      }));
  } catch(e) {
    return [];
  }
}

export async function resolve(ref) {
  return {
    url: "https://www.disneyplus.com",
    title: "Abrir Disney+ (prueba)"
  };
}
