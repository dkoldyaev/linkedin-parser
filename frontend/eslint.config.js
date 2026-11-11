import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';

const allowTargets = (types) =>
  types.map((type) => ({ to: { element: { type } } }));

export default [
  {
    files: ['src/ui-kit/**/*.{ts,tsx}'],
    ignores: [
      'src/ui-kit/**/*.stories.{ts,tsx}',
      'src/ui-kit/**/*.test.{ts,tsx}',
      'src/ui-kit/stories/**',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      boundaries,
    },
    settings: {
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'ui-tokens', pattern: 'src/ui-kit/tokens/**' },
        { type: 'ui-utils', pattern: 'src/ui-kit/utils/**' },
        { type: 'ui-hooks', pattern: 'src/ui-kit/hooks/**' },
        { type: 'ui-atoms', pattern: 'src/ui-kit/atoms/**' },
        { type: 'ui-molecules', pattern: 'src/ui-kit/molecules/**' },
        { type: 'ui-organisms', pattern: 'src/ui-kit/organisms/**' },
        { type: 'ui-templates', pattern: 'src/ui-kit/templates/**' },
        { type: 'ui-entry', pattern: 'src/ui-kit', partialMatch: false },
        { type: 'legacy', pattern: 'src/{components,pages,i18n,utils}/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'ui-tokens' } },
              allow: allowTargets(['ui-tokens']),
            },
            {
              from: { element: { type: 'ui-utils' } },
              allow: allowTargets(['ui-tokens', 'ui-utils']),
            },
            {
              from: { element: { type: 'ui-hooks' } },
              allow: allowTargets(['ui-tokens', 'ui-utils', 'ui-hooks']),
            },
            {
              from: { element: { type: 'ui-atoms' } },
              allow: allowTargets(['ui-tokens', 'ui-utils', 'ui-hooks', 'ui-atoms']),
            },
            {
              from: { element: { type: 'ui-molecules' } },
              allow: allowTargets([
                'ui-tokens',
                'ui-utils',
                'ui-hooks',
                'ui-atoms',
                'ui-molecules',
              ]),
            },
            {
              from: { element: { type: 'ui-organisms' } },
              allow: allowTargets([
                'ui-tokens',
                'ui-utils',
                'ui-hooks',
                'ui-atoms',
                'ui-molecules',
                'ui-organisms',
              ]),
            },
            {
              from: { element: { type: 'ui-templates' } },
              allow: allowTargets([
                'ui-tokens',
                'ui-utils',
                'ui-hooks',
                'ui-atoms',
                'ui-molecules',
                'ui-organisms',
                'ui-templates',
              ]),
            },
            {
              from: { element: { type: 'ui-entry' } },
              allow: allowTargets([
                'ui-tokens',
                'ui-utils',
                'ui-hooks',
                'ui-atoms',
                'ui-molecules',
                'ui-organisms',
                'ui-templates',
              ]),
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/components/**', '**/pages/**', '**/i18n/**'],
              message:
                'UI-kit must never import from legacy application code (strict one-way dependency: app -> ui-kit).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            'Inline styles (style={{...}}) are forbidden in ui-kit. Use CSS Modules and --ui-* design tokens instead.',
        },
      ],
    },
  },
  {
    files: [
      'src/ui-kit/**/*.stories.{ts,tsx}',
      'src/ui-kit/**/*.test.{ts,tsx}',
      'src/ui-kit/stories/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/components/**', '**/pages/**', '**/i18n/**'],
              message:
                'UI-kit stories and tests must never import from legacy application code.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            'Inline styles (style={{...}}) are forbidden in ui-kit. Use CSS Modules and --ui-* design tokens instead.',
        },
      ],
    },
  },
];
