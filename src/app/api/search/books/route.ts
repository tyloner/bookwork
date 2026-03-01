import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") === "author" ? "author" : "book";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Always query local DB
  let localResults: object[] = [];
  try {
    if (type === "book") {
      const books = await prisma.book.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, author: true, coverUrl: true },
        take: 5,
      });
      localResults = books.map((b) => ({
        olKey: `local:${b.id}`,
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        year: null,
        localId: b.id,
      }));
    }
  } catch {
    // DB error — proceed with Open Library only
  }

  // Fetch from Open Library with 5s timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    if (type === "book") {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=key,title,author_name,cover_i,first_publish_year`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const olResults = (data.docs ?? []).map((doc: {
          key?: string;
          title?: string;
          author_name?: string[];
          cover_i?: number;
          first_publish_year?: number;
        }) => ({
          olKey: doc.key ?? "",
          title: doc.title ?? "",
          author: doc.author_name?.[0] ?? "Unknown",
          coverUrl: doc.cover_i
            ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
            : null,
          year: doc.first_publish_year ?? null,
        }));

        // Prepend local results (already-tracked books first)
        const merged = [
          ...localResults,
          ...olResults.filter(
            (ol: { title: string; author: string }) =>
              !localResults.some(
                (lr: { title?: string; author?: string }) =>
                  (lr as { title: string }).title.toLowerCase() === ol.title.toLowerCase()
              )
          ),
        ].slice(0, 12);

        return NextResponse.json({ results: merged });
      }
    } else {
      const url = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(q)}&limit=8`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const results = (data.docs ?? []).map((doc: {
          key?: string;
          name?: string;
          work_count?: number;
        }) => ({
          olKey: doc.key ?? "",
          name: doc.name ?? "",
          workCount: doc.work_count ?? 0,
        }));
        return NextResponse.json({ results });
      }
    }
  } catch {
    clearTimeout(timeout);
    // Open Library unavailable — fall through to local-only
  }

  return NextResponse.json({ results: localResults });
}
