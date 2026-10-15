// ESLint settings: catches undefined variables, unused code and common mistakes.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['vendor/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.browser },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // boot.js is a plain script so it can run on browsers too old for modules
    files: ['js/boot.js'],
    languageOptions: { ecmaVersion: 5, sourceType: 'script' },
  },
  {
    files: ['tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: globals.node },
  },
];
