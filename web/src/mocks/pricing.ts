import { PricingPlanMock } from "@/mocks/types";

export const pricingMock: PricingPlanMock[] = [
  {
    id: "explorer",
    name: "Explorador",
    monthlyPrice: "Gratis",
    annualPrice: "Gratis",
    description: "Descubre estilos y moves esenciales.",
    features: [
      "Acceso a diccionario básico",
      "1 ruta sugerida por estilo",
      "Progreso local",
    ],
    cta: "Empezar",
  },
  {
    id: "style-pack",
    name: "Pack por Estilo",
    monthlyPrice: "$9",
    annualPrice: "$7",
    description: "Profundiza en un estilo con contenidos premium.",
    features: [
      "Cursos completos de un estilo",
      "Revisión de técnica base",
      "Desbloqueo de módulos intermedios",
    ],
    cta: "Elegir estilo",
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: "$19",
    annualPrice: "$15",
    highlight: true,
    description: "Acceso total y certificados verificables.",
    features: [
      "Todos los cursos y estilos",
      "Seguimiento de progreso completo",
      "Certificados de finalización",
      "Prioridad en soporte",
    ],
    cta: "Ir Pro",
  },
  {
    id: "studio",
    name: "Studio",
    monthlyPrice: "$49",
    annualPrice: "$39",
    description: "Para instructores y equipos.",
    features: [
      "Asientos para estudiantes",
      "Panel de equipo",
      "Reportes de actividad",
    ],
    cta: "Contactar ventas",
  },
];
