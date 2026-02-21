import { UserMock } from "@/mocks/types";

export const userMock: UserMock = {
  name: "Luna Rivera",
  role: "student",
  streakDays: 5,
  hoursLearned: 124,
  currentLevel: "Intermediate",
  activeCourseSlug: "hip-hop-foundations",
  certificates: [
    {
      code: "DA-HOUSE-2026-91C2",
      courseSlug: "house-foundations",
      issuedAt: "2026-01-30",
      verified: true,
    },
  ],
  badges: ["Primer curso", "Racha 5 días", "Footwork Focus"],
};
