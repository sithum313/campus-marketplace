import { ImageSourcePropType } from "react-native";
import { Swatch } from "./types";

/** Artwork library used for bookmark and t-shirt designs, and event covers. */
export type Design = { id: string; name: string; source: ImageSourcePropType };

export const designLibrary: Design[] = [
  { id: "crew", name: "Miami Crew", source: require("../assets/designs/crew.jpg") },
  { id: "peace", name: "Peace Squad", source: require("../assets/designs/peace.jpg") },
  { id: "cheeky", name: "Cheeky Wink", source: require("../assets/designs/cheeky.jpg") },
  { id: "laugh", name: "Big Laughs", source: require("../assets/designs/laugh.jpg") },
  { id: "joy", name: "Pure Joy", source: require("../assets/designs/joy.jpg") },
  { id: "cheer", name: "Cheer Up", source: require("../assets/designs/cheer.jpg") },
  { id: "together", name: "Together", source: require("../assets/designs/together.jpg") },
  { id: "squad", name: "Campus Squad", source: require("../assets/designs/squad.jpg") },
  { id: "sunset", name: "Sunset", source: require("../assets/designs/sunset.jpg") },
  { id: "waves", name: "Waves", source: require("../assets/designs/waves.jpg") },
  { id: "dots", name: "Pop Dots", source: require("../assets/designs/dots.jpg") },
  { id: "stars", name: "Midnight Stars", source: require("../assets/designs/stars.jpg") },
];

export const designById = (id?: string) => designLibrary.find((d) => d.id === id);

export const eventCovers: Record<string, ImageSourcePropType> = {
  freshers: require("../assets/events/freshers.jpg"),
  sports: require("../assets/events/sports.jpg"),
  charity: require("../assets/events/charity.jpg"),
  talent: require("../assets/events/talent.jpg"),
  workshop: require("../assets/events/workshop.jpg"),
};
export const coverKeys = Object.keys(eventCovers);

/**
 * Real campus / university photos for each cover. They load from the internet; if one cannot load,
 * the bundled illustration above is shown instead, so a banner is never empty.
 * To use your own photo: put it in assets/events/ and change the require() line above for that key.
 */
const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=600&q=70`;
export const remoteCovers: Record<string, string> = {
  freshers: u("photo-1523050854058-8df90110c9f1"),
  sports: u("photo-1461896836934-ffe607ba8211"),
  charity: u("photo-1459749411175-04bf5292ceea"),
  talent: u("photo-1514525253161-7a46d19cd819"),
  workshop: u("photo-1522202176988-66273c2fd55f"),
};

/** Which cover an event uses: its own pick, otherwise a default so no event is left without one. */
export function coverKeyFor(event: { id: string; cover?: string }): string {
  if (event.cover && eventCovers[event.cover]) return event.cover;
  let h = 0;
  for (let i = 0; i < event.id.length; i++) h = (h * 31 + event.id.charCodeAt(i)) >>> 0;
  return coverKeys[h % coverKeys.length];
}

/** Bundled (offline) cover for an event. */
export function coverFor(event: { id: string; cover?: string }): ImageSourcePropType {
  return eventCovers[coverKeyFor(event)];
}

export const shirtColors: Swatch[] = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Black", hex: "#1E2230" },
  { name: "Navy", hex: "#23395B" },
  { name: "Teal", hex: "#2A9D9F" },
  { name: "Yellow", hex: "#F6C52A" },
  { name: "Pink", hex: "#F0A6C4" },
  { name: "Red", hex: "#E5484D" },
];
export const capColors: Swatch[] = [
  { name: "Black", hex: "#1E2230" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#23395B" },
  { name: "Red", hex: "#E5484D" },
];
export const shirtSizes = ["XS", "S", "M", "L", "XL", "XXL"];
