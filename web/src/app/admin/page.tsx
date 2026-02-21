import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";
import { AppShell, Sidebar } from "@/components/layout";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { movesMock } from "@/mocks";

export default function AdminPage() {
  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <Sidebar
          title="Dance Admin"
          className="sticky top-24 hidden h-fit lg:block"
          items={[
            { label: "Moves Management", href: "/admin", active: true },
            { label: "Content Review", href: "/admin/review" },
            { label: "Styles", muted: true },
            { label: "Substyles", muted: true },
            { label: "Sources", muted: true },
          ]}
        />

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h1 className="text-3xl font-bold text-white">Moves Management</h1>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              Gestión editorial interna para estado draft/review/ready/published.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input icon={<Search size={16} />} placeholder="Buscar move por nombre o slug" />
              <Button leftIcon={<Plus size={16} />}>Nuevo Move</Button>
            </div>
          </header>

          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--border-1)] text-xs uppercase tracking-[0.08em] text-[var(--text-3)]">
                    <th className="py-3">Name</th>
                    <th className="py-3">Slug</th>
                    <th className="py-3">Difficulty</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {movesMock.map((move, index) => {
                    const status = index % 3 === 0 ? "review" : index % 3 === 1 ? "draft" : "ready";
                    return (
                      <tr key={move.slug} className="border-b border-[var(--border-1)] text-sm">
                        <td className="py-3 font-semibold text-white">{move.name}</td>
                        <td className="py-3 text-[var(--text-2)]">{move.slug}</td>
                        <td className="py-3 text-[var(--text-2)]">{move.difficulty}</td>
                        <td className="py-3">
                          <Badge
                            variant={
                              status === "ready" ? "success" : status === "review" ? "warning" : "neutral"
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Link href="/admin/review">
                            <Button size="sm" variant="outline" leftIcon={<Eye size={14} />}>
                              Revisar
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
