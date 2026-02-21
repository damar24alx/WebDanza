import { CourseMock } from "@/mocks/types";

export const coursesMock: CourseMock[] = [
  {
    slug: "hip-hop-foundations",
    title: "Hip Hop Foundations",
    summary:
      "Ruta guiada para dominar bounce, groove, timing y vocabulario esencial.",
    styleSlug: "hip-hop",
    level: "beginner",
    durationHours: 6,
    certificateEligible: true,
    progressPercent: 65,
    lessons: [
      {
        slug: "rock-fundamentals",
        title: "The Rock: Fundamentals",
        durationMin: 22,
        status: "active",
        objective: "Controlar transferencia de peso con groove estable.",
        takeaways: [
          "Bounce consistente",
          "Timing con downbeat",
          "Variaciones de base",
        ],
      },
      {
        slug: "party-groove-combos",
        title: "Party Groove Combos",
        durationMin: 26,
        status: "locked",
        objective: "Combinar secuencias cortas con acentos musicales.",
        takeaways: ["Combo 8 tiempos", "Cambio de dirección"],
      },
      {
        slug: "freestyle-framework",
        title: "Freestyle Framework",
        durationMin: 30,
        status: "locked",
        objective: "Construir rounds de freestyle sobre estructura musical.",
        takeaways: ["Entrada", "Desarrollo", "Salida"],
      },
    ],
  },
  {
    slug: "house-foundations",
    title: "House Dance Foundations",
    summary: "Footwork, jack y control de energía para pista y battle.",
    styleSlug: "house",
    level: "intermediate",
    durationHours: 8,
    certificateEligible: true,
    progressPercent: 100,
    lessons: [
      {
        slug: "jack-loop",
        title: "Jack Loop",
        durationMin: 18,
        status: "done",
        objective: "Consolidar el groove base.",
        takeaways: ["Elasticidad torso", "Conexión con beat"],
      },
      {
        slug: "shuffle-variations",
        title: "Shuffle Variations",
        durationMin: 28,
        status: "done",
        objective: "Aplicar variaciones con cambio de dirección.",
        takeaways: ["Cambio de peso", "Resistencia"],
      },
    ],
  },
  {
    slug: "salsa-beginner-level-1",
    title: "Salsa Beginner Level 1",
    summary: "Ruta inicial de timing, conexión y partnerwork social.",
    styleSlug: "salsa",
    level: "beginner",
    durationHours: 5,
    certificateEligible: false,
    progressPercent: 32,
    lessons: [
      {
        slug: "basic-step",
        title: "Basic Step and Timing",
        durationMin: 15,
        status: "done",
        objective: "Marcar paso base sin perder conteo.",
        takeaways: ["Conteo 1-8", "Cambio de peso"],
      },
      {
        slug: "cross-body",
        title: "Cross Body Lead",
        durationMin: 24,
        status: "active",
        objective: "Guiar cruce con frame estable.",
        takeaways: ["Señal clara", "Conexión"],
      },
    ],
  },
];

export function getCourseBySlug(slug: string) {
  return coursesMock.find((course) => course.slug === slug);
}
