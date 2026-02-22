import { AppShell } from "@/components/layout";
import { LoadingSkeleton } from "@/components/states";

export default function CoursePlayerLoading() {
  return (
    <AppShell fullWidth hideFooter className="max-w-none px-0 pb-0 pt-0">
      <LoadingSkeleton variant="player" />
    </AppShell>
  );
}
