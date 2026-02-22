import { AppShell } from "@/components/layout";
import { LoadingSkeleton } from "@/components/states";

export default function StyleDetailLoading() {
  return (
    <AppShell fullWidth>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <LoadingSkeleton variant="detail" />
      </div>
    </AppShell>
  );
}
