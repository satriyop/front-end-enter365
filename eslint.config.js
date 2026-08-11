import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'

/**
 * Minimal ESLint flat config.
 *
 * Purpose: enforce project-specific guardrails (e.g. timezone-safe dates).
 * NOT adding opinionated formatting rules — Prettier/IDE handles that.
 */
export default [
  // Vue plugin base config — enables vue-eslint-parser for .vue files
  ...pluginVue.configs['flat/base'],

  // TypeScript parser for .ts files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
    },
  },

  // TypeScript sub-parser for <script lang="ts"> in .vue files
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },

  // Ban timezone-unsafe date pattern across all source files
  {
    files: ['src/**/*.ts', 'src/**/*.vue'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.property.name='split'][callee.object.callee.property.name='toISOString']",
          message:
            'Use toLocalISODate() from @/utils/format instead of toISOString().split("T")[0]. ' +
            'toISOString() converts to UTC first, causing off-by-one date bugs in UTC+7.',
        },
      ],
    },
  },
]
