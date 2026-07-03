/**
 * Transformă un text (nume) într-un slug SEO: minuscule, fără diacritice,
 * cuvinte separate prin „-”. Ex: „Ștefan Muntean” -> „stefan-muntean”.
 */
export function slugify(input: string): string {
  const s = (input || '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '') // elimină diacriticele
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
    .replace(/-+$/g, '');
  return s || 'utilizator';
}

/**
 * Garantează unicitatea unui slug: dacă `exists(slug)` e adevărat, adaugă
 * `-2`, `-3`… până găsește unul liber.
 */
export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  let i = 1;
  while (await exists(candidate)) {
    i += 1;
    candidate = `${root}-${i}`;
  }
  return candidate;
}
