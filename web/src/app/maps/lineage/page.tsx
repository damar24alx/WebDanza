import { AppShell } from "@/components/layout";
import { InteractiveLineageMap } from "@/components/maps/InteractiveLineageMap";

export default function DanceLineageMapPage() {
  return (
    <AppShell fullWidth hideFooter className="max-w-none px-0 pb-0 pt-0">
      <InteractiveLineageMap />
    </AppShell>
  );
}

