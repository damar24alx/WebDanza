import { SubstyleMock } from "@/mocks/types";

export const substylesMock: SubstyleMock[] = [
  {
    slug: "litefeet",
    styleSlug: "house",
    name: "Litefeet",
    summary:
      "Subestilo urbano de alta velocidad con foco en variaciones de pies, acentos y actitud.",
    origin: "Harlem, NYC",
    focus: ["Rapid Footwork", "Hat tricks", "Syncopation", "Freestyle battle"],
    playlistBpm: "130-145 BPM",
    vibe: "Energético, competitivo y altamente expresivo.",
  },
  {
    slug: "lofting",
    styleSlug: "house",
    name: "Lofting",
    summary: "Enfoque de house con flow suave, slides y control de rebote.",
    origin: "Club culture",
    focus: ["Flow", "Floor connection", "Momentum control"],
    playlistBpm: "118-124 BPM",
    vibe: "Suave, musical y continuo.",
  },
  {
    slug: "boogaloo",
    styleSlug: "popping",
    name: "Boogaloo",
    summary: "Componente de onda corporal y elasticidad visual.",
    origin: "Funk styles",
    focus: ["Body rolls", "Twist-o-flex", "Groove funk"],
    playlistBpm: "90-100 BPM",
    vibe: "Ondulante y detallado.",
  },
];

export function getSubstyleBySlug(slug: string) {
  return substylesMock.find((item) => item.slug === slug);
}

export function getSubstylesByStyle(styleSlug: string) {
  return substylesMock.filter((item) => item.styleSlug === styleSlug);
}
