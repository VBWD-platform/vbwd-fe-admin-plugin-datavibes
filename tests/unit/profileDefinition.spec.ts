import { describe, it, expect } from 'vitest';
import {
  hasNonEmptyBlock,
  missingDefinitionBlocks,
} from '../../src/utils/profileDefinition';

const METADATA_ONLY = 'metadata:\n  slug: test\n  title: test\n  category: test\n';

const LOADABLE = [
  'metadata:',
  '  slug: air',
  '  title: Air',
  '  category: environment',
  'schema:',
  '  - name: value',
  '    dtype: float',
  'sources:',
  '  - type: static',
  '    rows: []',
  '',
].join('\n');

describe('profileDefinition — client-side guard against an unloadable profile', () => {
  it('reports the metadata-only body as missing schema AND sources', () => {
    expect(missingDefinitionBlocks(METADATA_ONLY)).toEqual(['schema', 'sources']);
  });

  it('accepts a definition with non-empty schema and sources', () => {
    expect(missingDefinitionBlocks(LOADABLE)).toEqual([]);
  });

  it('treats a declared but empty block as missing', () => {
    expect(hasNonEmptyBlock('schema:\nsources:\n  - type: static\n', 'schema')).toBe(false);
    expect(hasNonEmptyBlock('schema: []\n', 'schema')).toBe(false);
  });

  it('accepts an inline list', () => {
    expect(hasNonEmptyBlock('schema: [{name: value}]\n', 'schema')).toBe(true);
  });

  it('ignores a nested key of the same name', () => {
    expect(hasNonEmptyBlock('metadata:\n  schema:\n    - name: x\n', 'schema')).toBe(false);
  });
});
