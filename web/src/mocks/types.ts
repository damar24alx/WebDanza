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
};

export type CourseLessonMock = {
  slug: string;
  title: string;
  durationMin: number;
  status: "done" | "active" | "locked";
  objective: string;
  takeaways: string[];
};

export type CourseMock = {
  slug: string;
  title: string;
  summary: string;
  styleSlug: string;
  level: Difficulty;
  durationHours: number;
  lessons: CourseLessonMock[];
  certificateEligible: boolean;
  progressPercent: number;
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
