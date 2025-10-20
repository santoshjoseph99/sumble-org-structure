// Normalize a name for similarity comparison
function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .trim();
}

// Check if two names are similar enough to be considered duplicates
export function areNamesSimilar(name1: string, name2: string): boolean {
  const norm1 = normalizeForComparison(name1);
  const norm2 = normalizeForComparison(name2);

  // Exact match after normalization
  if (norm1 === norm2) {
    return true;
  }

  // One is a substring of the other (handles "3D Visual Merchandising" vs "3D Visual Merchandising Design")
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    // But ensure they're reasonably similar in length (avoid false positives)
    const minLength = Math.min(norm1.length, norm2.length);
    const maxLength = Math.max(norm1.length, norm2.length);
    // If the shorter one is at least 70% of the longer one, consider them similar
    if (minLength / maxLength >= 0.7) {
      return true;
    }
  }

  return false;
}

// Choose the canonical name from a group of similar names
// Prefers longer, more descriptive names
export function chooseCanonicalName(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];

  // Sort by length (descending) and then alphabetically for consistency
  const sorted = [...names].sort((a, b) => {
    const lengthDiff = b.length - a.length;
    if (lengthDiff !== 0) return lengthDiff;
    return a.localeCompare(b);
  });

  return sorted[0];
}

export function cleanTeamName(name: string): string | null {
  // 1. Trim leading/trailing whitespace
  let cleanedName = name.trim();

  // 2. Remove/normalize problematic Unicode characters
  // Replace common Unicode apostrophes with ASCII equivalents (but remove quotes entirely)
  cleanedName = cleanedName.replace(/[\u2018\u2019]/g, "'"); // Smart single quotes
  cleanedName = cleanedName.replace(/[\u201C\u201D]/g, ''); // Smart double quotes - REMOVE them
  cleanedName = cleanedName.replace(/\u2013/g, '-'); // En dash
  cleanedName = cleanedName.replace(/\u2014/g, '-'); // Em dash
  cleanedName = cleanedName.replace(/\u2026/g, '...'); // Ellipsis

  // Also remove regular quotes that might be wrapping names
  cleanedName = cleanedName.replace(/^["']|["']$/g, ''); // Remove leading/trailing quotes

  // Remove Apple-specific private use characters and other problematic Unicode
  cleanedName = cleanedName.replace(/\uf8ff/g, ''); // Apple logo character
  // eslint-disable-next-line no-control-regex
  cleanedName = cleanedName.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Control characters
  cleanedName = cleanedName.replace(/[\uE000-\uF8FF]/g, ''); // Private use area
  cleanedName = cleanedName.replace(/[\uFFF0-\uFFFF]/g, ''); // Specials

  // Normalize whitespace after removing characters
  cleanedName = cleanedName.replace(/\s+/g, ' ').trim();

  // 3. Remove trailing "'s" that appears after acronyms (e.g., "(SEG)'s")
  cleanedName = cleanedName.replace(/'s$/g, '').trim();

  // 4. Remove trailing mixed punctuation like "!)" or ",." etc, but preserve standalone "))"
  cleanedName = cleanedName.replace(/[,.!]+\)*$/g, '').trim();

  // 5. Filter out names that are just noise/junk after initial cleaning
  if (cleanedName.length <= 2 && !/^[a-zA-Z0-9]{2}$/.test(cleanedName)) {
    // Allows 2-letter acronyms like "AI" but filters out junk like "s" or ")."
    return null;
  }

  // 6. Remove trailing acronyms in parentheses (e.g., "(TDG)") before suffix removal
  const acronymRegex = /\s\([A-Z&]+\)$/;
  cleanedName = cleanedName.replace(acronymRegex, '').trim();

  // 6b. Remove trailing closing parens that are junk (not part of acronym)
  cleanedName = cleanedName.replace(/\)+$/g, '').trim();

  // 7. Strip common organizational suffixes
  const suffixRegex = /\s(team|group|org|organization|department|division)$/i;
  cleanedName = cleanedName.replace(suffixRegex, '').trim();

  // 8. Remove trailing "'s" after suffix removal (e.g., "Apple's Team" -> "Apple's" -> "Apple")
  cleanedName = cleanedName.replace(/'s$/g, '').trim();

  // 9. Remove any remaining trailing punctuation
  cleanedName = cleanedName.replace(/[,.!)"]+$/g, '').trim();

  // 10. Check again if we have valid content after all cleaning
  if (cleanedName.length === 0) {
    return null;
  }

  // 11. Standardize to Title Case for consistent display
  cleanedName = cleanedName.replace(/\w\S*/g, (txt) => {
    // Don't modify acronyms (e.g., "SOC", "GPU")
    if (txt.toUpperCase() === txt) {
      return txt;
    }
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });

  return cleanedName;
}
