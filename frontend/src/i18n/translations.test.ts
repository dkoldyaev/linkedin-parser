import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  STATUS_ASSESSMENT,
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_NOT_CONTACTED,
  STATUS_OFFER,
  STATUS_REJECTED,
} from '../constants/columns';
import { translations, type TranslationNode } from './translations';

function flattenTranslations(node: Record<string, TranslationNode>, prefix: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(node)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      out.set(fullKey, value);
    } else {
      for (const [childKey, childVal] of flattenTranslations(value, fullKey)) {
        out.set(childKey, childVal);
      }
    }
  }
  return out;
}

function collectSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(fullPath));
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.test.tsx') &&
      !fullPath.endsWith(path.join('i18n', 'translations.ts'))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractPlaceholders(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

function extractObjectParamNames(node: ts.Expression | undefined, sf: ts.SourceFile): string[] {
  if (!node || !ts.isObjectLiteralExpression(node)) return [];
  const names: string[] = [];
  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
      names.push(prop.name.getText(sf).replace(/^['"]|['"]$/g, ''));
    }
  }
  return names;
}

const KNOWN_DYNAMIC_KEYS: string[] = [
  // Base Kanban columns (`kanban.columns.${colId}`)
  `kanban.columns.${STATUS_NOT_CONTACTED}`,
  `kanban.columns.${STATUS_CONTACTED}`,
  `kanban.columns.${STATUS_INTERVIEW}`,
  `kanban.columns.${STATUS_ASSESSMENT}`,
  `kanban.columns.${STATUS_OFFER}`,
  `kanban.columns.${STATUS_REJECTED}`,
  // Workplace (`workplace.${baseKey}` and `workplace.full_${baseKey}`)
  'workplace.remote',
  'workplace.hybrid',
  'workplace.on-site',
  'workplace.full_remote',
  'workplace.full_hybrid',
  'workplace.full_onsite',
  // Salary (`salary.per_${formatKey}`)
  'salary.per_month',
  'salary.per_year',
  'salary.per_hour',
  'salary.per_week',
  'salary.per_day',
  // Compatibility seniority (`vacancyModal.compat_seniority_status.${status}`)
  'vacancyModal.compat_seniority_status.matched',
  'vacancyModal.compat_seniority_status.partially_matched',
  'vacancyModal.compat_seniority_status.mismatched',
  'vacancyModal.compat_seniority_status.unclear',
  // Compatibility severity (`vacancyModal.compat_severity.${normalized}`)
  'vacancyModal.compat_severity.critical',
  'vacancyModal.compat_severity.high',
  'vacancyModal.compat_severity.medium',
  'vacancyModal.compat_severity.low',
  // Mercure error codes (`mercure.errors.${payload.error_code}`)
  'mercure.errors.ERR_SCRAPE_FAILED',
  'mercure.errors.ERR_AI_ANALYSIS_FAILED',
  'mercure.errors.ERR_VACANCY_NOT_FOUND',
  'mercure.errors.ERR_NETWORK',
  'mercure.errors.ERR_UNKNOWN',
  // NavDrawer links (`pages.nav.${key}`)
  'pages.nav.home',
  'pages.nav.cv',
  'pages.nav.stat',
  'pages.nav.apikeys',
  'pages.nav.howtouse',
  'pages.nav.about',
  // AboutFeatureCard (`pages.about.f_${key}_{title|headline|desc}`)
  'pages.about.f_ai_title',
  'pages.about.f_ai_headline',
  'pages.about.f_ai_desc',
  'pages.about.f_kanban_title',
  'pages.about.f_kanban_headline',
  'pages.about.f_kanban_desc',
  'pages.about.f_streak_title',
  'pages.about.f_streak_headline',
  'pages.about.f_streak_desc',
  'pages.about.f_extension_title',
  'pages.about.f_extension_headline',
  'pages.about.f_extension_desc',
];

function isTCallExpression(node: ts.Node): node is ts.CallExpression {
  if (!ts.isCallExpression(node) || node.arguments.length === 0) return false;
  const expr = node.expression;
  return (
    (ts.isIdentifier(expr) && expr.text === 't') ||
    (ts.isPropertyAccessExpression(expr) && expr.name.text === 't')
  );
}

function extractTCallKeys(arg0: ts.Expression): string[] {
  if (ts.isStringLiteral(arg0) || ts.isNoSubstitutionTemplateLiteral(arg0)) {
    return [arg0.text];
  }
  if (!ts.isConditionalExpression(arg0)) {
    return [];
  }
  const keys: string[] = [];
  if (ts.isStringLiteral(arg0.whenTrue) || ts.isNoSubstitutionTemplateLiteral(arg0.whenTrue)) {
    keys.push(arg0.whenTrue.text);
  }
  if (ts.isStringLiteral(arg0.whenFalse) || ts.isNoSubstitutionTemplateLiteral(arg0.whenFalse)) {
    keys.push(arg0.whenFalse.text);
  }
  return keys;
}

function collectMissingParamsForKey(
  key: string,
  ruVal: string,
  usages: Array<{ loc: string; params: string[] }>
): string[] {
  const missing: string[] = [];
  for (const usage of usages) {
    const missingInCall = usage.params.filter((param) => !ruVal.includes(`{${param}}`));
    for (const param of missingInCall) {
      missing.push(`${key} missing {${param}} at ${usage.loc}`);
    }
  }
  return missing;
}

describe('i18n translations integrity', () => {
  const ruMap = flattenTranslations(translations.ru, '');
  const enMap = flattenTranslations(translations.en, '');
  const namespaces = new Set([...Object.keys(translations.ru), ...Object.keys(translations.en)]);

  it('maintains 100% key symmetry, non-empty values, and matching placeholders between ru and en', () => {
    const ruKeys = [...ruMap.keys()].sort();
    const enKeys = [...enMap.keys()].sort();
    expect(ruKeys).toEqual(enKeys);

    for (const key of ruKeys) {
      const ruVal = ruMap.get(key) ?? '';
      const enVal = enMap.get(key) ?? '';
      expect(ruVal.trim().length, `Empty RU translation for "${key}"`).toBeGreaterThan(0);
      expect(enVal.trim().length, `Empty EN translation for "${key}"`).toBeGreaterThan(0);
      expect(
        extractPlaceholders(ruVal),
        `Placeholder mismatch between RU and EN for "${key}"`
      ).toEqual(extractPlaceholders(enVal));
    }
  });

  it('has zero missing translation keys and zero orphaned constants across frontend/src', () => {
    const srcDir = path.resolve(__dirname, '..');
    const files = collectSourceFiles(srcDir);
    const usedKeys = new Map<string, Array<{ loc: string; params: string[] }>>();

    const recordUsage = (key: string, loc: string, params: string[]) => {
      if (key === 'kanban.columns.') return;
      const list = usedKeys.get(key) ?? [];
      list.push({ loc, params });
      usedKeys.set(key, list);
    };

    for (const key of KNOWN_DYNAMIC_KEYS) {
      recordUsage(key, 'dynamic-enum', []);
    }

    for (const file of files) {
      const relFile = path.relative(srcDir, file);
      const code = fs.readFileSync(file, 'utf8');
      const sf = ts.createSourceFile(
        file,
        code,
        ts.ScriptTarget.Latest,
        true,
        file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
      );

      const visit = (node: ts.Node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
          const text = node.text;
          const dotIndex = text.indexOf('.');
          if (dotIndex > 0 && namespaces.has(text.slice(0, dotIndex))) {
            const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
            recordUsage(text, `${relFile}:${line + 1}`, []);
          }
        }

        if (isTCallExpression(node)) {
          const params = extractObjectParamNames(node.arguments[1], sf);
          const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
          const loc = `${relFile}:${line + 1}`;
          for (const key of extractTCallKeys(node.arguments[0])) {
            recordUsage(key, loc, params);
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sf);
    }

    const missingKeys: string[] = [];
    const missingParams: string[] = [];

    for (const [key, usages] of [...usedKeys.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (!ruMap.has(key) || !enMap.has(key)) {
        missingKeys.push(`${key} (${usages.map((u) => u.loc).join(', ')})`);
        continue;
      }
      const ruVal = ruMap.get(key) ?? '';
      missingParams.push(...collectMissingParamsForKey(key, ruVal, usages));
    }

    const orphanedKeys = [...ruMap.keys()]
      .filter((key) => !usedKeys.has(key))
      .sort();

    expect(missingKeys).toEqual([]);
    expect(missingParams).toEqual([]);
    expect(orphanedKeys).toEqual([]);
  });
});
