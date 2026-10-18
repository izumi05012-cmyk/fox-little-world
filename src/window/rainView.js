import rainPic from "../assets/window/rain.webp";
import rainDepth from "../assets/window/rain-depth.webp";
import rainNightPic from "../assets/window/rain-night.webp";
import rainNightDepth from "../assets/window/rain-night-depth.webp";
import { isDaytime } from "./weather";

// Rain has its own view (flowers at the glass, a city beyond), and after
// dark the same window with the city's lights on.
export function rainView() {
  return isDaytime() ? { picture: rainPic, depth: rainDepth } : { picture: rainNightPic, depth: rainNightDepth };
}
