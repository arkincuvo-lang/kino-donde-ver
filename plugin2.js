const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";

const PROVIDERS = {
  "Disney Plus": "Disney+",
  "Star Plus": "Disney+",
  "Prime Video": "Prime Video",
  "Amazon Prime Video": "Prime Video",
  "Amazon Video": "Prime Video",
  "Netflix": "Netflix",
  "Max": "Max",
  "Apple TV Plus": "Apple TV+",
  "Paramount Plus": "Paramount+"
};

async function getMXProviders(type, id) {
  try {

    const url =
      `${TMDB}/${type === "tv" ? "tv" : "movie"}/${id}/watch/providers?api_key=${API_KEY}`;

    const r = await kino.fetch(url);

    if (!r.ok) return [];

    const data = r.json();

    const region =
      data.results?.MX ||
      data.results?.US;

    if (!region) return [];

    const all = [
      ...(region.flatrate || [])
    ];

    // DEVUELVE TODOS LOS NOMBRES PARA VER QUÉ ESTÁ MANDANDO TMDB
const providers = [...new Set(
  all.map(p =>
    PROVIDERS[p.provider_name] || p.provider_name
  )
)];

  } catch (e) {
    return [];
  }
}

export async function search(query) {

  const q =
    typeof query === "string"
      ? query
      : (query.q || "");

  if (!q) return [];

  const url =
    `${TMDB}/search/multi?api_key=${API_KEY}` +
    `&language=es-MX` +
    `&query=${encodeURIComponent(q)}` +
    `&include_adult=false`;

  try {

    const r = await kino.fetch(url);

    if (!r.ok) return [];

    const data = r.json();

    return await Promise.all(

      (data.results || [])
        .filter(x => x.media_type !== "person")
        .slice(0, 10)
        .map(async item => {

          const providers =
            await getMXProviders(
              item.media_type,
              item.id
            );

          const label =
            providers.length
              ? ` • ${providers.join(" | ")}`
              : "";

          return {

            id: `tmdb_${item.media_type}_${item.id}`,

            ref: `${item.media_type}:${item.id}`,

            title:
              `${item.title || item.name || "Sin título"}${label}`,

            kind:
              item.media_type === "tv"
                ? "series"
                : "movie",

            poster:
              item.poster_path
                ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                : undefined
          };
        })
    );

  } catch (e) {
    return [];
  }
}

export async function resolve(ref) {

  const [type, tmdbId] = ref.split(":");

  const url =
    `${TMDB}/${type === "tv" ? "tv" : "movie"}/${tmdbId}/watch/providers?api_key=${API_KEY}`;

  const r = await kino.fetch(url);

  if (!r.ok) {
    throw new Error("Error TMDB");
  }

  const data = r.json();

  const region =
    data.results?.MX ||
    data.results?.US;

  if (!region) {
    throw new Error("No hay proveedores");
  }

  const all = [
    ...(region.flatrate || [])
  ];

  const disney = all.find(p =>
    p.provider_name === "Disney Plus" ||
    p.provider_name === "Star Plus"
  );

  if (disney) {
    return {
      url: "https://www.disneyplus.com",
      title: "Abrir Disney+"
    };
  }

  const prime = all.find(p =>
    p.provider_name === "Prime Video" ||
    p.provider_name === "Amazon Prime Video" ||
    p.provider_name === "Amazon Video"
  );

  if (prime) {
    return {
      url: "https://www.primevideo.com",
      title: "Abrir Prime Video"
    };
  }

  throw new Error(
    "Disponible en: " +
    all.map(p => p.provider_name).join(", ")
  );
}
