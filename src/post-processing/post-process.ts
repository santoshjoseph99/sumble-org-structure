export function cleanTeamName(name: string): string | null {
  // 1. Trim leading/trailing whitespace
  let cleanedName = name.trim();

  // 2. Normalize special characters like unicode apostrophes
  cleanedName = cleanedName.replace(/\u2019/g, "'");

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
