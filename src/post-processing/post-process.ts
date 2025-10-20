export function cleanTeamName(name: string): string | null {
  // 1. Trim leading/trailing whitespace
  let cleanedName = name.trim();

  // 2. Normalize special characters like unicode apostrophes
  cleanedName = cleanedName.replace(/\u2019/g, "'");

  // 3. Remove junk patterns and extraneous trailing punctuation
  // This regex handles trailing commas, periods, etc., and odd artifacts.
  cleanedName = cleanedName.replace(/[,.!)"]+$/g, '').trim();

  // This handles specific junk like "'s" at the end of a name
  cleanedName = cleanedName.replace(/'s$/g, '').trim();

  // 4. Filter out names that are just noise/junk after initial cleaning
  if (cleanedName.length <= 2 && !/^[a-zA-Z0-9]{2}$/.test(cleanedName)) {
    // Allows 2-letter acronyms like "AI" but filters out junk like "s" or ")."
    return null;
  }

  // 5. Strip common organizational suffixes
  const suffixRegex = /\s(team|group|org|organization|department|division)$/i;
  cleanedName = cleanedName.replace(suffixRegex, '').trim();

  // 5b. Remove trailing acronyms in parentheses (e.g., "(TDG)")
  const acronymRegex = /\s\([A-Z&]+\)$/i;
  cleanedName = cleanedName.replace(acronymRegex, '').trim();

  // 6. Standardize to Title Case for consistent display
  cleanedName = cleanedName.replace(/\w\S*/g, (txt) => {
    // Don't modify acronyms (e.g., "SOC", "GPU")
    if (txt.toUpperCase() === txt) {
      return txt;
    }
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });

  return cleanedName;
}
