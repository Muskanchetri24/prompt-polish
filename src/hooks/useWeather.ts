import { useState, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────
export type WeatherCondition =
  | "clear"
  | "sunny"
  | "cloudy"
  | "partly-cloudy"
  | "rain"
  | "drizzle"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "mist"
  | "dust"
  | "windy"
  | "unknown";

export type DayPhase =
  | "dawn"
  | "morning"
  | "noon"
  | "afternoon"
  | "dusk"
  | "night"
  | "midnight";

export interface WeatherState {
  condition: WeatherCondition;
  phase: DayPhase;
  isNight: boolean;
  temperature: number;
  windSpeed: number;          // m/s
  humidity: number;           // %
  cloudCover: number;         // 0–100
  visibility: number;         // metres
  cityName: string;
  countryCode: string;
  sunrise: number;            // unix UTC
  sunset: number;             // unix UTC
  weatherId: number;          // OWM weather id
  description: string;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATE: WeatherState = {
  condition: "unknown",
  phase: "morning",
  isNight: false,
  temperature: 20,
  windSpeed: 3,
  humidity: 60,
  cloudCover: 20,
  visibility: 10000,
  cityName: "",
  countryCode: "",
  sunrise: 0,
  sunset: 0,
  weatherId: 800,
  description: "",
  loading: true,
  error: null,
};

// ─── OWM code → condition ─────────────────────────────────────────────────
function owmIdToCondition(id: number, isNight: boolean): WeatherCondition {
  if (id >= 200 && id < 300) return "thunderstorm";
  if (id >= 300 && id < 400) return "drizzle";
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id === 701 || id === 741) return "mist";
  if (id === 721 || id === 731 || id === 751 || id === 761 || id === 762) return "dust";
  if (id >= 700 && id < 800) return "fog";
  if (id === 800) return isNight ? "clear" : "sunny";
  if (id === 801) return "partly-cloudy";
  if (id === 802 || id === 803) return "cloudy";
  if (id === 804) return "cloudy";
  return "unknown";
}

// ─── Time → phase ─────────────────────────────────────────────────────────
function getPhase(nowTs: number, sunrise: number, sunset: number): DayPhase {
  const h = new Date(nowTs * 1000).getHours();
  const diffSunrise = nowTs - sunrise; // seconds after sunrise
  const diffSunset  = sunset  - nowTs; // seconds before  sunset

  if (diffSunrise > 0 && diffSunrise < 3600) return "dawn";
  if (diffSunset  > 0 && diffSunset  < 3600) return "dusk";
  if (nowTs < sunrise || nowTs > sunset) {
    return h >= 0 && h < 4 ? "midnight" : "night";
  }
  if (h < 10) return "morning";
  if (h < 14) return "noon";
  return "afternoon";
}

// ─── Hook ─────────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const REFRESH_MS = 10 * 60 * 1000; // refresh every 10 min

export function useWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>(DEFAULT_STATE);

  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    if (!API_KEY) {
      // No API key — return a mock based on time of day so visuals still work
      const now = Date.now() / 1000;
      const sunrise = Math.floor(now / 86400) * 86400 + 6 * 3600;
      const sunset  = Math.floor(now / 86400) * 86400 + 18 * 3600;
      const isNight = now < sunrise || now > sunset;
      setState({
        ...DEFAULT_STATE,
        condition: isNight ? "clear" : "sunny",
        phase: getPhase(now, sunrise, sunset),
        isNight,
        sunrise,
        sunset,
        cityName: "Your City",
        loading: false,
        error: "No OpenWeatherMap API key. Set VITE_OPENWEATHER_API_KEY in .env",
      });
      return;
    }

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      if (!res.ok) throw new Error(`OWM ${res.status}`);
      const d = await res.json();

      const now     = Math.floor(Date.now() / 1000);
      const sunrise = d.sys.sunrise as number;
      const sunset  = d.sys.sunset  as number;
      const isNight = now < sunrise || now > sunset;
      const id      = d.weather[0].id as number;

      setState({
        condition:   owmIdToCondition(id, isNight),
        phase:       getPhase(now, sunrise, sunset),
        isNight,
        temperature: d.main.temp,
        windSpeed:   d.wind.speed,
        humidity:    d.main.humidity,
        cloudCover:  d.clouds.all,
        visibility:  d.visibility ?? 10000,
        cityName:    d.name,
        countryCode: d.sys.country,
        sunrise,
        sunset,
        weatherId:   id,
        description: d.weather[0].description,
        loading:     false,
        error:       null,
      });
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : "Weather fetch failed",
      }));
    }
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, loading: false, error: "Geolocation not supported" }));
      return;
    }

    let intervalId: ReturnType<typeof setInterval>;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        fetchWeather(lat, lon);
        intervalId = setInterval(() => fetchWeather(lat, lon), REFRESH_MS);
      },
      (err) => {
        // Fallback — use IP-based location approximation via a free API
        fetch("https://ipapi.co/json/")
          .then((r) => r.json())
          .then((ip) => {
            const lat = ip.latitude  ?? 20;
            const lon = ip.longitude ?? 78;
            fetchWeather(lat, lon);
            intervalId = setInterval(() => fetchWeather(lat, lon), REFRESH_MS);
          })
          .catch(() => {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: `Geolocation denied (${err.message}). Using default visuals.`,
            }));
          });
      },
      { timeout: 8000 }
    );

    return () => clearInterval(intervalId);
  }, [fetchWeather]);

  return state;
}
