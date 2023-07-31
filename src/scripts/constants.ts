const prepackaged_books = ["ZH", "GH", "JH", "HG"] as const;
const public_references = ["CH", "HZ", "ZG", "ZGE", "ZHJ", "ZHSP", "ZHG", "ZHH", "ZHR", "HS", "PC"] as const;
const known_references = [...public_references, "ARF", "ARFR"] as const;

export type BookReference = (typeof prepackaged_books)[number] | (typeof known_references)[number];
const all_references: BookReference[] = [...prepackaged_books, ...known_references];

export function includes<T>(array: readonly T[], item: any): item is T {
    return array.includes(item);
}

export { prepackaged_books, public_references, known_references, all_references };
