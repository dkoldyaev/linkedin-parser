import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const TOKENS_CSS_PATH = path.join(SRC_DIR, 'tokens', 'tokens.css');

function collectFiles(dir, predicate) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, predicate));
    } else if (predicate(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

const tokensCssContent = fs.readFileSync(TOKENS_CSS_PATH, 'utf8');
const definedTokens = new Set();
for (const match of tokensCssContent.matchAll(/(--ui-[a-z0-9-]+)\s*:/g)) {
  definedTokens.add(match[1]);
}

const errors = [];

// 1. Validate all CSS files outside tokens.css
const cssFiles = collectFiles(
  SRC_DIR,
  (file) => file.endsWith('.css') && path.resolve(file) !== path.resolve(TOKENS_CSS_PATH)
);

for (const file of cssFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  lines.forEach((rawLine, index) => {
    const lineNum = index + 1;
    const line = rawLine.replace(/\/\*.*?\*\//g, '');

    if (line.includes('!important')) {
      errors.push(`${relPath}:${lineNum} — Forbidden "!important" found.`);
    }

    // Check raw hex or rgb/rgba/hsl colors
    if (/(#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\()/.test(line)) {
      errors.push(
        `${relPath}:${lineNum} — Raw color literal found ("${line.trim()}"). Use var(--ui-*) tokens.`
      );
    }

    // Check raw font-size outside var(--ui-font-size-*)
    const fontSizeMatch = line.match(/font-size\s*:\s*([^;]+);/);
    if (fontSizeMatch) {
      const value = fontSizeMatch[1].trim();
      if (!/^var\(--ui-font-size-[a-z0-9-]+\)$/.test(value) && value !== 'inherit') {
        errors.push(
          `${relPath}:${lineNum} — Non-tokenized font-size "${value}". Use var(--ui-font-size-*).`
        );
      }
    }

    // Check that all referenced var(--...) exist in tokens.css (or local --bp-* runtime vars)
    for (const varMatch of line.matchAll(/var\(\s*(--[a-zA-Z0-9-_]+)\s*(?:,[^)]+)?\)/g)) {
      const varName = varMatch[1];
      if (varName.startsWith('--bp-') || varName.startsWith('--radix-')) {
        continue;
      }
      if (!definedTokens.has(varName)) {
        errors.push(
          `${relPath}:${lineNum} — Unknown or legacy CSS variable "${varName}" (not defined in tokens.css).`
        );
      }
    }
  });
}

// 2. Validate TSX files for raw numeric icon sizes or legacy story CSS imports
const tsxFiles = collectFiles(
  SRC_DIR,
  (file) => file.endsWith('.tsx') || file.endsWith('.ts')
);

for (const file of tsxFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  if (relPath.endsWith('atoms/Icon/Icon.tsx')) {
    continue;
  }
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    if (/\bsize=\{\s*\d+\s*\}/.test(line)) {
      errors.push(
        `${relPath}:${lineNum} — Hardcoded numeric size={...} prop found ("${line.trim()}"). Use <Icon size="2xs|xs|sm|md|lg|xl" />.`
      );
    }
  });
}

if (errors.length > 0) {
  console.error(`\n[check-tokens] Found ${errors.length} token/style violation(s):\n`);
  for (const err of errors) {
    console.error(`  ✖ ${err}`);
  }
  process.exit(1);
} else {
  console.log(
    `[check-tokens] ✔ All ${cssFiles.length} CSS files and ${tsxFiles.length} TS/TSX files strictly conform to --ui-* tokens.`
  );
}
