import Link from "next/link";
import {
  Eye,
  Filter,
  LayoutDashboard,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Badge, Button, Card, CardContent, Input } from "@/components/ui";
import { movesMock } from "@/mocks";

export default function AdminPage() {
  return (
    <AppShell fullWidth hideFooter className="max-w-[1500px]">
      <div className="mx-auto flex w-full max-w-[1450px] gap-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-4 lg:block">
          <h1 className="mb-5 text-lg font-bold text-white">Dance Admin</h1>
          <nav className="space-y-2 text-sm">
            <MenuItem label="Dashboard" icon={<LayoutDashboard size={15} />} muted />
            <MenuItem label="Moves Management" active />
            <MenuItem label="Content Review" href="/admin/review" />
            <MenuItem label="Styles" muted />
            <MenuItem label="Substyles" muted />
            <MenuItem label="Sources" muted />
          </nav>
        </aside>

        <section className="min-w-0 flex-1 space-y-6">
          <header className="rounded-2xl border border-[var(--border-1)] bg-[var(--surface-1)] p-6">
            <h2 className="text-3xl font-bold text-white">Moves Management</h2>
            <p className="mt-1 text-sm text-[var(--text-2)]">
              Administra estados editoriales draft, review y ready en un solo panel.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto,auto,auto]">
              <Input icon={<Search size={16} />} placeholder="Buscar move por nombre o slug" />
              <Button variant="outline" leftIcon={<Filter size={15} />}>
                Filtros
              </Button>
              <Button variant="outline" leftIcon={<SlidersHorizontal size={15} />}>
                Sort
              </Button>
              <Button leftIcon={<Plus size={16} />}>Nuevo Move</Button>
            </div>
          </header>

          <Card>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-left">
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

function MenuItem({
  label,
  href,
  active,
  muted,
  icon,
}: {
  label: string;
  href?: string;
  active?: boolean;
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  const cls = `flex items-center gap-2 rounded-lg px-3 py-2 ${
    active
      ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-soft)]"
      : muted
        ? "text-[var(--text-3)]"
        : "text-[var(--text-2)] hover:bg-white/5 hover:text-[var(--text-1)]"
  }`;

  if (href && !muted) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <div className={cls}>
      {icon}
      {label}
    </div>
  );
}
