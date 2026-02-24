export type DanceMapLayerId = "global-lineage" | "urban-lineage" | "afro-latin-bridge";

export type DanceMapConnectionType =
  | "creacion"
  | "migracion"
  | "fusion"
  | "ramificacion"
  | "expansion"
  | "influencia";

export type DanceMapLayer = {
  id: DanceMapLayerId;
  label: string;
  accentColor: string;
  description: string;
};

export type DanceMapNode = {
  id: string;
  label: string;
  city: string;
  region: string;
  x: number;
  y: number;
  startYear: number;
  layers: DanceMapLayerId[];
  summary: string;
  origins: string;
  imageUrl: string;
  styleSlug?: string;
};

export type DanceMapConnection = {
  id: string;
  from: string;
  to: string;
  type: DanceMapConnectionType;
  startYear: number;
  endYear?: number;
  strength: 1 | 2 | 3 | 4 | 5;
  layers: DanceMapLayerId[];
  note: string;
};

export const DANCE_MAP_YEAR_MIN = 1920;
export const DANCE_MAP_YEAR_MAX = 2024;
export const DANCE_MAP_INITIAL_YEAR = 1973;
export const DANCE_MAP_DEFAULT_NODE_ID = "bronx";

export const DANCE_MAP_LAYERS: DanceMapLayer[] = [
  {
    id: "global-lineage",
    label: "Linea global",
    accentColor: "#6d4cff",
    description: "Vista panoramica de influencias globales de la danza.",
  },
  {
    id: "urban-lineage",
    label: "Evolucion urbana",
    accentColor: "#26cdf9",
    description: "Cruces entre escenas urbanas y clubes de diferentes ciudades.",
  },
  {
    id: "afro-latin-bridge",
    label: "Puente afro-latino",
    accentColor: "#f6b73d",
    description: "Migraciones y fusiones entre ritmos afro y latinos.",
  },
];

