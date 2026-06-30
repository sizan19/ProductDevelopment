// Curated imagery for the marketing pages. Uses the Unsplash CDN
// (stable photo IDs). Every <SmartImage> falls back to a branded
// placeholder if a URL fails, so the layout never breaks.
const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  heroTeam:          U('1522071820081-009f0129c71c', 1100), // team collaborating
  showcaseAssistant: U('1485827404703-89b55fcc595e', 1000), // AI / robot
  showcasePrototype: U('1542744173-8e7e53415bb0', 1000),    // planning / whiteboard
};

// Map a solution's `icon` key to a themed image.
const SERVICE_IMAGES = {
  robot: U('1485827404703-89b55fcc595e'), // AI / robot
  bolt:  U('1517180102446-f3ece451e9d8'), // fast / tech
  code:  U('1461749280684-dccba630e2f6'), // code on screen
  chart: U('1551288049-bebda4e38f71'),    // analytics dashboard
};
const SERVICE_FALLBACK = U('1498050108023-c5249f4df085'); // workspace / code

export function serviceImage(icon) {
  return SERVICE_IMAGES[icon] || SERVICE_FALLBACK;
}
