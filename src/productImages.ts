import { ImageSourcePropType } from "react-native";

/**
 * Local photos for products, keyed by product id.
 * 1. Put the image file in assets/products/
 * 2. Add a line below, e.g.  "5": require("../assets/products/calculator.jpg"),
 * Products not listed here keep their current photo or icon.
 */
export const productImages: Record<string, ImageSourcePropType> = {
  // "5": require("../assets/products/calculator.jpg"),
  // "e1-ticket": require("../assets/products/freshers-ticket.jpg"),
};
