import {
  CourseCompletionRule,
  Difficulty,
  EditorialStatus,
  LessonGateStatus,
  LessonType,
  MediaProvider,
  PrismaClient,
  ProgressStatus,
  RightsStatus,
  SourceType,
} from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";

const prisma = new PrismaClient();
const ADMIN_DEMO_PASSWORD = "Admin123!";
const STUDENT_DEMO_PASSWORD = "Student123!";

const styleSeed = [
  {
    slug: "hip-hop",
    name: "Hip Hop",
    summary: "Fundamentos de groove, bounce y musicalidad urbana.",
    categoryPrimary: "Street",
    level: Difficulty.beginner,
    featuredTag: "Popular",
    classesCount: 42,
    imageGradient: "from-fuchsia-500/80 to-indigo-900",
    movementPrinciples: ["Groove base", "Bounce", "Control de peso"],
    musicalityBasics: "90-105 BPM con acentos en downbeat.",
    historicalCulturalContext: "PLACEHOLDER: requiere citations para publicar.",
    publishedStatus: EditorialStatus.review,
  },
  {
    slug: "house",
    name: "House",
    summary: "Footwork veloz y fluidez torso-cadera sobre bases 4/4.",
    categoryPrimary: "Street",
    level: Difficulty.intermediate,
    featuredTag: "Trending",
    classesCount: 19,
    imageGradient: "from-cyan-500/80 to-blue-950",
    movementPrinciples: ["Jack", "Lofting", "Skating"],
    musicalityBasics: "120-128 BPM con groove continuo.",
    historicalCulturalContext: "Nace en la escena de clubs con enfasis en libertad y flow.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "popping",
    name: "Popping",
    summary: "Contraccion y relajacion muscular para crear acentos visuales.",
    categoryPrimary: "Street",
    level: Difficulty.advanced,
    classesCount: 12,
    imageGradient: "from-violet-500/80 to-slate-950",
    movementPrinciples: ["Hit", "Dime stop", "Boogaloo"],
    musicalityBasics: "80-100 BPM y trabajo de subdivisiones.",
    historicalCulturalContext: "Fundado en la Costa Oeste; tecnica de precision corporal.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "breaking",
    name: "Breaking",
    summary: "Toprock, footwork, power moves y freezes.",
    categoryPrimary: "Street",
    level: Difficulty.advanced,
    classesCount: 15,
    imageGradient: "from-orange-500/85 to-rose-900",
    movementPrinciples: ["Toprock", "Downrock", "Freeze control"],
    musicalityBasics: "95-115 BPM con cortes ritmicos intensos.",
    historicalCulturalContext: "PLACEHOLDER: requiere citations para publicar.",
    publishedStatus: EditorialStatus.review,
  },
  {
    slug: "contemporary",
    name: "Contemporary",
    summary: "Lenguaje hibrido entre tecnica y expresion escenica.",
    categoryPrimary: "Studio",
    level: Difficulty.intermediate,
    classesCount: 28,
    imageGradient: "from-emerald-500/80 to-slate-900",
    movementPrinciples: ["Release", "Contraction", "Floor work"],
    musicalityBasics: "Dinamica variable segun narrativa coreografica.",
    historicalCulturalContext: "Evolucion de modern dance y exploracion corporal.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "ballet",
    name: "Ballet",
    summary: "Control, alineacion y vocabulario tecnico clasico.",
    categoryPrimary: "Classical",
    level: Difficulty.advanced,
    classesCount: 56,
    imageGradient: "from-rose-400/80 to-slate-900",
    movementPrinciples: ["Turnout", "Port de bras", "Aplomb"],
    musicalityBasics: "Fraseo formal con conteo preciso y uso de dinamica.",
    historicalCulturalContext: "Base tecnica para multiples estilos escenicos.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "salsa",
    name: "Salsa",
    summary: "Partnerwork y timing social con giro y conexion.",
    categoryPrimary: "Latin",
    level: Difficulty.beginner,
    classesCount: 34,
    imageGradient: "from-red-500/80 to-amber-800",
    movementPrinciples: ["Paso base", "Cross-body lead", "Shines"],
    musicalityBasics: "Clave y estructura de montuno.",
    historicalCulturalContext: "Tradicion latina de baile social y rueda.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "jazz",
    name: "Jazz",
    summary: "Energia, aislamiento y presencia escenica.",
    categoryPrimary: "Studio",
    level: Difficulty.intermediate,
    classesCount: 22,
    imageGradient: "from-yellow-400/80 to-zinc-900",
    movementPrinciples: ["Isolations", "Lines", "Performance quality"],
    musicalityBasics: "Trabajo marcado por acentos y cambios de dinamica.",
    historicalCulturalContext: "Conexion con musica popular y teatro musical.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "dancehall",
    name: "Dancehall",
    summary: "Base ritmica jamaicana con groove, actitud y social steps.",
    categoryPrimary: "Street",
    level: Difficulty.beginner,
    classesCount: 10,
    imageGradient: "from-lime-500/80 to-emerald-900",
    movementPrinciples: ["Bounce", "Grounded groove", "Texture"],
    musicalityBasics: "95-110 BPM con acentos sincopados.",
    historicalCulturalContext: "PLACEHOLDER: contexto historico en verificacion.",
    publishedStatus: EditorialStatus.draft,
  },
];

