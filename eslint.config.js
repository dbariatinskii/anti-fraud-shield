import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'bin/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
