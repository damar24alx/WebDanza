import { AlertTriangle, ShieldAlert } from "lucide-react";
import type { MediaAssetMock } from "@/mocks/types";
import { Badge, Card, CardContent } from "@/components/ui";

type ContentMediaPanelProps = {
  items: MediaAssetMock[];
  title?: string;
  emptyLabel?: string;
};

const LOCAL_BASE_URL = "http://localhost";

function normalizeInternalPlaybackPath(rawUrl: string) {
  const value = rawUrl.trim();
  if (!value.startsWith("/")) {
    return undefined;
  }
  if (value.includes("\\") || value.includes("..")) {
    return undefined;
  }

  try {
    const parsed = new URL(value, LOCAL_BASE_URL);
    if (parsed.origin !== LOCAL_BASE_URL) {
      return undefined;
    }
    if (!parsed.pathname.startsWith("/media/")) {
      return undefined;
    }
    if (parsed.hash) {
      return undefined;
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return undefined;
  }
}

function blockedLabel(rightsStatus: MediaAssetMock["rightsStatus"]) {
  if (rightsStatus === "restricted") {
    return "Media con restricciones de reproduccion.";
  }
  if (rightsStatus === "blocked") {
    return "Media bloqueada por politica de derechos.";
  }

  return "Media pendiente de validacion de derechos.";
}

function providerLabel(provider: MediaAssetMock["provider"]) {
  if (provider === "other") {
    return "interno";
  }
  return "legacy";
}

export function ContentMediaPanel({
  items,
  title = "Media",
  emptyLabel = "Aun no hay media publicada para este contenido.",
}: ContentMediaPanelProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="mt-2 text-sm text-[var(--text-2)]">{emptyLabel}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const playablePath =
          item.rightsStatus === "ok_to_embed"
            ? normalizeInternalPlaybackPath(item.url)
            : undefined;

        return (
          <Card key={item.id}>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <Badge variant="neutral">{providerLabel(item.provider)}</Badge>
                <Badge variant={item.rightsStatus === "ok_to_embed" ? "success" : "warning"}>
                  {item.rightsStatus}
                </Badge>
              </div>

              {playablePath ? (
                <div className="overflow-hidden rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)]">
                  <video
                    src={playablePath}
                    title={item.title}
                    className="aspect-video w-full"
                    controls
                    preload="metadata"
                    playsInline
                  >
                    Tu navegador no soporta video HTML5.
                  </video>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--border-1)] bg-[var(--surface-2)] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                    {item.rightsStatus === "ok_to_embed" ? (
                      <AlertTriangle size={15} />
                    ) : (
                      <ShieldAlert size={15} />
                    )}
                    {item.rightsStatus === "ok_to_embed"
                      ? "La ruta interna de media no es valida o no esta disponible."
                      : blockedLabel(item.rightsStatus)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