const substyleSeed = [
  {
    slug: "litefeet",
    styleSlug: "house",
    name: "Litefeet",
    summary: "Subestilo urbano de alta velocidad con foco en variaciones de pies.",
    technicalFocus: ["Rapid Footwork", "Hat tricks", "Syncopation", "Freestyle battle"],
    origin: "Harlem, NYC",
    playlistBpm: "130-145 BPM",
    vibe: "Energetico, competitivo y expresivo.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "lofting",
    styleSlug: "house",
    name: "Lofting",
    summary: "Enfoque de house con flow suave, slides y control de rebote.",
    technicalFocus: ["Flow", "Floor connection", "Momentum control"],
    origin: "Club culture",
    playlistBpm: "118-124 BPM",
    vibe: "Suave, musical y continuo.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "boogaloo",
    styleSlug: "popping",
    name: "Boogaloo",
    summary: "Componente de onda corporal y elasticidad visual.",
    technicalFocus: ["Body rolls", "Twist-o-flex", "Groove funk"],
    origin: "Funk styles",
    playlistBpm: "90-100 BPM",
    vibe: "Ondulante y detallado.",
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "dancehall-female-style-placeholder",
    styleSlug: "dancehall",
    name: "Female Style PLACEHOLDER",
    summary: "PLACEHOLDER: substyle en curaduria editorial.",
    technicalFocus: ["PLACEHOLDER"],
    origin: "PLACEHOLDER",
    playlistBpm: "PLACEHOLDER",
    vibe: "PLACEHOLDER",
    publishedStatus: EditorialStatus.draft,
  },
  {
    slug: "dancehall-badman-style-placeholder",
    styleSlug: "dancehall",
    name: "Badman Style PLACEHOLDER",
    summary: "PLACEHOLDER: substyle en curaduria editorial.",
    technicalFocus: ["PLACEHOLDER"],
    origin: "PLACEHOLDER",
    playlistBpm: "PLACEHOLDER",
    vibe: "PLACEHOLDER",
    publishedStatus: EditorialStatus.draft,
  },
  {
    slug: "dancehall-old-school-placeholder",
    styleSlug: "dancehall",
    name: "Old School PLACEHOLDER",
    summary: "PLACEHOLDER: substyle en curaduria editorial.",
    technicalFocus: ["PLACEHOLDER"],
    origin: "PLACEHOLDER",
    playlistBpm: "PLACEHOLDER",
    vibe: "PLACEHOLDER",
    publishedStatus: EditorialStatus.draft,
  },
];