export const DANCE_MAP_NODES: DanceMapNode[] = [
  {
    id: "havana",
    label: "Raices afrocubanas",
    city: "La Habana",
    region: "Cuba",
    x: 25,
    y: 41,
    startYear: 1940,
    layers: ["global-lineage", "afro-latin-bridge"],
    summary: "Punto clave donde convergen tradiciones africanas y caribenas.",
    origins:
      "Nodo provisional para representar la mezcla de ritual, percusion y danza social afrocaribena que luego influye a escenas urbanas.",
    imageUrl: "/media/images/stitch/trend-tango.jpg",
    styleSlug: "salsa",
  },
  {
    id: "los-angeles",
    label: "Funk Styles",
    city: "Los Angeles",
    region: "Estados Unidos",
    x: 17,
    y: 35,
    startYear: 1970,
    layers: ["global-lineage", "urban-lineage"],
    summary: "Locking y popping consolidan vocabulario tecnico escenico.",
    origins:
      "Nodo provisional para modelar el impacto de TV, clubs y crew culture en la codificacion de pasos urbanos.",
    imageUrl: "/media/images/stitch/trend-portrait.jpg",
    styleSlug: "popping",
  },
  {
    id: "bronx",
    label: "Hip Hop Nucleo",
    city: "The Bronx",
    region: "Nueva York",
    x: 24,
    y: 32,
    startYear: 1973,
    layers: ["global-lineage", "urban-lineage"],
    summary: "Bloques, DJs y cyphers construyen la base del linaje Hip Hop.",
    origins:
      "Nodo provisional para representar el nacimiento de breaking, party dance y cultura de batalla en espacios comunitarios.",
    imageUrl: "/media/images/stitch/hero-home.jpg",
    styleSlug: "hip-hop",
  },
  {
    id: "kingston",
    label: "Dancehall Core",
    city: "Kingston",
    region: "Jamaica",
    x: 23,
    y: 45,
    startYear: 1980,
    layers: ["global-lineage", "afro-latin-bridge"],
    summary: "Social dances jamaicanas expanden lenguaje de groove y attitud.",
    origins:
      "Nodo provisional para visualizar como los dance moves de sound systems viajan y generan derivados regionales.",
    imageUrl: "/media/images/stitch/card-dictionary.jpg",
    styleSlug: "dancehall",
  },
  {
    id: "chicago",
    label: "House Foundation",
    city: "Chicago",
    region: "Estados Unidos",
    x: 21,
    y: 29,
    startYear: 1983,
    layers: ["global-lineage", "urban-lineage"],
    summary: "Footwork, jacking y clubbing redefinen musicalidad de pista.",
    origins:
      "Nodo provisional para representar la transicion de discoteca a house y su impacto en tecnica de pies.",
    imageUrl: "/media/images/stitch/card-academy.jpg",
    styleSlug: "house",
  },
  {
    id: "london",
    label: "Cruce europeo",
    city: "Londres",
    region: "Reino Unido",
    x: 45,
    y: 26,
    startYear: 1985,
    layers: ["global-lineage", "urban-lineage", "afro-latin-bridge"],
    summary: "Escena club europea mezcla aportes de Caribe, USA y Africa.",
    origins:
      "Nodo provisional para modelar importaciones culturales y fusiones en comunidades migrantes.",
    imageUrl: "/media/images/stitch/trend-group.jpg",
    styleSlug: "house",
  },
  {
    id: "paris",
    label: "Laboratorio club",
    city: "Paris",
    region: "Francia",
    x: 48,
    y: 30,
    startYear: 1989,
    layers: ["global-lineage", "urban-lineage"],
    summary: "Escena de batallas y social dance impulsa hibridaciones.",
    origins:
      "Nodo provisional para explicar cruces entre tecnica academica, club y cultura urbana.",
    imageUrl: "/media/images/stitch/card-styles.jpg",
    styleSlug: "contemporary",
  },
  {
    id: "luanda",
    label: "Kuduro Vector",
    city: "Luanda",
    region: "Angola",
    x: 52,
    y: 56,
    startYear: 1990,
    layers: ["global-lineage", "afro-latin-bridge"],
    summary: "Velocidad ritmica y energia callejera hacia nuevos formatos.",
    origins:
      "Nodo provisional para representar la aparicion de derivados afro urbanos de alto impacto.",
    imageUrl: "/media/images/stitch/trend-breaking.jpg",
  },
  {
    id: "tokyo",
    label: "Adaptacion asiatica",
    city: "Tokyo",
    region: "Japon",
    x: 82,
    y: 34,
    startYear: 1995,
    layers: ["global-lineage", "urban-lineage"],
    summary: "Crew culture asiatica acelera precision tecnica y formatos de showcase.",
    origins:
      "Nodo provisional para visualizar adopcion, reinterpretacion y refinamiento tecnico en Asia.",
    imageUrl: "/media/images/stitch/trend-portrait.jpg",
    styleSlug: "breaking",
  },
  {
    id: "lagos",
    label: "Afrobeats Hub",
    city: "Lagos",
    region: "Nigeria",
    x: 49,
    y: 46,
    startYear: 2000,
    layers: ["global-lineage", "afro-latin-bridge"],
    summary: "Circulacion digital acelera expansion de pasos africanos contemporaneos.",
    origins:
      "Nodo provisional para mapear la etapa de viralizacion y estandarizacion internacional.",
    imageUrl: "/media/images/stitch/continue-learning.jpg",
  },
  {
    id: "saopaulo",
    label: "Puente latino urbano",
    city: "Sao Paulo",
    region: "Brasil",
    x: 31,
    y: 62,
    startYear: 2008,
    layers: ["global-lineage", "afro-latin-bridge"],
    summary: "Interseccion entre funk, passinho y codigos de batalla urbana.",
    origins:
      "Nodo provisional para representar apropiaciones locales y creacion de sublenguajes regionales.",
    imageUrl: "/media/images/stitch/card-dictionary.jpg",
  },
  {
    id: "johannesburg",
    label: "Amapiano Motion",
    city: "Johannesburgo",
    region: "Sudafrica",
    x: 56,
    y: 70,
    startYear: 2013,
    layers: ["global-lineage", "afro-latin-bridge"],
    summary: "Nueva ola de pasos sociales y musicalidad hibrida en circulacion global.",
    origins:
      "Nodo provisional para modelar la etapa reciente de fusion entre club dance y plataformas digitales.",
    imageUrl: "/media/images/stitch/trend-group.jpg",
  },
];

