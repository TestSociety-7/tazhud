import type { Category, Product } from "./types";

/** Folds Arabic letter variants and diacritics so "عباية" matches "عبايه". */
export function normalizeSearch(input: string) {
  return input
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}

/** Simple token search across name, tagline, description, colours and category. */
export function searchProducts(products: Product[], categories: Category[], query: string) {
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return products;
  return products
    .map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name ?? "";
      const hay = [p.name, p.tagline, p.description, cat, p.colors.map((c) => c.name).join(" "), p.details.join(" ")]
        .join(" ");
      const haystack = normalizeSearch(hay);
      const name = normalizeSearch(p.name);
      let score = 0;
      for (const t of tokens) {
        if (!haystack.includes(t)) return { p, score: -1 };
        score += name.includes(t) ? 3 : 1;
      }
      return { p, score };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}
