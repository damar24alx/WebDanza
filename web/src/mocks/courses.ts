import { CourseMock } from "@/mocks/types";

function buildLessonMock(input: {
  slug: string;
  title: string;
  durationMin: number;
  status: "done" | "active" | "locked";
  objective: string;
  takeaways: string[];
}) {
  const steps = input.takeaways.map((label, index) => ({
    index,
    label,
    completed: input.status === "done",
  }));
  const completedSteps = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const percent = totalSteps === 0 ? (input.status === "done" ? 100 : 0) : Math.round((completedSteps / totalSteps) * 100);
  const pendingStep = steps.find((step) => !step.completed);

  return {
    ...input,
    steps,
    completedSteps,
    totalSteps,
    percent,
    nextStepIndex: pendingStep ? pendingStep.index : null,
  };
}

export const coursesMock: CourseMock[] = [
  {
    slug: "hip-hop-foundations",
    title: "Hip Hop Foundations",
    summary: "Ruta guiada para dominar bounce, groove, timing y vocabulario esencial.",
    styleSlug: "hip-hop",
    level: "beginner",
    durationHours: 6,
    certificateEligible: true,
    progressPercent: 65,
    media: [],
    lessons: [
      buildLessonMock({
        slug: "rock-fundamentals",
        title: "The Rock: Fundamentals",
        durationMin: 22,
        status: "active",
        objective: "Controlar transferencia de peso con groove estable.",
        takeaways: ["Bounce consistente", "Timing con downbeat", "Variaciones de base"],
      }),
      buildLessonMock({
        slug: "party-groove-combos",
        title: "Party Groove Combos",
        durationMin: 26,
        status: "locked",
        objective: "Combinar secuencias cortas con acentos musicales.",
        takeaways: ["Combo 8 tiempos", "Cambio de direccion"],
      }),
      buildLessonMock({
        slug: "freestyle-framework",
        title: "Freestyle Framework",
        durationMin: 30,
        status: "locked",
        objective: "Construir rounds de freestyle sobre estructura musical.",
        takeaways: ["Entrada", "Desarrollo", "Salida"],
      }),
    ],
  },
  {
    slug: "house-foundations",
    title: "House Dance Foundations",
    summary: "Footwork, jack y control de energia para pista y battle.",
    styleSlug: "house",
    level: "intermediate",
    durationHours: 8,
    certificateEligible: true,
    progressPercent: 100,
    media: [],
    lessons: [
      buildLessonMock({
        slug: "jack-loop",
        title: "Jack Loop",
        durationMin: 18,
        status: "done",
        objective: "Consolidar el groove base.",
        takeaways: ["Elasticidad torso", "Conexion con beat"],
      }),
      buildLessonMock({
        slug: "shuffle-variations",
        title: "Shuffle Variations",
        durationMin: 28,
        status: "done",
        objective: "Aplicar variaciones con cambio de direccion.",
        takeaways: ["Cambio de peso", "Resistencia"],
      }),
    ],
  },
  {
    slug: "salsa-beginner-level-1",
    title: "Salsa Beginner Level 1",
    summary: "Ruta inicial de timing, conexion y partnerwork social.",
    styleSlug: "salsa",
    level: "beginner",
    durationHours: 5,
    certificateEligible: false,
    progressPercent: 32,
    media: [],
    lessons: [
      buildLessonMock({
        slug: "basic-step",
        title: "Basic Step and Timing",
        durationMin: 15,
        status: "done",
        objective: "Marcar paso base sin perder conteo.",
        takeaways: ["Conteo 1-8", "Cambio de peso"],
      }),
      buildLessonMock({
        slug: "cross-body",
        title: "Cross Body Lead",
        durationMin: 24,
        status: "active",
        objective: "Guiar cruce con frame estable.",
        takeaways: ["Senal clara", "Conexion"],
      }),
    ],
  },
];

export function getCourseBySlug(slug: string) {
  return coursesMock.find((course) => course.slug === slug);
}
