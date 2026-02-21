import { LoadingState } from "@/components/state/SystemStates";

export default function GlobalLoading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-4 py-12">
      <LoadingState className="w-full" />
    </main>
  );
}
