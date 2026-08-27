// GaPa country detection. Country is resolved once from coordinates and then cached in Firebase.
// Reverse geocoding uses OpenStreetMap Nominatim. Results are saved as ISO-3166-1 alpha-2 codes.
const COUNTRY_NAMES_PL = {
  pl:'Polska', gb:'Wielka Brytania', es:'Hiszpania', it:'Włochy', fr:'Francja', de:'Niemcy',
  pt:'Portugalia', gr:'Grecja', at:'Austria', cz:'Czechy', sk:'Słowacja', hu:'Węgry', hr:'Chorwacja',
  si:'Słowenia', no:'Norwegia', se:'Szwecja', dk:'Dania', fi:'Finlandia', is:'Islandia', ie:'Irlandia',
  nl:'Holandia', be:'Belgia', ch:'Szwajcaria', us:'USA', ca:'Kanada', mx:'Meksyk', tr:'Turcja',
  ma:'Maroko', tn:'Tunezja', eg:'Egipt', ae:'Zjednoczone Emiraty Arabskie', jp:'Japonia', th:'Tajlandia',
  au:'Australia', ro:'Rumunia', bg:'Bułgaria', rs:'Serbia', ba:'Bośnia i Hercegowina', me:'Czarnogóra',
  al:'Albania', mt:'Malta', cy:'Cypr', lu:'Luksemburg', lt:'Litwa', lv:'Łotwa', ee:'Estonia',
  ua:'Ukraina', md:'Mołdawia', ge:'Gruzja', am:'Armenia', il:'Izrael', jo:'Jordania', dz:'Algieria',
  za:'Republika Południowej Afryki', nz:'Nowa Zelandia', br:'Brazylia', ar:'Argentyna', cl:'Chile',
  pe:'Peru', co:'Kolumbia', in:'Indie', cn:'Chiny', kr:'Korea Południowa', vn:'Wietnam', id:'Indonezja'
};
const COUNTRY_FLAGS = Object.fromEntries(Object.keys(COUNTRY_NAMES_PL).map(code => [code, code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt()))]));

export function normalizeCountries(value) {
  if (Array.isArray(value)) return [...new Set(value.map(v => String(v).trim().toLowerCase()).filter(Boolean))];
  if (value && typeof value === 'object') return [...new Set(Object.values(value).map(v => String(v).trim().toLowerCase()).filter(Boolean))];
  if (typeof value === 'string' && value.trim()) return [value.trim().toLowerCase()];
  return [];
}
export function countryName(code) { return COUNTRY_NAMES_PL[String(code||'').toLowerCase()] || String(code||'').toUpperCase(); }
export function countryFlag(code) { return COUNTRY_FLAGS[String(code||'').toLowerCase()] || '🌍'; }
export function countryFlagUrl(code) { const c=String(code||'').trim().toLowerCase(); return /^[a-z]{2}$/.test(c) ? `https://flagcdn.com/w640/${c}.png` : ''; }
export function countryRecord(code) { const c=String(code||'').toLowerCase(); return {code:c,name:countryName(c),flag:countryFlag(c),flagUrl:countryFlagUrl(c)}; }

let lastRequestAt = 0;
async function throttle() {
  const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt));
  if (wait) await new Promise(r => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

export async function detectCountryCode(lat, lng) {
  const la = Number(lat), lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;
  await throttle();
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(la)}&lon=${encodeURIComponent(lo)}&zoom=3&addressdetails=1`;
  const response = await fetch(url, { headers: { 'Accept':'application/json' } });
  if (!response.ok) throw new Error(`Reverse geocoding HTTP ${response.status}`);
  const data = await response.json();
  const code = String(data?.address?.country_code || '').trim().toLowerCase();
  return code || null;
}

export async function detectCountriesFromTrip(trip) {
  const points=[];
  if (trip?.lat != null && trip?.lng != null) points.push([trip.lat,trip.lng]);
  for (const p of Object.values(trip?.places||{})) if (p?.lat != null && p?.lng != null) points.push([p.lat,p.lng]);
  const unique = new Set();
  for (const [lat,lng] of points) {
    try { const code=await detectCountryCode(lat,lng); if(code) unique.add(code); }
    catch(e) { console.warn('Nie udało się wykryć kraju:', e); }
  }
  return [...unique];
}

const COUNTRY_CODES_BY_NAME = Object.fromEntries(Object.entries(COUNTRY_NAMES_PL).map(([code,name]) => [name.toLowerCase(), code]));
export function normalizeCountryCodes(value) {
  return normalizeCountries(value).map(v => COUNTRY_NAMES_PL[v] ? v : (COUNTRY_CODES_BY_NAME[v] || v)).filter(Boolean);
}

// One-time seed for the 19 existing GaPa trips from their stored map coordinates.
export const KNOWN_TRIP_COUNTRIES = {
  fuenteventura:['es'], malham_cove:['gb'], minorka_2018:['es'], minorka_2025:['es'],
  turcja_2023_marzec:['tr'], turcja_2023_wrzesien:['tr'], tydzien_w_gran_canaria:['es'],
  wakacje_w_tunezji:['tn'], weekend_w_gdansku:['pl'], weekend_w_karpaczu:['pl'],
  weekend_w_lake_district:['gb'], weekend_w_marakesz:['ma'], weekend_w_northumberland:['gb'],
  weekend_w_pradze:['cz'], weekend_w_szkocji_2025:['gb'], wroclaw:['pl'],
  wycieczka_do_zakopanego:['pl'], wypad_do_austrii:['at'], wyprawa_do_bergen:['no']
};
