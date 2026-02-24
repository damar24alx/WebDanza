import { EditorialStatus } from "@prisma/client";

export type AdminActorRole = "ADMIN" | "EDITOR" | "REVIEWER";

export type AdminAction =
  | "create_content"
  | "edit_content"
  | "archive_content"
  | "link_citation"
  | "set_status";

export function parseAdminActorRole(value: unknown): AdminActorRole {
  if (value === "ADMIN" || value === "EDITOR" || value === "REVIEWER") {
    return value;
  }

  if (value === "admin") {
    return "ADMIN";
  }
  if (value === "editor") {
    return "EDITOR";
  }
  if (value === "reviewer") {
    return "REVIEWER";
  }

  return "REVIEWER";
}

export function hasAdminActionPermission(
  role: AdminActorRole,
  action: AdminAction,
  targetStatus?: EditorialStatus,
): boolean {
  if (action === "archive_content") {
    return role === "ADMIN";
  }

  if (action === "create_content" || action === "edit_content") {
    return role === "ADMIN" || role === "EDITOR";
  }

  if (action === "link_citation") {
    return role === "ADMIN" || role === "EDITOR" || role === "REVIEWER";
  }

  if (action === "set_status") {
    if (!targetStatus) {
      return false;
    }

    if (role === "ADMIN") {
      return true;
    }

    if (role === "EDITOR") {
      return targetStatus === "draft" || targetStatus === "review" || targetStatus === "ready";
    }

    return targetStatus === "review" || targetStatus === "ready";
  }

  return false;
}

export function rolePermissionMessage(
  role: AdminActorRole,
  action: AdminAction,
  targetStatus?: EditorialStatus,
) {
  if (action === "set_status" && targetStatus) {
    return `Rol ${role} no puede mover estado a ${targetStatus}.`;
  }

  if (action === "archive_content") {
    return `Rol ${role} no puede borrar logico contenido.`;
  }

  if (action === "create_content") {
    return `Rol ${role} no puede crear contenido.`;
  }

  if (action === "edit_content") {
    return `Rol ${role} no puede editar contenido.`;
  }

  return `Rol ${role} no tiene permiso para esta accion.`;
}
