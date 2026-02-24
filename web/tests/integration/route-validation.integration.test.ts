import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";
import { POST as styleCreatePost } from "../../src/app/api/admin/styles/create/route";
import { POST as citationLinkPost } from "../../src/app/api/admin/citations/link/route";
import { POST as progressCompletePost } from "../../src/app/api/progress/lessons/complete/route";
import { POST as progressStepTogglePost } from "../../src/app/api/progress/lessons/steps/toggle/route";
import { createSessionToken, SESSION_COOKIE_NAME } from "../../src/server/auth/token";

function buildFormRequest(
  pathname: string,
  formValues: Record<string, string>,
  headers: Record<string, string> = {},
) {
  const body = new URLSearchParams(formValues);
  const requestHeaders = new Headers();
  requestHeaders.set("content-type", "application/x-www-form-urlencoded");
  for (const [key, value] of Object.entries(headers)) {
    requestHeaders.set(key, value);
  }

  return new NextRequest(`http://localhost:3000${pathname}`, {
    method: "POST",
    headers: requestHeaders,
    body: body.toString(),
  });
}

describe("route validations (integration)", () => {
  test("admin style create returns 422 with fieldErrors in JSON mode", async () => {
    const adminToken = await createSessionToken({
      id: "admin-validation-id",
      email: "admin-validation@dance.local",
      name: "Admin Validation",
      role: "ADMIN",
    });

    const request = buildFormRequest(
      "/api/admin/styles/create",
      {
        slug: "invalid slug",
        name: "",
        summary: "",
        categoryPrimary: "",
        level: "invalid",
      },
      {
        cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        accept: "application/json",
      },
    );

    const response = await styleCreatePost(request);
    assert.equal(response.status, 422);
    const body = (await response.json()) as {
      ok: boolean;
      formError: string;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.ok(body.formError.length > 0);
    assert.ok(body.fieldErrors.slug?.[0]);
    assert.ok(body.fieldErrors.name?.[0]);
    assert.ok(body.fieldErrors.level?.[0]);
  });

  test("admin citations link rejects invalid URL protocol with fieldErrors", async () => {
    const adminToken = await createSessionToken({
      id: "admin-citation-validation-id",
      email: "admin-citation-validation@dance.local",
      name: "Admin Citation Validation",
      role: "ADMIN",
    });

    const request = buildFormRequest(
      "/api/admin/citations/link",
      {
        entityType: "lesson",
        entityRef: "rock-fundamentals",
        title: "Citation invalid URL",
        url: "javascript:alert(1)",
      },
      {
        cookie: `${SESSION_COOKIE_NAME}=${adminToken}`,
        accept: "application/json",
      },
    );

    const response = await citationLinkPost(request);
    assert.equal(response.status, 422);
    const body = (await response.json()) as {
      ok: boolean;
      formError: string;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.ok(body.fieldErrors.url?.[0]);
  });

  test("progress complete returns 422 with fieldErrors in JSON mode", async () => {
    const studentToken = await createSessionToken({
      id: "student-validation-id",
      email: "student-validation@dance.local",
      name: "Student Validation",
      role: "STUDENT",
    });

    const request = buildFormRequest(
      "/api/progress/lessons/complete",
      {
        courseSlug: "",
        lessonSlug: "",
        redirectTo: "/admin",
      },
      {
        cookie: `${SESSION_COOKIE_NAME}=${studentToken}`,
        accept: "application/json",
      },
    );

    const response = await progressCompletePost(request);
    assert.equal(response.status, 422);
    const body = (await response.json()) as {
      ok: boolean;
      formError: string;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.ok(body.fieldErrors.courseSlug?.[0]);
    assert.ok(body.fieldErrors.lessonSlug?.[0]);
    assert.ok(body.fieldErrors.redirectTo?.[0]);
  });

  test("progress step toggle returns 422 with fieldErrors in JSON mode", async () => {
    const studentToken = await createSessionToken({
      id: "student-validation-id-2",
      email: "student-validation-2@dance.local",
      name: "Student Validation 2",
      role: "STUDENT",
    });

    const request = buildFormRequest(
      "/api/progress/lessons/steps/toggle",
      {
        courseSlug: "invalid slug",
        lessonSlug: "",
        stepIndex: "-1",
        completed: "true",
        redirectTo: "/admin",
      },
      {
        cookie: `${SESSION_COOKIE_NAME}=${studentToken}`,
        accept: "application/json",
      },
    );

    const response = await progressStepTogglePost(request);
    assert.equal(response.status, 422);
    const body = (await response.json()) as {
      ok: boolean;
      formError: string;
      fieldErrors: Record<string, string[]>;
    };

    assert.equal(body.ok, false);
    assert.ok(body.fieldErrors.courseSlug?.[0]);
    assert.ok(body.fieldErrors.lessonSlug?.[0]);
    assert.ok(body.fieldErrors.stepIndex?.[0]);
  });
});
