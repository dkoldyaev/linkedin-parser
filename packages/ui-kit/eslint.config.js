import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import boundaries from 'eslint-plugin-boundaries';

const allowTargets = (types) =>
  types.map((type) => ({ to: { element: { type } } }));

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/*.stories.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'src/stories/**',
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
        { type: 'ui-tokens', pattern: 'src/tokens/**' },
        { type: 'ui-utils', pattern: 'src/utils/**' },
        { type: 'ui-hooks', pattern: 'src/hooks/**' },
        { type: 'ui-atoms', pattern: 'src/atoms/**' },
        { type: 'ui-molecules', pattern: 'src/molecules/**' },
        { type: 'ui-organisms', pattern: 'src/organisms/**' },
        { type: 'ui-layouts', pattern: 'src/layouts/**' },
        { type: 'ui-entry', pattern: 'src', partialMatch: false },
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
              from: { element: { type: 'ui-layouts' } },
              allow: allowTargets([
                'ui-tokens',
                'ui-utils',
                'ui-hooks',
                'ui-atoms',
                'ui-molecules',
                'ui-organisms',
                'ui-layouts',
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
                'ui-layouts',
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
              group: ['**/frontend/**', '**/components/**', '**/pages/**', '**/i18n/**'],
              message:
                'UI-kit must be 100% independent and never import from host application code.',
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
      'src/**/*.stories.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'src/stories/**/*.{ts,tsx}',
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
              group: ['**/frontend/**', '**/components/**', '**/pages/**', '**/i18n/**'],
              message:
                'UI-kit stories and tests must never import from host application code.',
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
