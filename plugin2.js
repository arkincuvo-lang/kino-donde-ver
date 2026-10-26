const TMDB = "https://api.themoviedb.org/3";
const API_KEY = "9d185627a7959b27ea6c2b6acfe308a1";

const PROVIDERS = {
  "Disney Plus": { name: "Disney+", pkg: "com.disney.disneyplus" },
  "Star Plus": { name: "Disney+", pkg: "com.disney.disneyplus" },
  "Amazon Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom" },
  "Prime Video": { name: "Prime Video", pkg: "com.amazon.amazonvideo.livingroom" }
};

async function getMXProviders(type, id) {
  try {
    const url = `${TMDB}/${type === "tv" ? "tv" : "movie"}/${id}/watch/providers?api_key=${API_KEY}`;
    const r = await kino.fetch(url);
    if (!r.ok) return [];
    const data = r.json();
    const mx = data.results?.MX || data.results?.US;
    if (!mx) return [];
    const all = [...(mx.flatrate||[]), ...(mx.free||[]), ...(mx.rent||[]), ...(mx.buy||[])];
    return all.filter(p => PROVIDERS[p.provider_name]).map(p => PROVIDERS[p.provider_name].name);
  } catch {
    return [];
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
  
  if (wanted.length === 0) {
    throw new Error(`No está en Disney+ ni Prime. Está en: ${all.map(p=>p.provider_name).join(", ")}`);
  }
  
  const providerName = wanted[0].provider_name;
  const p = PROVIDERS[providerName];
  
  // Para Xiaomi Stick usamos https, Kino lo acepta y Android lo manda a la app
  const webUrl = p.name === "Disney+" 
    ? "https://www.disneyplus.com/search" 
    : "https://www.primevideo.com/search/ref=atv_nb_sr?phrase=";
  
  return {
    url: webUrl,
    title: `Abrir en ${p.name}`
  };
}
