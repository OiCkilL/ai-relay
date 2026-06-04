import { describe, expect, it } from 'vitest';
import {
  buildImportedProviderConfig,
  deriveModelPrefixesFromModels,
  normalizeProviderId,
  deriveProviderIdFromBaseUrl,
  parseProviderImportLink,
  resolveImportedProviderId,
} from '@/app/admin/provider-import';

function buildImportLink(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
  return `cherrystudio://providers/api-keys?v=1&data=${encodeURIComponent(encoded)}`;
}

describe('NewAPI provider import links', () => {
  it('parses Cherry Studio provider api-key links without exposing the key in errors', () => {
    const link = buildImportLink({
      id: 'new-api',
      baseUrl: 'https://relay.example.com/v1/',
      apiKey: 'sk-secret-value',
    });

    expect(parseProviderImportLink(link)).toEqual({
      id: 'new-api',
      baseUrl: 'https://relay.example.com/v1',
      apiKey: 'sk-secret-value',
    });
  });

  it('normalizes imported provider IDs for the existing backend validator', () => {
    expect(normalizeProviderId('new-api')).toBe('new_api');
    expect(normalizeProviderId('  New API!!  ')).toBe('new_api');
    expect(normalizeProviderId('')).toBe('newapi');
  });

  it('derives provider ID from baseUrl domain', () => {
    expect(deriveProviderIdFromBaseUrl('https://relay.example.com/v1')).toBe('example_com');
    expect(deriveProviderIdFromBaseUrl('https://elysiver.h-e.top')).toBe('elysiver_h_e_top');
    expect(deriveProviderIdFromBaseUrl('https://api.my-domain.org')).toBe('my_domain_org');
    expect(deriveProviderIdFromBaseUrl('invalid-url')).toBe('newapi');
  });

  it('does not overwrite built-in providers with imported links', () => {
    expect(resolveImportedProviderId('openai', [{ id: 'openai', isCustom: false }])).toBe('openai_import');
    expect(resolveImportedProviderId('openai', [
      { id: 'openai', isCustom: false },
      { id: 'openai_import', isCustom: true },
    ])).toBe('openai_import_2');
    expect(resolveImportedProviderId('new-api', [{ id: 'new_api', isCustom: true }])).toBe('new_api');
  });

  it('uses discovered model IDs as exact routing prefixes', () => {
    expect(deriveModelPrefixesFromModels([
      { id: 'gpt-4o' },
      { id: 'GPT-4O' },
      { id: 'claude-3-5-sonnet' },
      { id: '' },
    ])).toEqual(['gpt-4o', 'claude-3-5-sonnet']);
  });

  it('builds an OpenAI-compatible provider config from an import link payload', () => {
    const payload = parseProviderImportLink(buildImportLink({
      id: 'new-api',
      baseUrl: 'https://relay.example.com/v1',
      apiKey: 'sk-secret-value',
    }));

    expect(buildImportedProviderConfig({
      payload,
      providers: [],
      models: [{ id: 'gpt-4o-mini', displayName: 'gpt-4o-mini', contextWindow: 128000 }],
    })).toMatchObject({
      name: 'example_com',
      displayName: 'Example Com',
      baseUrl: 'https://relay.example.com/v1',
      headerFormat: 'openai',
      envKeyField: 'EXAMPLE_COM_KEYS',
      modelPrefixes: ['gpt-4o-mini'],
    });
  });

  it('parses the user provided specific Cherry Studio URL', () => {
    // This is a mock URL containing a safe, simulated API key to ensure credentials are never leaked
    const link = 'cherrystudio://providers/api-keys?v=1&data=eyJpZCI6Im5ldy1hcGkiLCJiYXNlVXJsIjoiaHR0cHM6Ly9lbHlzaXZlci5oLWUudG9wIiwiYXBpS2V5Ijoic2stbW9jay1lbHlzaXZlci1rZXkteHh4eHh4eHh4In0%3D';
    expect(parseProviderImportLink(link)).toEqual({
      id: 'new-api',
      baseUrl: 'https://elysiver.h-e.top',
      apiKey: 'sk-mock-elysiver-key-xxxxxxxxx',
    });
  });
});