export const DANCE_MAP_CONNECTIONS: DanceMapConnection[] = [
  {
    id: "havana-bronx",
    from: "havana",
    to: "bronx",
    type: "migracion",
    startYear: 1968,
    strength: 4,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Intercambio de ritmos afrocaribenos en comunidades migrantes.",
  },
  {
    id: "losangeles-bronx",
    from: "los-angeles",
    to: "bronx",
    type: "influencia",
    startYear: 1973,
    strength: 3,
    layers: ["global-lineage", "urban-lineage"],
    note: "Cruce temprano de funk styles y break culture.",
  },
  {
    id: "bronx-chicago",
    from: "bronx",
    to: "chicago",
    type: "expansion",
    startYear: 1983,
    strength: 4,
    layers: ["global-lineage", "urban-lineage"],
    note: "Ecosistema de club impulsa nuevas tecnicas de footwork.",
  },
  {
    id: "kingston-london",
    from: "kingston",
    to: "london",
    type: "migracion",
    startYear: 1986,
    strength: 3,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Diaspora caribena fortalece social dances en Reino Unido.",
  },
  {
    id: "chicago-london",
    from: "chicago",
    to: "london",
    type: "expansion",
    startYear: 1988,
    strength: 4,
    layers: ["global-lineage", "urban-lineage"],
    note: "House viaja por sellos y circuitos de DJ internacionales.",
  },
  {
    id: "bronx-paris",
    from: "bronx",
    to: "paris",
    type: "expansion",
    startYear: 1989,
    strength: 4,
    layers: ["global-lineage", "urban-lineage"],
    note: "Batallas y crews europeas adoptan codigos de Hip Hop.",
  },
  {
    id: "havana-london",
    from: "havana",
    to: "london",
    type: "fusion",
    startYear: 1992,
    strength: 2,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Ritmos latinos convergen con escena club britanica.",
  },
  {
    id: "london-tokyo",
    from: "london",
    to: "tokyo",
    type: "ramificacion",
    startYear: 1999,
    strength: 3,
    layers: ["global-lineage", "urban-lineage"],
    note: "Festivales internacionales aceleran variaciones tecnicas en Asia.",
  },
  {
    id: "luanda-lagos",
    from: "luanda",
    to: "lagos",
    type: "influencia",
    startYear: 2004,
    strength: 3,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Derivados afro urbanos impactan la escena de Africa occidental.",
  },
  {
    id: "lagos-london",
    from: "lagos",
    to: "london",
    type: "fusion",
    startYear: 2006,
    strength: 4,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Puente entre afrobeats y coreografias de escena diaspora.",
  },
  {
    id: "kingston-saopaulo",
    from: "kingston",
    to: "saopaulo",
    type: "expansion",
    startYear: 2009,
    strength: 3,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Movimientos jamaicanos se reinterpretan en escenas latinas.",
  },
  {
    id: "lagos-johannesburg",
    from: "lagos",
    to: "johannesburg",
    type: "fusion",
    startYear: 2013,
    strength: 5,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Cruce de escenas da lugar a nuevas dinamicas de Amapiano dance.",
  },
  {
    id: "paris-tokyo",
    from: "paris",
    to: "tokyo",
    type: "ramificacion",
    startYear: 2015,
    strength: 2,
    layers: ["global-lineage", "urban-lineage"],
    note: "Circuitos de competencia expanden estilos hibridos.",
  },
  {
    id: "saopaulo-bronx",
    from: "saopaulo",
    to: "bronx",
    type: "fusion",
    startYear: 2018,
    strength: 2,
    layers: ["global-lineage", "afro-latin-bridge"],
    note: "Intercambio digital devuelve variantes latinas al circuito global.",
  },
];

