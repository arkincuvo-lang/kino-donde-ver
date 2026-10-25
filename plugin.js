export async function search(query) {
  const q = typeof query === "string" ? query : (query.q || "");
  // Devuelve siempre 2 resultados de prueba sin llamar a internet
  return [
    {
      id: "movie:123",
      ref: "movie:123",
      title: `Prueba: buscaste "${q}" - Moana`,
      kind: "movie",
      poster: "https://image.tmdb.org/t/p/w342/4YZpsylmjHbW2W2KiMT1F4zR1r6.jpg"
    },
    {
      id: "tv:123",
      ref: "tv:123",
      title: `Prueba: The Boys para "${q}"`,
      kind: "tv"
    }
  ];
}

export async function resolve(ref) {
  return {
    url: "https://www.disneyplus.com",
    title: "Abrir Disney+ (prueba)"
  };
}
