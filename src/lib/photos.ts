// Free-to-use photos (Unsplash License / Pexels License). Hot-linked from their CDNs.
// For production: download them into /public/images and credit the photographers.
const u = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = {
  cappuccino: u('1673568438355-6136a2034d4b'), // Marko Stamenkovic, Unsplash
  teacup: u('1542718966-b876f44d81cb'),        // Matt Higham, Unsplash
  brownie: u('1717768024023-73768e73f630'),    // Ebru Dogan, Unsplash
  interior1: 'https://images.pexels.com/photos/1581554/pexels-photo-1581554.jpeg?auto=compress&cs=tinysrgb&w=1200', // Pexels
  interior2: 'https://images.pexels.com/photos/18658223/pexels-photo-18658223/free-photo-of-restaurant-interior.jpeg?auto=compress&cs=tinysrgb&w=1200', // Pexels
};

const byCategory: Record<string, string[]> = {
  Coffee: [PHOTOS.cappuccino, PHOTOS.teacup],
  'Tea & Drinks': [PHOTOS.teacup],
  Desserts: [PHOTOS.brownie],
};

export function photoFor(categoryName: string | undefined, index: number): string | null {
  const list = categoryName ? byCategory[categoryName] : undefined;
  return list ? list[index % list.length] : null;
}
