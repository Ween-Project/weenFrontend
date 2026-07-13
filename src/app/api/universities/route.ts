import { NextRequest, NextResponse } from "next/server";

type UniversityRecord = {
  name: string;
  country: string;
  domains?: string[];
  web_pages?: string[];
};

const DIRECTORY_URL =
  "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().toLocaleLowerCase("en") || "";
  if (query.length < 2) return NextResponse.json({ universities: [] });

  try {
    const response = await fetch(DIRECTORY_URL, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`University directory returned ${response.status}`);

    const directory = (await response.json()) as UniversityRecord[];
    const seen = new Set<string>();
    const matches = directory
      .filter((item) => item.name && item.country)
      .filter((item) => {
        const name = item.name.toLocaleLowerCase("en");
        const country = item.country.toLocaleLowerCase("en");
        return name.includes(query) || country.includes(query);
      })
      .sort((left, right) => {
        const leftStarts = left.name.toLocaleLowerCase("en").startsWith(query);
        const rightStarts = right.name.toLocaleLowerCase("en").startsWith(query);
        return Number(rightStarts) - Number(leftStarts) || left.name.localeCompare(right.name);
      })
      .filter((item) => {
        const key = `${item.name}|${item.country}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 100)
      .map((item) => ({
        name: item.name,
        country: item.country,
        domain: item.domains?.[0],
        website: item.web_pages?.[0],
      }));

    return NextResponse.json(
      { universities: matches, source: "Hipo university-domains-list" },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json(
      { universities: [], message: "The worldwide university directory is temporarily unavailable." },
      { status: 503 },
    );
  }
}
