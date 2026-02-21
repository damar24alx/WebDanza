import { MoveMock } from "@/mocks/types";

export const movesMock: MoveMock[] = [
  {
    slug: "the-shuffle",
    name: "The Shuffle",
    summary: "Patrón base de pies para transiciones y cambios de dirección.",
    moveType: "Footwork",
    difficulty: "beginner",
    bpmRange: "118-132",
    family: "House",
    styleSlugs: ["house", "hip-hop"],
    stepByStep: [
      "Levanta ligeramente el talón derecho manteniendo rebote.",
      "Ejecuta hop corto con cambio de peso al pie izquierdo.",
      "Marca kick frontal controlado y vuelve al centro.",
      "Repite alternando lados con timing constante.",
    ],
    commonMistakes: [
      {
        issue: "Perder rebote del torso",
        correction: "Mantén micro-flexión de rodillas y torso activo.",
      },
      {
        issue: "Kick demasiado alto",
        correction: "Prioriza velocidad y control sobre altura.",
      },
    ],
  },
  {
    slug: "the-jack",
    name: "The Jack",
    summary: "Movimiento cíclico de torso, base del groove house.",
    moveType: "Groove",
    difficulty: "beginner",
    bpmRange: "120-128",
    family: "House",
    styleSlugs: ["house"],
    stepByStep: [
      "Inicia en postura neutra con peso centrado.",
      "Empuja pecho al frente y deja caer al centro.",
      "Sincroniza cadera y rodillas con la oscilación.",
    ],
    commonMistakes: [
      {
        issue: "Movimiento rígido",
        correction: "Piensa en onda continua, no en cortes.",
      },
    ],
  },
  {
    slug: "baby-freeze",
    name: "Baby Freeze",
    summary: "Freeze básico de breaking para control y balance.",
    moveType: "Freeze",
    difficulty: "intermediate",
    bpmRange: "95-110",
    family: "Breaking",
    styleSlugs: ["breaking"],
    stepByStep: [
      "Coloca codo bajo abdomen con base amplia.",
      "Apoya cabeza y mano para triángulo estable.",
      "Eleva piernas manteniendo centro activo.",
    ],
    commonMistakes: [
      {
        issue: "Base cerrada",
        correction: "Abre ángulos de apoyo para mayor estabilidad.",
      },
    ],
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
      "Transfiere por codo y muñeca sin perder timing.",
      "Finaliza en dedos y alterna lado.",
    ],
    commonMistakes: [
      {
        issue: "Bloqueos entre articulaciones",
        correction: "Entrena aislamientos por segmento antes de unir.",
      },
    ],
  },
  {
    slug: "cross-body-lead",
    name: "Cross Body Lead",
    summary: "Patrón fundamental de guía en salsa.",
    moveType: "Partnerwork",
    difficulty: "beginner",
    bpmRange: "95-108",
    family: "Salsa",
    styleSlugs: ["salsa"],
    stepByStep: [
      "Abre línea en conteo 1-3.",
      "Guía paso cruzado en 5-7.",
      "Cierra frame y reinicia.",
    ],
    commonMistakes: [
      {
        issue: "Tensión excesiva de brazos",
        correction: "Conduce desde centro y frame suave.",
      },
    ],
  },
];

export function getMoveBySlug(slug: string) {
  return movesMock.find((move) => move.slug === slug);
}
