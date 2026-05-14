import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function getValue(dictionary: Record<string, unknown>, key: string) {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
}

describe('client portal copy separation', () => {
  const dictionary = yaml.load(readProjectFile('public/locales/es.yaml')) as Record<
    string,
    unknown
  >;

  it('keeps client portal pages on client-facing namespaces instead of internal service copy keys', () => {
    const pages = [
      readProjectFile('src/features/portal/ClientServicesPage.tsx'),
      readProjectFile('src/features/portal/ClientReportsPage.tsx')
    ].join('\n');

    expect(pages).not.toContain("t('services.");
    expect(pages).not.toContain('t("services.');
    expect(pages).not.toContain("t('portal.missing.access')");
    expect(pages).not.toContain('buildTechnicalReport(serviceOrder, t)');
  });

  it('defines client-specific labels used by portal services and reports', () => {
    expect(getValue(dictionary, 'client.portal.missing.access')).toBe(
      'No encontramos una administración asociada a tu usuario.'
    );
    expect(getValue(dictionary, 'client.portal.services.status.in.progress')).toBe('En atención');
    expect(getValue(dictionary, 'client.portal.services.type.lavado_tanque')).toBe(
      'Lavado de tanque'
    );
    expect(getValue(dictionary, 'client.portal.services.issues.label')).toBe('Novedades');
    expect(getValue(dictionary, 'client.portal.reports.technicalReport.status')).toBe(
      'Estado visible'
    );
    expect(getValue(dictionary, 'client.portal.reports.technicalReport.noIssues')).toBe(
      'sin novedades visibles por ahora'
    );
  });
});