const moveSeed = [
  {
    slug: "the-shuffle",
    name: "The Shuffle",
    summary: "Patron base de pies para transiciones y cambios de direccion.",
    moveType: "Footwork",
    difficulty: Difficulty.beginner,
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
      { issue: "Perder rebote del torso", correction: "Manten micro-flexion de rodillas y torso activo." },
      { issue: "Kick demasiado alto", correction: "Prioriza velocidad y control sobre altura." },
    ],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "the-jack",
    name: "The Jack",
    summary: "Movimiento ciclico de torso, base del groove house.",
    moveType: "Groove",
    difficulty: Difficulty.beginner,
    bpmRange: "120-128",
    family: "House",
    styleSlugs: ["house"],
    stepByStep: [
      "Inicia en postura neutra con peso centrado.",
      "Empuja pecho al frente y deja caer al centro.",
      "Sincroniza cadera y rodillas con la oscilacion.",
    ],
    commonMistakes: [{ issue: "Movimiento rigido", correction: "Piensa en onda continua, no en cortes." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "baby-freeze",
    name: "Baby Freeze",
    summary: "Freeze basico de breaking para control y balance.",
    moveType: "Freeze",
    difficulty: Difficulty.intermediate,
    bpmRange: "95-110",
    family: "Breaking",
    styleSlugs: ["breaking"],
    stepByStep: [
      "Coloca codo bajo abdomen con base amplia.",
      "Apoya cabeza y mano para triangulo estable.",
      "Eleva piernas manteniendo centro activo.",
    ],
    commonMistakes: [
      { issue: "Base cerrada", correction: "Abre angulos de apoyo para mayor estabilidad." },
    ],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "arm-wave",
    name: "Fluid Arm Waves",
    summary: "Onda segmentada desde hombro a dedos.",
    moveType: "Isolation",
    difficulty: Difficulty.beginner,
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
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "cross-body-lead",
    name: "Cross Body Lead",
    summary: "Patron fundamental de guia en salsa.",
    moveType: "Partnerwork",
    difficulty: Difficulty.beginner,
    bpmRange: "95-108",
    family: "Salsa",
    styleSlugs: ["salsa"],
    stepByStep: ["Abre linea en conteo 1-3.", "Guia paso cruzado en 5-7.", "Cierra frame y reinicia."],
    commonMistakes: [
      { issue: "Tension excesiva de brazos", correction: "Conduce desde centro y frame suave." },
    ],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "dancehall-bounce",
    name: "Dancehall Bounce",
    summary: "Fundamento ritmico base para dancehall.",
    moveType: "Groove",
    difficulty: Difficulty.beginner,
    bpmRange: "96-106",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Flexiona y extiende en rebote corto.", "Sostiene centro bajo.", "Sincroniza con kick."],
    commonMistakes: [{ issue: "Perder gravedad", correction: "Mantener peso en metatarsos y cadera baja." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "willie-bounce",
    name: "Willie Bounce",
    summary: "Step iconico de dancehall old school.",
    moveType: "Social Step",
    difficulty: Difficulty.beginner,
    bpmRange: "96-108",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Marca rebote lateral.", "Cruza y abre con acento.", "Mantiene hombros sueltos."],
    commonMistakes: [{ issue: "Timing atrasado", correction: "Practicar con metronomo en 4x8." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "dutty-wine",
    name: "Dutty Wine",
    summary: "Movimiento circular de torso y cuello con control.",
    moveType: "Isolations",
    difficulty: Difficulty.intermediate,
    bpmRange: "98-112",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Activa core.", "Dibuja circulo corto.", "Coordina con base estable."],
    commonMistakes: [{ issue: "Exceso de cuello", correction: "Priorizar control y rango progresivo." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "gully-creep",
    name: "Gully Creep",
    summary: "Step social con desplazamiento y actitud.",
    moveType: "Social Step",
    difficulty: Difficulty.beginner,
    bpmRange: "96-106",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Camina en rebote.", "Acentua hombro en contratiempo.", "Repite con variaciones."],
    commonMistakes: [{ issue: "Pasos largos", correction: "Mantener desplazamiento corto y controlado." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "bogle-step",
    name: "Bogle Step",
    summary: "Step social clasico con groove circular.",
    moveType: "Social Step",
    difficulty: Difficulty.beginner,
    bpmRange: "95-105",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Marca circulo de brazos.", "Integra rebote en piernas.", "Finaliza con acento."],
    commonMistakes: [{ issue: "Rigidez de brazos", correction: "Relajar hombros y mover desde espalda." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "pon-di-river",
    name: "Pon Di River",
    summary: "Step viral con cambio rapido de nivel.",
    moveType: "Combo Step",
    difficulty: Difficulty.intermediate,
    bpmRange: "100-114",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Entra en rebote.", "Cambia de nivel rapido.", "Recupera postura sin perder pulso."],
    commonMistakes: [{ issue: "Perder equilibrio", correction: "Controlar centro y mirar al frente." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "signal-di-plane",
    name: "Signal Di Plane",
    summary: "Step de brazos con direccion y energia.",
    moveType: "Social Step",
    difficulty: Difficulty.beginner,
    bpmRange: "98-108",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Extiende brazo en diagonal.", "Coordina con rebote.", "Alterna lados en frase de 8."],
    commonMistakes: [{ issue: "Brazos desconectados", correction: "Conectar brazo con rotacion de torso." }],
    publishedStatus: EditorialStatus.published,
  },
  {
    slug: "heel-and-toe-dh",
    name: "Heel and Toe Dancehall",
    summary: "Variante de pies para velocidad y precision.",
    moveType: "Footwork",
    difficulty: Difficulty.intermediate,
    bpmRange: "100-112",
    family: "Dancehall",
    styleSlugs: ["dancehall"],
    stepByStep: ["Alterna talon y punta.", "Mantiene rebote constante.", "Aumenta velocidad gradual."],
    commonMistakes: [{ issue: "Desfase de pies", correction: "Separar practica por lado y unir despues." }],
    publishedStatus: EditorialStatus.published,
  },
];

const courseSeed = [
  {
    slug: "hip-hop-foundations",
    title: "Hip Hop Foundations",
    summary: "Ruta guiada para dominar bounce, groove, timing y vocabulario esencial.",
    styleSlug: "hip-hop",
    targetLevel: Difficulty.beginner,
    durationHours: 6,
    certificateEligible: true,
    publishedStatus: EditorialStatus.published,
    lessons: [
      {
        slug: "rock-fundamentals",
        title: "The Rock: Fundamentals",
        durationMin: 22,
        status: LessonGateStatus.active,
        objective: "Controlar transferencia de peso con groove estable.",
        takeaways: ["Bounce consistente", "Timing con downbeat", "Variaciones de base"],
      },
      {
        slug: "party-groove-combos",
        title: "Party Groove Combos",
        durationMin: 26,
        status: LessonGateStatus.locked,
        objective: "Combinar secuencias cortas con acentos musicales.",
        takeaways: ["Combo 8 tiempos", "Cambio de direccion"],
      },
      {
        slug: "freestyle-framework",
        title: "Freestyle Framework",
        durationMin: 30,
        status: LessonGateStatus.locked,
        objective: "Construir rounds de freestyle sobre estructura musical.",
        takeaways: ["Entrada", "Desarrollo", "Salida"],
      },
    ],
  },
  {
    slug: "house-foundations",
    title: "House Dance Foundations",
    summary: "Footwork, jack y control de energia para pista y battle.",
    styleSlug: "house",
    targetLevel: Difficulty.intermediate,
    durationHours: 8,
    certificateEligible: true,
    publishedStatus: EditorialStatus.published,
    lessons: [
      {
        slug: "jack-loop",
        title: "Jack Loop",
        durationMin: 18,
        status: LessonGateStatus.done,
        objective: "Consolidar el groove base.",
        takeaways: ["Elasticidad torso", "Conexion con beat"],
      },
      {
        slug: "shuffle-variations",
        title: "Shuffle Variations",
        durationMin: 28,
        status: LessonGateStatus.done,
        objective: "Aplicar variaciones con cambio de direccion.",
        takeaways: ["Cambio de peso", "Resistencia"],
      },
    ],
  },
  {
    slug: "salsa-beginner-level-1",
    title: "Salsa Beginner Level 1",
    summary: "Ruta inicial de timing, conexion y partnerwork social.",
    styleSlug: "salsa",
    targetLevel: Difficulty.beginner,
    durationHours: 5,
    certificateEligible: false,
    publishedStatus: EditorialStatus.published,
    lessons: [
      {
        slug: "basic-step",
        title: "Basic Step and Timing",
        durationMin: 15,
        status: LessonGateStatus.done,
        objective: "Marcar paso base sin perder conteo.",
        takeaways: ["Conteo 1-8", "Cambio de peso"],
      },
      {
        slug: "cross-body",
        title: "Cross Body Lead",
        durationMin: 24,
        status: LessonGateStatus.active,
        objective: "Guiar cruce con frame estable.",
        takeaways: ["Senal clara", "Conexion"],
      },
    ],
  },
];

async function seedStyles() {
  const styleIdBySlug = new Map<string, string>();

  for (const style of styleSeed) {
    const record = await prisma.style.upsert({
      where: { slug: style.slug },
      update: {
        name: style.name,
        summary: style.summary,
        categoryPrimary: style.categoryPrimary,
        level: style.level,
        featuredTag: style.featuredTag,
        classesCount: style.classesCount,
        imageGradient: style.imageGradient,
        movementPrinciples: style.movementPrinciples,
        musicalityBasics: style.musicalityBasics,
        historicalCulturalContext: style.historicalCulturalContext,
        publishedStatus: style.publishedStatus,
      },
      create: {
        slug: style.slug,
        name: style.name,
        summary: style.summary,
        categoryPrimary: style.categoryPrimary,
        level: style.level,
        featuredTag: style.featuredTag,
        classesCount: style.classesCount,
        imageGradient: style.imageGradient,
        movementPrinciples: style.movementPrinciples,
        musicalityBasics: style.musicalityBasics,
        historicalCulturalContext: style.historicalCulturalContext,
        publishedStatus: style.publishedStatus,
      },
    });

    styleIdBySlug.set(style.slug, record.id);
  }

  return styleIdBySlug;
}

async function seedSubstyles(styleIdBySlug: Map<string, string>) {
  const substyleIdBySlug = new Map<string, string>();

  for (const substyle of substyleSeed) {
    const styleId = styleIdBySlug.get(substyle.styleSlug);
    if (!styleId) {
      throw new Error(`Style slug not found for substyle: ${substyle.slug}`);
    }

    const record = await prisma.substyle.upsert({
      where: { slug: substyle.slug },
      update: {
        styleId,
        name: substyle.name,
        summary: substyle.summary,
        technicalFocus: substyle.technicalFocus,
        origin: substyle.origin,
        playlistBpm: substyle.playlistBpm,
        vibe: substyle.vibe,
        publishedStatus: substyle.publishedStatus,
      },
      create: {
        styleId,
        slug: substyle.slug,
        name: substyle.name,
        summary: substyle.summary,
        technicalFocus: substyle.technicalFocus,
        origin: substyle.origin,
        playlistBpm: substyle.playlistBpm,
        vibe: substyle.vibe,
        publishedStatus: substyle.publishedStatus,
      },
    });

    substyleIdBySlug.set(substyle.slug, record.id);
  }

  return substyleIdBySlug;
}

async function seedMoves(styleIdBySlug: Map<string, string>) {
  const moveIdBySlug = new Map<string, string>();

  for (const move of moveSeed) {
    const record = await prisma.move.upsert({
      where: { slug: move.slug },
      update: {
        name: move.name,
        summary: move.summary,
        moveType: move.moveType,
        difficulty: move.difficulty,
        family: move.family,
        bpmRange: move.bpmRange,
        stepByStep: move.stepByStep,
        commonMistakes: move.commonMistakes,
        publishedStatus: move.publishedStatus,
      },
      create: {
        slug: move.slug,
        name: move.name,
        summary: move.summary,
        moveType: move.moveType,
        difficulty: move.difficulty,
        family: move.family,
        bpmRange: move.bpmRange,
        stepByStep: move.stepByStep,
        commonMistakes: move.commonMistakes,
        publishedStatus: move.publishedStatus,
      },
    });

    moveIdBySlug.set(move.slug, record.id);

    for (const styleSlug of move.styleSlugs) {
      const styleId = styleIdBySlug.get(styleSlug);
      if (!styleId) {
        continue;
      }

      await prisma.moveStyle.upsert({
        where: {
          moveId_styleId: {
            moveId: record.id,
            styleId,
          },
        },
        update: {},
        create: {
          moveId: record.id,
          styleId,
          relevance: 1,
        },
      });
    }
  }

  return moveIdBySlug;
}

async function seedCourses(styleIdBySlug: Map<string, string>, moveIdBySlug: Map<string, string>) {
  const lessonIdBySlug = new Map<string, string>();
  const courseIdBySlug = new Map<string, string>();

  for (const course of courseSeed) {
    for (const lesson of course.lessons) {
      const lessonRecord = await prisma.lesson.upsert({
        where: { slug: lesson.slug },
        update: {
          title: lesson.title,
          objective: lesson.objective,
          level: course.targetLevel,
          durationMin: lesson.durationMin,
          lessonType: LessonType.drill,
          steps: lesson.takeaways,
          successCriteria: lesson.takeaways,
          publishedStatus: EditorialStatus.published,
        },
        create: {
          slug: lesson.slug,
          title: lesson.title,
          objective: lesson.objective,
          level: course.targetLevel,
          durationMin: lesson.durationMin,
          lessonType: LessonType.drill,
          steps: lesson.takeaways,
          successCriteria: lesson.takeaways,
          publishedStatus: EditorialStatus.published,
        },
      });

      lessonIdBySlug.set(lesson.slug, lessonRecord.id);
    }
  }

  for (const course of courseSeed) {
    const styleId = styleIdBySlug.get(course.styleSlug);
    if (!styleId) {
      throw new Error(`Style slug not found for course: ${course.slug}`);
    }

    const courseRecord = await prisma.course.upsert({
      where: { slug: course.slug },
      update: {
        styleId,
        title: course.title,
        summary: course.summary,
        targetLevel: course.targetLevel,
        durationHours: course.durationHours,
        completionRule: CourseCompletionRule.all_lessons,
        certificateEligible: course.certificateEligible,
        publishedStatus: course.publishedStatus,
      },
      create: {
        styleId,
        slug: course.slug,
        title: course.title,
        summary: course.summary,
        targetLevel: course.targetLevel,
        durationHours: course.durationHours,
        completionRule: CourseCompletionRule.all_lessons,
        certificateEligible: course.certificateEligible,
        publishedStatus: course.publishedStatus,
      },
    });

    courseIdBySlug.set(course.slug, courseRecord.id);

    for (let index = 0; index < course.lessons.length; index += 1) {
      const lesson = course.lessons[index];
      const lessonId = lessonIdBySlug.get(lesson.slug);
      if (!lessonId) {
        continue;
      }

      await prisma.courseLesson.upsert({
        where: {
          courseId_lessonId: {
            courseId: courseRecord.id,
            lessonId,
          },
        },
        update: {
          orderIndex: index + 1,
          gateStatus: lesson.status,
        },
        create: {
          courseId: courseRecord.id,
          lessonId,
          orderIndex: index + 1,
          gateStatus: lesson.status,
        },
      });
    }
  }

  const shuffleMoveId = moveIdBySlug.get("the-shuffle");
  const rockLessonId = lessonIdBySlug.get("rock-fundamentals");
  if (shuffleMoveId && rockLessonId) {
    await prisma.lessonMove.upsert({
      where: {
        lessonId_moveId: {
          lessonId: rockLessonId,
          moveId: shuffleMoveId,
        },
      },
      update: { orderIndex: 1 },
      create: {
        lessonId: rockLessonId,
        moveId: shuffleMoveId,
        orderIndex: 1,
      },
    });
  }

  return { courseIdBySlug };
}

async function seedUsersAndProgress(courseIdBySlug: Map<string, string>) {
  const luna = await prisma.user.upsert({
    where: { email: "luna@dance.local" },
    update: {
      name: "Luna Rivera",
      role: "STUDENT",
      passwordHash: hashPassword(STUDENT_DEMO_PASSWORD),
    },
    create: {
      email: "luna@dance.local",
      name: "Luna Rivera",
      role: "STUDENT",
      passwordHash: hashPassword(STUDENT_DEMO_PASSWORD),
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@dance.local" },
    update: {
      name: "Dance Admin",
      role: "ADMIN",
      passwordHash: hashPassword(ADMIN_DEMO_PASSWORD),
    },
    create: {
      email: "admin@dance.local",
      name: "Dance Admin",
      role: "ADMIN",
      passwordHash: hashPassword(ADMIN_DEMO_PASSWORD),
    },
  });

  await prisma.userProgress.deleteMany({ where: { userId: luna.id } });

  const hipHopCourseId = courseIdBySlug.get("hip-hop-foundations");
  const salsaCourseId = courseIdBySlug.get("salsa-beginner-level-1");
  const houseCourseId = courseIdBySlug.get("house-foundations");

  if (hipHopCourseId) {
    await prisma.userProgress.create({
      data: {
        userId: luna.id,
        courseId: hipHopCourseId,
        status: ProgressStatus.in_progress,
        percent: 65,
      },
    });
  }

  if (salsaCourseId) {
    await prisma.userProgress.create({
      data: {
        userId: luna.id,
        courseId: salsaCourseId,
        status: ProgressStatus.in_progress,
        percent: 32,
      },
    });
  }

  if (houseCourseId) {
    await prisma.userProgress.create({
      data: {
        userId: luna.id,
        courseId: houseCourseId,
        status: ProgressStatus.completed,
        percent: 100,
        completedAt: new Date("2026-01-30T08:00:00Z"),
      },
    });

    await prisma.certificate.upsert({
      where: { certificateCode: "DA-HOUSE-2026-91C2" },
      update: {
        userId: luna.id,
        courseId: houseCourseId,
      },
      create: {
        userId: luna.id,
        courseId: houseCourseId,
        certificateCode: "DA-HOUSE-2026-91C2",
        issuedAt: new Date("2026-01-30T08:00:00Z"),
        metadataJson: {
          template: "mvp-v1",
          source: "seed",
        },
      },
    });
  }
}

async function seedConceptsAndGraph(styleIdBySlug: Map<string, string>, moveIdBySlug: Map<string, string>) {
  const groove = await prisma.techniqueConcept.upsert({
    where: { slug: "groove" },
    update: { name: "Groove", definition: "Control ritmico continuo en torso y base." },
    create: {
      slug: "groove",
      name: "Groove",
      definition: "Control ritmico continuo en torso y base.",
    },
  });

  const downbeat = await prisma.musicConcept.upsert({
    where: { slug: "downbeat" },
    update: { name: "Downbeat", definition: "Acento principal del compas.", bpmMin: 90, bpmMax: 130 },
    create: {
      slug: "downbeat",
      name: "Downbeat",
      definition: "Acento principal del compas.",
      bpmMin: 90,
      bpmMax: 130,
    },
  });

  const shuffleMoveId = moveIdBySlug.get("the-shuffle");
  if (shuffleMoveId) {
    await prisma.moveTechniqueConcept.upsert({
      where: {
        moveId_techniqueConceptId: {
          moveId: shuffleMoveId,
          techniqueConceptId: groove.id,
        },
      },
      update: {},
      create: {
        moveId: shuffleMoveId,
        techniqueConceptId: groove.id,
      },
    });

    await prisma.moveMusicConcept.upsert({
      where: {
        moveId_musicConceptId: {
          moveId: shuffleMoveId,
          musicConceptId: downbeat.id,
        },
      },
      update: {},
      create: {
        moveId: shuffleMoveId,
        musicConceptId: downbeat.id,
      },
    });
  }

  const hipHopStyleId = styleIdBySlug.get("hip-hop");
  const houseStyleId = styleIdBySlug.get("house");
  if (!hipHopStyleId || !houseStyleId) {
    return;
  }

  const hipHopNode = await prisma.node.upsert({
    where: { styleId: hipHopStyleId },
    update: {
      nodeType: "style",
    },
    create: {
      nodeType: "style",
      styleId: hipHopStyleId,
    },
  });

  const houseNode = await prisma.node.upsert({
    where: { styleId: houseStyleId },
    update: {
      nodeType: "style",
    },
    create: {
      nodeType: "style",
      styleId: houseStyleId,
    },
  });

  await prisma.connection.upsert({
    where: {
      fromNodeId_toNodeId_connectionType: {
        fromNodeId: hipHopNode.id,
        toNodeId: houseNode.id,
        connectionType: "influence",
      },
    },
    update: {
      strength: 4,
      note: "Intercambio de vocabulario en escenas urbanas.",
      startPeriod: "1980s",
    },
    create: {
      fromNodeId: hipHopNode.id,
      toNodeId: houseNode.id,
      connectionType: "influence",
      strength: 4,
      note: "Intercambio de vocabulario en escenas urbanas.",
      startPeriod: "1980s",
    },
  });
}

async function seedMediaAndCitations() {
  const media = await prisma.media.upsert({
    where: { url: "/media/courses/hip-hop-foundations-intro.mp4" },
    update: {
      title: "Hip Hop Foundations - Intro",
      provider: MediaProvider.other,
      rightsStatus: RightsStatus.ok_to_embed,
    },
    create: {
      provider: MediaProvider.other,
      url: "/media/courses/hip-hop-foundations-intro.mp4",
      title: "Hip Hop Foundations - Intro",
      rightsStatus: RightsStatus.ok_to_embed,
      durationSec: 540,
    },
  });

  const hipHopStyle = await prisma.style.findUnique({ where: { slug: "hip-hop" } });
  if (hipHopStyle) {
    await prisma.mediaLink.upsert({
      where: {
        mediaId_entityType_entityId: {
          mediaId: media.id,
          entityType: "style",
          entityId: hipHopStyle.id,
        },
      },
      update: {},
      create: {
        mediaId: media.id,
        entityType: "style",
        entityId: hipHopStyle.id,
        role: "reference",
      },
    });
  }

  const shuffleMove = await prisma.move.findUnique({ where: { slug: "the-shuffle" } });
  if (shuffleMove) {
    const shuffleMediaPrimary = await prisma.media.upsert({
      where: { url: "/media/moves/the-shuffle-slow-breakdown.mp4" },
      update: {
        title: "The Shuffle - Slow Breakdown",
        provider: MediaProvider.other,
        rightsStatus: RightsStatus.ok_to_embed,
      },
      create: {
        provider: MediaProvider.other,
        url: "/media/moves/the-shuffle-slow-breakdown.mp4",
        title: "The Shuffle - Slow Breakdown",
        rightsStatus: RightsStatus.ok_to_embed,
        durationSec: 420,
      },
    });

    const shuffleMediaRestricted = await prisma.media.upsert({
      where: { url: "/media/moves/the-shuffle-drill-restricted.mp4" },
      update: {
        title: "Shuffle Drill Session (restricted sample)",
        provider: MediaProvider.other,
        rightsStatus: RightsStatus.restricted,
      },
      create: {
        provider: MediaProvider.other,
        url: "/media/moves/the-shuffle-drill-restricted.mp4",
        title: "Shuffle Drill Session (restricted sample)",
        rightsStatus: RightsStatus.restricted,
        durationSec: 360,
      },
    });

    await prisma.mediaLink.upsert({
      where: {
        mediaId_entityType_entityId: {
          mediaId: shuffleMediaPrimary.id,
          entityType: "move",
          entityId: shuffleMove.id,
        },
      },
      update: {
        role: "demo",
      },
      create: {
        mediaId: shuffleMediaPrimary.id,
        entityType: "move",
        entityId: shuffleMove.id,
        role: "demo",
      },
    });

    await prisma.mediaLink.upsert({
      where: {
        mediaId_entityType_entityId: {
          mediaId: shuffleMediaRestricted.id,
          entityType: "move",
          entityId: shuffleMove.id,
        },
      },
      update: {
        role: "reference",
      },
      create: {
        mediaId: shuffleMediaRestricted.id,
        entityType: "move",
        entityId: shuffleMove.id,
        role: "reference",
      },
    });
  }

  const hipHopCourse = await prisma.course.findUnique({ where: { slug: "hip-hop-foundations" } });
  if (hipHopCourse) {
    const courseMediaBlocked = await prisma.media.upsert({
      where: { url: "/media/courses/hip-hop-foundations-archive.mp4" },
      update: {
        title: "Hip Hop Foundations - Archive Clip",
        provider: MediaProvider.other,
        rightsStatus: RightsStatus.blocked,
      },
      create: {
        provider: MediaProvider.other,
        url: "/media/courses/hip-hop-foundations-archive.mp4",
        title: "Hip Hop Foundations - Archive Clip",
        rightsStatus: RightsStatus.blocked,
        durationSec: 540,
      },
    });

    const courseMediaUnknown = await prisma.media.upsert({
      where: { url: "/media/courses/hip-hop-foundations-rights-pending.mp4" },
      update: {
        title: "Hip Hop Foundations - Rights Pending",
        provider: MediaProvider.other,
        rightsStatus: RightsStatus.unknown,
      },
      create: {
        provider: MediaProvider.other,
        url: "/media/courses/hip-hop-foundations-rights-pending.mp4",
        title: "Hip Hop Foundations - Rights Pending",
        rightsStatus: RightsStatus.unknown,
        durationSec: 510,
      },
    });

    await prisma.mediaLink.upsert({
      where: {
        mediaId_entityType_entityId: {
          mediaId: courseMediaBlocked.id,
          entityType: "course",
          entityId: hipHopCourse.id,
        },
      },
      update: {
        role: "archive",
      },
      create: {
        mediaId: courseMediaBlocked.id,
        entityType: "course",
        entityId: hipHopCourse.id,
        role: "archive",
      },
    });

    await prisma.mediaLink.upsert({
      where: {
        mediaId_entityType_entityId: {
          mediaId: courseMediaUnknown.id,
          entityType: "course",
          entityId: hipHopCourse.id,
        },
      },
      update: {
        role: "pending",
      },
      create: {
        mediaId: courseMediaUnknown.id,
        entityType: "course",
        entityId: hipHopCourse.id,
        role: "pending",
      },
    });
  }

  let citation = await prisma.citation.findFirst({
    where: {
      title: "Street Dance Heritage Notes",
      sourceType: SourceType.article,
    },
  });
  if (!citation) {
    citation = await prisma.citation.create({
      data: {
        sourceType: SourceType.article,
        title: "Street Dance Heritage Notes",
        author: "Editorial Board",
        year: 2024,
        url: "https://example.org/street-dance-heritage",
        claimScope: "Historia general de estilos urbanos.",
      },
    });
  }

  if (hipHopStyle) {
    await prisma.citationLink.upsert({
      where: {
        citationId_entityType_entityId: {
          citationId: citation.id,
          entityType: "style",
          entityId: hipHopStyle.id,
        },
      },
      update: {},
      create: {
        citationId: citation.id,
        entityType: "style",
        entityId: hipHopStyle.id,
      },
    });
  }

  const rockLesson = await prisma.lesson.findUnique({
    where: {
      slug: "rock-fundamentals",
    },
  });

  const existingCourseCitation = await prisma.citation.findFirst({
    where: {
      url: "https://example.org/hip-hop-foundations-syllabus",
    },
  });

  const courseCitation =
    existingCourseCitation ??
    (await prisma.citation.create({
      data: {
        sourceType: SourceType.article,
        title: "Hip Hop Foundations Syllabus Notes",
        author: "Dance Academy Editorial",
        year: 2025,
        url: "https://example.org/hip-hop-foundations-syllabus",
        claimScope: "Referencias del curso Hip Hop Foundations.",
      },
    }));

  if (hipHopCourse) {
    await prisma.citationLink.upsert({
      where: {
        citationId_entityType_entityId: {
          citationId: courseCitation.id,
          entityType: "course",
          entityId: hipHopCourse.id,
        },
      },
      update: {},
      create: {
        citationId: courseCitation.id,
        entityType: "course",
        entityId: hipHopCourse.id,
      },
    });
  }

  const existingLessonCitation = await prisma.citation.findFirst({
    where: {
      url: "https://example.org/rock-fundamentals-breakdown",
    },
  });

  const lessonCitation =
    existingLessonCitation ??
    (await prisma.citation.create({
      data: {
        sourceType: SourceType.website,
        title: "The Rock Fundamentals Breakdown",
        author: "Coach Nyx",
        year: 2025,
        url: "https://example.org/rock-fundamentals-breakdown",
        claimScope: "Referencia tecnica de la leccion Rock Fundamentals.",
      },
    }));

  if (rockLesson) {
    await prisma.citationLink.upsert({
      where: {
        citationId_entityType_entityId: {
          citationId: lessonCitation.id,
          entityType: "lesson",
          entityId: rockLesson.id,
        },
      },
      update: {},
      create: {
        citationId: lessonCitation.id,
        entityType: "lesson",
        entityId: rockLesson.id,
      },
    });
  }
}

async function main() {
  const styleIdBySlug = await seedStyles();
  await seedSubstyles(styleIdBySlug);
  const moveIdBySlug = await seedMoves(styleIdBySlug);
  const { courseIdBySlug } = await seedCourses(styleIdBySlug, moveIdBySlug);
  await seedUsersAndProgress(courseIdBySlug);
  await seedConceptsAndGraph(styleIdBySlug, moveIdBySlug);
  await seedMediaAndCitations();

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
