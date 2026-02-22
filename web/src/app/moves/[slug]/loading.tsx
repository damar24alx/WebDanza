import { AppShell } from "@/components/layout";
import { LoadingSkeleton } from "@/components/states";

export default function MoveDetailLoading() {
  return (
    <AppShell>
      <LoadingSkeleton variant="detail" />
    </AppShell>
  );
}
