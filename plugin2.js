const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "TU_API_KEY";

const PROVIDERS = {
  "Disney Plus": {
    name: "Disney+",
    pkg: "com.disney.disneyplus"
  },

  "Star Plus": {
    name: "Disney+",
    pkg: "com.disney.disneyplus"
  },

  "Amazon Prime Video": {
    name: "Prime Video",
    pkg: "com.amazon.amazonvideo.livingroom"
  },

  "Prime Video": {
    name: "Prime Video",
    pkg: "com.amazon.amazonvideo.livingroom"
  },

  "Max": {
    name: "Max"
  },

  "Netflix": {
    name: "Netflix"
  },

  "Paramount Plus": {
    name: "Paramount+"
  },

  "Apple TV Plus": {
    name: "Apple TV+"
  }
};

async function getMXProviders(type, id) {
  try {
    const url =
      `${TMDB}/${type === "tv" ? "tv" : "movie"}/${id}/watch/providers?api_key=${API_KEY}`;

    const r = await kino.fetch(url);

    if (!r.ok) {
      return [];
    }

    const data = r.json();

    const region =
      data.results?.MX ||
      data.results?.US;

    if (!region) {
      return [];
    }

    // Solo servicios por suscripción
    const all = [
      ...(region.flatrate || [])
    ];

    const names = [];

    for (const p of all) {
      const provider = PROVIDERS[p.provider_name];

      if (provider && !names.includes(provider.name)) {
        names.push(provider.name);
      }
    }

    return names;

  } catch (e) {
    return [];
  }
}

export async function search(query) {

  const q =
    typeof query === "string"
      ? query
      : (query.q || "");

  if (!q.trim()) {
    return [];
  }

  const url =
    `${TMDB}/search/multi?api_key=${API_KEY}` +
    `&language=es-MX` +
    `&query=${encodeURIComponent(q)}` +
    `&include_adult=false`;

  try {

    const r = await kino.fetch(url);

    if (!r.ok) {
      return [];
    }

    const data = r.json();

    const items = (data.results || [])
      .filter(item => item.media_type !== "person")
      .slice(0, 15);

    const results = await Promise.all(
      items.map(async item => {

        const providers =
          await getMXProviders(item.media_type, item.id);

        return {
          id: `tmdb_${item.media_type}_${item.id}`,
          ref: `${item.media_type}:${item.id}`,

          title:
            item.title ||
            item.name ||
            "Sin título",

          kind:
            item.media_type === "tv"
              ? "series"
              : "movie",

          year:
            (item.release_date || item.first_air_date || "")
              .split("-")[0],

          poster:
            item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : undefined,

          overview: item.overview,

          rating: item.vote_average,

          ids: {
            tmdb: item.id
          },

          badges: providers
        };
      })
    );

    return results;

  } catch (e) {
    return [];
  }
}

export async function resolve(ref) {

  const [type, tmdbId] = ref.split(":");

  const url =
    `${TMDB}/${type === "tv" ? "tv" : "movie"}`
    + `/${tmdbId}/watch/providers?api_key=${API_KEY}`;

  const r = await kino.fetch(url);

  if (!r.ok) {
    throw new Error("TMDB no respondió");
  }

  const data = r.json();

  const region =
    data.results?.MX ||
    data.results?.US;

  if (!region) {
    throw new Error("No hay proveedores disponibles");
  }

  const all = [
    ...(region.flatrate || [])
  ];

  const available =
    all.filter(
      p => PROVIDERS[p.provider_name]
    );

  if (!available.length) {
    throw new Error(
      "No disponible en proveedores soportados"
    );
  }

  const provider =
    PROVIDERS[available[0].provider_name];

  let webUrl;

  switch (provider.name) {

    case "Disney+":
      webUrl = "https://www.disneyplus.com";
      break;

    case "Prime Video":
      webUrl = "https://www.primevideo.com";
      break;

    case "Netflix":
      webUrl = "https://www.netflix.com";
      break;

    case "Max":
      webUrl = "https://play.max.com";
      break;

    case "Paramount+":
      webUrl = "https://www.paramountplus.com";
      break;

    default:
      webUrl = "https://www.themoviedb.org";
  }

  return {
    url: webUrl,
    title: `Abrir en ${provider.name}`
  };
}
