const WIKI_API = "https://en.wikipedia.org/w/api.php";

/** A section entry from the Wikipedia table of contents */
export interface WikipediaSection {
  index: string;
  line: string;
}

/** A section after the LLM has assigned it a tip category */
export interface ClassifiedSection {
  index: string;
  line: string;
  category: "transportation" | "safety" | "whenToVisit";
}

/** Wikipedia content grouped by the three tip categories */
export interface GroupedContent {
  transportation: string[];
  safety: string[];
  whenToVisit: string[];
}

/**
 * Strips HTML tags and replaces HTML entities with their corresponding
 * characters. Additionally, trims the string and replaces any
 * sequence of two or more whitespace characters with a single space.
 * @param html The HTML string to strip
 * @returns The stripped string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Searches Wikipedia for the given query and returns the pageid of the first
 * result, or null if no results are found or the request fails.
 */
export async function searchWikipediaPageId(
  query: string,
): Promise<number | null> {
  const url = `${WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const results = data?.query?.search as
      | Array<{ pageid: number }>
      | undefined;
    if (!results || results.length === 0) return null;
    return results[0]?.pageid ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetches the table of contents sections for a Wikipedia page.
 * Returns an empty array if the page has no parseable TOC or on failure.
 */
export async function fetchWikipediaSections(
  pageId: number,
): Promise<WikipediaSection[]> {
  const url = `${WIKI_API}?action=parse&prop=tocdata&format=json&pageid=${pageId}&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    const sections = data?.parse?.tocdata?.sections as
      | Array<{ index: string; line: string }>
      | undefined;
    if (!sections) return [];
    return sections.map((s) => ({ index: s.index, line: s.line }));
  } catch {
    return [];
  }
}

/**
 * Fetches the HTML content of a single Wikipedia section and strips HTML tags.
 * Returns an empty string on failure so the caller can filter it out gracefully.
 */
export async function fetchWikipediaSectionContent(
  pageId: number,
  sectionIndex: string,
): Promise<string> {
  const url = `${WIKI_API}?action=parse&prop=text&format=json&pageid=${pageId}&section=${sectionIndex}&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const data = await response.json();
    const html =
      (data?.parse?.text as Record<string, string> | undefined)?.["*"] ?? "";
    return stripHtml(html);
  } catch {
    return "";
  }
}

/**
 * Fetches the full plain-text extract of a Wikipedia article.
 * Used as a category fallback when section content buckets are empty.
 * Returns null on failure.
 */
export async function fetchWikipediaFullExtract(
  pageId: number,
): Promise<string | null> {
  const url = `${WIKI_API}?action=query&prop=extracts&explaintext=true&format=json&pageids=${pageId}&origin=*`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    const pages = data?.query?.pages as
      | Record<string, { extract?: string }>
      | undefined;
    return pages?.[String(pageId)]?.extract ?? null;
  } catch {
    return null;
  }
}
