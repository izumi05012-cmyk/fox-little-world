// Which scene to show outside the window. "auto" follows the real weather
// (browser location → Open-Meteo, no key needed); the others are 曦曦's pick.
// Everything fails soft: no location or no network just means a clear sky
// that follows the clock.

const PREF_KEY = "fox-window-pref";
const CACHE_KEY = "fox-window-weather";
const CACHE_MS = 30 * 60 * 1000;

export const choices = [
  { id: "auto", label: "自动" },
  { id: "rain", label: "雨" },
  { id: "snow", label: "雪" },
  { id: "sun", label: "晴" },
];

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // private mode: the choice just isn't remembered
  }
}

export function loadPref() {
  const saved = read(PREF_KEY);
  return choices.some((c) => c.id === saved) ? saved : "auto";
}

export function savePref(pref) {
  write(PREF_KEY, pref);
}

const isDaytime = (date = new Date()) => date.getHours() >= 6 && date.getHours() < 18;

export function clearSky(isDay = isDaytime()) {
  return isDay ? "day" : "night";
}

// WMO weather codes, as Open-Meteo reports them.
function sceneFor(code, isDay) {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return clearSky(isDay);
}

function position() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("no geolocation"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      reject,
      { timeout: 8000, maximumAge: CACHE_MS }
    );
  });
}

export async function realWeather() {
  try {
    const cached = JSON.parse(read(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.at < CACHE_MS) {
      // the cached code is fresh, but day/night follows the clock
      return sceneFor(cached.code, isDaytime());
    }
  } catch {
    // bad cache: fetch again
  }
  try {
    const { latitude, longitude } = await position();
    const url =
      "https://api.open-meteo.com/v1/forecast" +
      `?latitude=${latitude.toFixed(2)}&longitude=${longitude.toFixed(2)}` +
      "&current=weather_code,is_day";
    const data = await (await fetch(url)).json();
    const code = data.current.weather_code;
    write(CACHE_KEY, JSON.stringify({ code, at: Date.now() }));
    return sceneFor(code, data.current.is_day === 1);
  } catch {
    return clearSky();
  }
}
