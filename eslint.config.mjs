import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';
import noHexInJsx from './eslint-rules/no-hex-in-jsx.js';

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.turbo/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { prettier: prettierPlugin },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/backend/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    plugins: { react: reactPlugin, 'react-hooks': reactHooksPlugin },
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['packages/shared/**/*.ts'],
    languageOptions: { globals: {} },
  },
  {
    files: ['scripts/**/*.{js,mjs,cjs,ts}', '**/*.config.{js,mjs,cjs,ts}', '**/*.cjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['apps/frontend/src/**/*.{ts,tsx}'],
    plugins: {
      'zonite-local': {
        rules: {
          'no-hex-in-jsx': noHexInJsx,
        },
      },
    },
    rules: {
      'zonite-local/no-hex-in-jsx': 'error',
    },
  },
  {
    files: ['apps/frontend/server.js'],
    languageOptions: { globals: { ...globals.node } },
  },
);
