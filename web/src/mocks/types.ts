export type Difficulty = "beginner" | "intermediate" | "advanced";

export type StyleMock = {
  slug: string;
  name: string;
  summary: string;
  category: string;
  level: Difficulty | "all";
  featuredTag?: string;
  classesCount: number;
  principles: string[];
  musicality: string;
  history: string;
  image: string;
  imageUrl?: string;
};

export type SubstyleMock = {
  slug: string;
  styleSlug: string;
  name: string;
  summary: string;
  origin: string;
  focus: string[];
  playlistBpm: string;
  vibe: string;
};

export type MoveMock = {
  slug: string;
  name: string;
  summary: string;
  moveType: string;
  difficulty: Difficulty;
  bpmRange: string;
  family: string;
  styleSlugs: string[];
  stepByStep: string[];
  commonMistakes: Array<{ issue: string; correction: string }>;
  media: MediaAssetMock[];
  coverImageUrl?: string;
};

export type CourseLessonMock = {
  id?: string;
  slug: string;
  title: string;
  durationMin: number;
  status: "done" | "active" | "locked";
  objective: string;
  takeaways: string[];
  steps: Array<{
    index: number;
    label: string;
    completed: boolean;
  }>;
  completedSteps: number;
  totalSteps: number;
  percent: number;
  nextStepIndex: number | null;
  citations?: CitationAssetMock[];
};

export type CourseMock = {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  styleSlug: string;
  level: Difficulty;
  durationHours: number;
  lessons: CourseLessonMock[];
  certificateEligible: boolean;
  progressPercent: number;
  resumeLessonSlug?: string | null;
  resumeStepIndex?: number | null;
  media: MediaAssetMock[];
  citations?: CitationAssetMock[];
};

export type MediaAssetMock = {
  id: string;
  provider: "youtube" | "vimeo" | "other";
  rightsStatus: "unknown" | "ok_to_embed" | "restricted" | "blocked";
  url: string;
  title: string;
  durationSec: number | null;
  role: string | null;
};

export type CitationAssetMock = {
  id: string;
  sourceType: string;
  title: string;
  author: string | null;
  year: number | null;
  url: string | null;
};

export type PricingPlanMock = {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  highlight?: boolean;
  description: string;
  features: string[];
  cta: string;
};

export type UserMock = {
  name: string;
  role: "student" | "admin" | "editor";
  streakDays: number;
  hoursLearned: number;
  currentLevel: string;
  activeCourseSlug: string;
  certificates: Array<{
    code: string;
    courseSlug: string;
    issuedAt: string;
    verified: boolean;
  }>;
  badges: string[];
};
