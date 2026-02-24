import { MoveMock } from "@/mocks/types";

export const movesMock: MoveMock[] = [
  {
    slug: "the-shuffle",
    name: "The Shuffle",
    summary: "Patron base de pies para transiciones y cambios de direccion.",
    moveType: "Footwork",
    difficulty: "beginner",
    bpmRange: "118-132",
    family: "House",
    styleSlugs: ["house", "hip-hop"],
    stepByStep: [
      "Levanta ligeramente el talon derecho manteniendo rebote.",
      "Ejecuta hop corto con cambio de peso al pie izquierdo.",
      "Marca kick frontal controlado y vuelve al centro.",
      "Repite alternando lados con timing constante.",
    ],
    commonMistakes: [
      {
        issue: "Perder rebote del torso",
        correction: "Manten micro-flexion de rodillas y torso activo.",
      },
      {
        issue: "Kick demasiado alto",
        correction: "Prioriza velocidad y control sobre altura.",
      },
    ],
    media: [],
  },
  {
    slug: "the-jack",
    name: "The Jack",
    summary: "Movimiento ciclico de torso, base del groove house.",
    moveType: "Groove",
    difficulty: "beginner",
    bpmRange: "120-128",
    family: "House",
    styleSlugs: ["house"],
    stepByStep: [
      "Inicia en postura neutra con peso centrado.",
      "Empuja pecho al frente y deja caer al centro.",
      "Sincroniza cadera y rodillas con la oscilacion.",
    ],
    commonMistakes: [
      {
        issue: "Movimiento rigido",
        correction: "Piensa en onda continua, no en cortes.",
      },
    ],
    media: [],
  },
  {
    slug: "baby-freeze",
    name: "Baby Freeze",
    summary: "Freeze basico de breaking para control y balance.",
    moveType: "Freeze",
    difficulty: "intermediate",
    bpmRange: "95-110",
    family: "Breaking",
    styleSlugs: ["breaking"],
    stepByStep: [
      "Coloca codo bajo abdomen con base amplia.",
      "Apoya cabeza y mano para triangulo estable.",
      "Eleva piernas manteniendo centro activo.",
    ],
    commonMistakes: [
      {
        issue: "Base cerrada",
        correction: "Abre angulos de apoyo para mayor estabilidad.",
      },
    ],
    media: [],
  },
  {
    slug: "arm-wave",
    name: "Fluid Arm Waves",
    summary: "Onda segmentada desde hombro a dedos.",
    moveType: "Isolation",
    difficulty: "beginner",
    bpmRange: "85-105",
    family: "Popping",
    styleSlugs: ["popping", "hip-hop"],
    stepByStep: [
      "Inicia onda desde hombro derecho.",
      "Transfiere por codo y muneca sin perder timing.",
      "Finaliza en dedos y alterna lado.",
    ],
    commonMistakes: [
      {
        issue: "Bloqueos entre articulaciones",
        correction: "Entrena aislamientos por segmento antes de unir.",
      },
    ],
    media: [],
  },
  {
    slug: "cross-body-lead",
    name: "Cross Body Lead",
    summary: "Patron fundamental de guia en salsa.",
    moveType: "Partnerwork",
    difficulty: "beginner",
    bpmRange: "95-108",
    family: "Salsa",
    styleSlugs: ["salsa"],
    stepByStep: [
      "Abre linea en conteo 1-3.",
      "Guia paso cruzado en 5-7.",
      "Cierra frame y reinicia.",
    ],
    commonMistakes: [
      {
        issue: "Tension excesiva de brazos",
        correction: "Conduce desde centro y frame suave.",
      },
    ],
    media: [],
  },
];

export function getMoveBySlug(slug: string) {
  return movesMock.find((move) => move.slug === slug);
}