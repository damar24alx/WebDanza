-- Additional integrity checks for production hardening.
ALTER TABLE "UserLessonStepProgress"
  ADD CONSTRAINT "UserLessonStepProgress_stepIndex_non_negative_check"
  CHECK ("stepIndex" >= 0);

ALTER TABLE "Media"
  ADD CONSTRAINT "Media_duration_non_negative_check"
  CHECK ("durationSec" IS NULL OR "durationSec" >= 0);

ALTER TABLE "Certificate"
  ADD CONSTRAINT "Certificate_revoked_consistency_check"
  CHECK (
    ("status" = 'active' AND "revokedAt" IS NULL)
    OR ("status" = 'revoked' AND "revokedAt" IS NOT NULL)
  );
