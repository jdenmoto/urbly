import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { describe, expect, it } from 'vitest';

function getValue(dictionary: Record<string, unknown>, key: string) {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
}

describe('i18n dictionary', () => {
  const dictionary = yaml.load(
    readFileSync(resolve(process.cwd(), 'public/locales/es.yaml'), 'utf8')
  ) as Record<string, unknown>;

  it('parses es.yaml and includes migrated service/portal copy keys', () => {
    expect(getValue(dictionary, 'services.actions.openDetail')).toBe('Abrir detalle');
    expect(getValue(dictionary, 'services.dailyProgress.modal.title')).toBe(
      'Registrar avance diario'
    );
    expect(getValue(dictionary, 'client.portal.services.title')).toBe('Servicios del cliente');
    expect(getValue(dictionary, 'client.portal.reports.title')).toBe('Reportes del cliente');
  });
});
