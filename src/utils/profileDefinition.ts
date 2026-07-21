/**
 * Client-side sanity checks for a datavibes profile definition (YAML text).
 *
 * The backend is the authority — it validates through datavibes' own loader and
 * answers 400 — but catching the most common mistake in the form saves a
 * round-trip and, more importantly, stops the operator creating the profile that
 * once bricked the whole Data Generator page: a metadata-only `dataset.yaml`
 * with no `schema`, which made every later `sdk.list()` raise.
 *
 * Intentionally a light structural scan, not a YAML parse: the admin app carries
 * no YAML dependency, and a false "looks fine" is harmless (the backend still
 * rejects it) whereas a heavyweight parser here would be over-engineering.
 */

/** Top-level blocks datavibes requires to be present and non-empty. */
export const REQUIRED_DEFINITION_BLOCKS = ['schema', 'sources'] as const;

/**
 * True when `definition` declares `block:` with at least one list entry.
 *
 * Handles both the inline form (`schema: [{...}]`) and the usual indented list.
 * A nested key of the same name is ignored: only a top-level (column 0) key counts.
 */
export function hasNonEmptyBlock(definition: string, block: string): boolean {
  const lines = definition.split('\n');
  const startIndex = lines.findIndex((line) => new RegExp(`^${block}\\s*:`).test(line));
  if (startIndex === -1) return false;

  const inlineValue = lines[startIndex].slice(lines[startIndex].indexOf(':') + 1).trim();
  if (inlineValue) return inlineValue !== '[]';

  for (let cursor = startIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (!line.trim()) continue;
    // A new top-level key ends this block.
    if (/^\S/.test(line)) return false;
    if (/^\s*-\s*\S/.test(line)) return true;
  }
  return false;
}

/**
 * Return the required blocks that `definition` is missing (empty = looks usable).
 */
export function missingDefinitionBlocks(definition: string): string[] {
  return REQUIRED_DEFINITION_BLOCKS.filter((block) => !hasNonEmptyBlock(definition, block));
}
