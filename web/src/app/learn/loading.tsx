import { AppShell } from "@/components/layout";
import { LoadingSkeleton } from "@/components/states";

export default function LearnLoading() {
  return (
    <AppShell fullWidth className="max-w-[1440px]">
      <div className="mx-auto w-full max-w-[1380px]">
        <LoadingSkeleton variant="list" />
      </div>
    </AppShell>
  );
}
