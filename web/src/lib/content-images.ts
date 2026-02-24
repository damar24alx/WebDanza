const STYLE_IMAGE_BY_SLUG: Record<string, string> = {
  "hip-hop": "/media/images/stitch/hero-home.jpg",
  house: "/media/images/stitch/card-academy.jpg",
  popping: "/media/images/stitch/trend-portrait.jpg",
  breaking: "/media/images/stitch/trend-breaking.jpg",
  contemporary: "/media/images/stitch/trend-group.jpg",
  ballet: "/media/images/stitch/card-styles.jpg",
  salsa: "/media/images/stitch/trend-tango.jpg",
  jazz: "/media/images/stitch/trend-group.jpg",
  dancehall: "/media/images/stitch/card-dictionary.jpg",
};

const MOVE_IMAGE_BY_SLUG: Record<string, string> = {
  "the-shuffle": "/media/images/stitch/card-dictionary.jpg",
  "the-jack": "/media/images/stitch/card-academy.jpg",
  "baby-freeze": "/media/images/stitch/trend-breaking.jpg",
  "arm-wave": "/media/images/stitch/trend-portrait.jpg",
  "cross-body-lead": "/media/images/stitch/trend-tango.jpg",
  "dancehall-bounce": "/media/images/stitch/card-dictionary.jpg",
  "willie-bounce": "/media/images/stitch/trend-group.jpg",
  "dutty-wine": "/media/images/stitch/card-academy.jpg",
  "gully-creep": "/media/images/stitch/continue-learning.jpg",
  "bogle-step": "/media/images/stitch/card-styles.jpg",
  "pon-di-river": "/media/images/stitch/hero-home.jpg",
  "signal-di-plane": "/media/images/stitch/trend-portrait.jpg",
  "heel-and-toe-dh": "/media/images/stitch/card-dictionary.jpg",
};

const MOVE_IMAGE_BY_FAMILY: Record<string, string> = {
  house: "/media/images/stitch/card-academy.jpg",
  breaking: "/media/images/stitch/trend-breaking.jpg",
  popping: "/media/images/stitch/trend-portrait.jpg",
  salsa: "/media/images/stitch/trend-tango.jpg",
  dancehall: "/media/images/stitch/card-dictionary.jpg",
  "hip hop": "/media/images/stitch/hero-home.jpg",
  "hip-hop": "/media/images/stitch/hero-home.jpg",
};

export const HOME_HERO_IMAGE_URL = "/media/images/stitch/hero-home.jpg";
export const HOME_CONTINUE_IMAGE_URL = "/media/images/stitch/continue-learning.jpg";

export const HOME_QUICK_ACCESS_IMAGES = {
  styles: "/media/images/stitch/card-styles.jpg",
  academy: "/media/images/stitch/card-academy.jpg",
  dictionary: "/media/images/stitch/card-dictionary.jpg",
} as const;

export const HOME_TRENDING_IMAGE_CYCLE = [
  "/media/images/stitch/trend-breaking.jpg",
  "/media/images/stitch/trend-group.jpg",
  "/media/images/stitch/trend-tango.jpg",
  "/media/images/stitch/trend-portrait.jpg",
] as const;

export function getStyleImageUrl(styleSlug: string) {
  const normalized = styleSlug.trim().toLowerCase();
  return STYLE_IMAGE_BY_SLUG[normalized] ?? "/media/images/stitch/card-styles.jpg";
}

export function getMoveImageUrl(input: { slug: string; family?: string | null }) {
  const slug = input.slug.trim().toLowerCase();
  const family = (input.family ?? "").trim().toLowerCase();

  return (
    MOVE_IMAGE_BY_SLUG[slug] ??
    MOVE_IMAGE_BY_FAMILY[family] ??
    "/media/images/stitch/card-dictionary.jpg"
  );
}
