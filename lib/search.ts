import type { Category, Product } from "./types";

/** Simple token search across name, tagline, description, colours and category. */
export function searchProducts(products: Product[], categories: Category[], query: string) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!tokens.length) return products;
  return products
    .map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name ?? "";
      const hay = [p.name, p.tagline, p.description, cat, p.colors.map((c) => c.name).join(" "), p.details.join(" ")]
        .join(" ")
        .toLowerCase();
      const name = p.name.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (!hay.includes(t)) return { p, score: -1 };
        score += name.includes(t) ? 3 : 1;
      }
      return { p, score };
    })
    .filter((r) => r.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}
