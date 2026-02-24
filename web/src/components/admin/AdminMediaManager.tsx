import { Trash2 } from "lucide-react";
import type { AdminEntityMediaRow } from "@/server/db/admin-media";
import { Badge, Button, Card, CardContent } from "@/components/ui";

type AdminMediaManagerProps = {
  entityType: "style" | "substyle" | "move";
  entityRef: string;
  redirectTo: string;
  links: AdminEntityMediaRow[];
  title?: string;
  description?: string;
};

function rightsBadgeVariant(rightsStatus: AdminEntityMediaRow["rightsStatus"]) {
  if (rightsStatus === "ok_to_embed") {
    return "success";
  }
  if (rightsStatus === "restricted") {
    return "warning";
  }
  if (rightsStatus === "blocked") {
    return "danger";
  }

  return "neutral";
}

export function AdminMediaManager({
  entityType,
  entityRef,
  redirectTo,
  links,
  title = "Media",
  description = "Administra media interna y rightsStatus por entidad.",
}: AdminMediaManagerProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-[var(--text-3)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--text-2)]">{description}</p>
        </div>

        <div className="space-y-2">
          {links.length > 0 ? (
            links.map((item) => (
              <div key={item.linkId} className="rounded-xl border border-[var(--border-1)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{item.provider}</Badge>
                  <Badge variant={rightsBadgeVariant(item.rightsStatus)}>{item.rightsStatus}</Badge>
                  {item.role ? <Badge variant="neutral">role: {item.role}</Badge> : null}
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--color-primary-soft)]">{item.url}</p>
                <div className="mt-3">
                  <form action="/api/admin/media/unlink" method="post">
                    <input type="hidden" name="entityType" value={entityType} />
                    <input type="hidden" name="entityRef" value={entityRef} />
                    <input type="hidden" name="mediaId" value={item.mediaId} />
                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <Button type="submit" variant="danger" size="sm" leftIcon={<Trash2 size={12} />}>
                      Quitar media
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl border border-[var(--border-1)] px-4 py-3 text-sm text-[var(--text-2)]">
              No hay media vinculada.
            </p>
          )}
        </div>

        <form
          action="/api/admin/media/upload-link"
          method="post"
          encType="multipart/form-data"
          className="space-y-2 rounded-xl border border-[var(--border-1)] p-3"
        >
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityRef" value={entityRef} />
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <select
            name="rightsStatus"
            defaultValue="unknown"
            className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-2)]"
          >
            <option value="unknown">unknown</option>
            <option value="ok_to_embed">ok_to_embed</option>
            <option value="restricted">restricted</option>
            <option value="blocked">blocked</option>
          </select>

          <input
            name="title"
            required
            placeholder="Title (obligatorio)"
            className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
          />
          <input
            name="file"
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,.m4v"
            required
            className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-1)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
          />
          <p className="text-xs text-[var(--text-3)]">
            Formatos permitidos: mp4, webm, ogg, mov, m4v.
          </p>

          <div className="grid gap-2 md:grid-cols-2">
            <input
              name="durationSec"
              placeholder="Duration sec (opcional)"
              className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
            />
            <input
              name="role"
              placeholder="Role de uso (opcional)"
              className="h-10 w-full rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text-1)] placeholder:text-[var(--text-3)]"
            />
          </div>

          <Button type="submit" size="sm" className="w-full">
            Subir y vincular media
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
