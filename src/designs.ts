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
};
export const coverKeys = Object.keys(eventCovers);

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
