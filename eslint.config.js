import eslint from '@eslint/js';
import pluginSecurity from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';
import liteslint from 'eslint-plugin-lit';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

const securityRulesAsErrors = Object.fromEntries(
  Object.entries(pluginSecurity.configs.recommended.rules).map(([rule]) => [
    rule,
    'error',
  ])
);

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,
  jsdoc.configs['flat/recommended-error'],
  eslintPluginPrettierRecommended,
  liteslint.configs['flat/recommended'],
  pluginSecurity.configs.recommended,
  {
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        ...globals.browser,
      },
    },
    plugins: { jsdoc },
    rules: {
      ...securityRulesAsErrors,
      // Prettier
      'prettier/prettier': 'error',
      // Typescript
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      // Lit
      'lit/no-legacy-template-syntax': 'error',
      'lit/no-template-arrow': 'off',
      // JSDoc
      'jsdoc/require-description': 'off',
      'jsdoc/require-property-description': 'off',
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-returns-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-param-type': 'off',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.config.ts'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'jsdoc/require-jsdoc': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];
