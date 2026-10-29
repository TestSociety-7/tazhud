const rules = new Intl.PluralRules("ar");

type Forms = { zero?: string; one: string; two: string; few: string; many: string; other?: string };

/** Picks the right Arabic plural form. `#` in a form is replaced with the number. */
export function plural(n: number, forms: Forms) {
  const key = rules.select(n) as keyof Forms;
  const form = forms[key] ?? forms.other ?? forms.many;
  return form.replace("#", String(n));
}

export const piecesLabel = (n: number) =>
  plural(n, { zero: "لا توجد قطع", one: "قطعة واحدة", two: "قطعتان", few: "# قطع", many: "# قطعة", other: "# قطعة" });

export const itemsLabel = (n: number) =>
  plural(n, { zero: "لا توجد منتجات", one: "منتج واحد", two: "منتجان", few: "# منتجات", many: "# منتجًا", other: "# منتج" });

export const ordersLabel = (n: number) =>
  plural(n, { zero: "لا توجد طلبات", one: "طلب واحد", two: "طلبان", few: "# طلبات", many: "# طلبًا", other: "# طلب" });

export const daysLabel = (n: number) =>
  plural(n, { zero: "0 أيام", one: "يوم واحد", two: "يومين", few: "# أيام", many: "# يومًا", other: "# يوم" });

export const dateFormat = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) => {
  try {
    return new Intl.DateTimeFormat("ar-u-nu-latn", opts).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
};
