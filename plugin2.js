export async function search(query) {
  return [
    {
      id: "1",
      ref: "1",
      title: "MOANA FUNCIONA",
      kind: "movie",
      poster: "https://image.tmdb.org/t/p/w342/4YZpsylmjHbW2W2KiMT1F4zR1r6.jpg"
    },
    {
      id: "2",
      ref: "2",
      title: "THE BOYS FUNCIONA",
      kind: "movie"
    }
  ];
}

export async function resolve(ref) {
  return { url: "https://www.disneyplus.com", title: "Abrir Disney+" };
}
