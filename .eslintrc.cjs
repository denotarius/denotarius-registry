module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: { 
    project: './tsconfig.json', 
    sourceType: 'module' },
  plugins: ['@typescript-eslint', 'prettier', 'promise'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'prettier',
  ],
  rules: {
    'no-console': 'off',
    'import/no-unresolved': 'off',
    'arrow-parens': [2, 'as-needed'],
    'prettier/prettier': 2,
    '@typescript-eslint/no-floating-promises': ['error'],
    'prefer-destructuring': ['error', { object: true, array: false }],
    'import/extensions': ['error', 'always'],
  },
};