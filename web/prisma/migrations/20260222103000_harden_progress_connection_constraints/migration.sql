-- Enforce UserProgress and Connection integrity constraints
ALTER TABLE "UserProgress"
  ADD CONSTRAINT "UserProgress_percent_range_check"
  CHECK ("percent" >= 0 AND "percent" <= 100);

ALTER TABLE "UserProgress"
  ADD CONSTRAINT "UserProgress_target_required_check"
  CHECK ("lessonId" IS NOT NULL OR "courseId" IS NOT NULL);

ALTER TABLE "Connection"
  ADD CONSTRAINT "Connection_distinct_nodes_check"
  CHECK ("fromNodeId" <> "toNodeId");