import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const [styles, moves, courses] = await Promise.all([
    db.style.findMany({
      where: {
        isArchived: false,
        publishedStatus: "published",
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    db.move.findMany({
      where: {
        isArchived: false,
        publishedStatus: "published",
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
    db.course.findMany({
      where: {
        publishedStatus: "published",
        courseLessons: {
          some: {
            lesson: {
              publishedStatus: "published",
            },
          },
        },
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/styles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/moves`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/maps`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const styleEntries: MetadataRoute.Sitemap = styles.map((style) => ({
    url: `${baseUrl}/styles/${style.slug}`,
    lastModified: style.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const moveEntries: MetadataRoute.Sitemap = moves.map((move) => ({
    url: `${baseUrl}/moves/${move.slug}`,
    lastModified: move.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  const courseEntries: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${baseUrl}/learn/${course.slug}`,
    lastModified: course.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...styleEntries, ...moveEntries, ...courseEntries];
}
