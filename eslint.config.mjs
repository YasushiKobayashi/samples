import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import importAccessPlugin from 'eslint-plugin-import-access/flat-config'
import testingLibraryPlugin from 'eslint-plugin-testing-library'
import storybookPlugin from 'eslint-plugin-storybook'
import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

const isLightMode = process.env.ESLINT_LIGHT_MODE === 'true'
console.log(`ESLint running in ${isLightMode ? 'LIGHT' : 'FULL'} mode`)

const baseConfig = [
  js.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/.cache/**',
      '**/public/**',
      '**/storybook-static/**',
      '**/vendor/**',
      'docker/**',
      '**/*.config.{js,ts,mjs,mts}',
      '**/vitest-setup.tsx',
      'vitest-setup.ts',
      'src/**/*.spec.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      '**/.hygen/**',
      '**/.hygen.js',
      '**/.storybook/**',
    ],
  },
]

// -------- Light mode --------
const lightModeConfig = [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { project: false, ecmaFeatures: { jsx: true } },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/ban-ts-comment': 1,
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: "Don't declare enums" },
      ],
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: { react: reactPlugin, 'react-hooks': reactHooksPlugin },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/jsx-key': 2,
      'react/react-in-jsx-scope': 0,
      'react/prop-types': 0,
      'react-hooks/rules-of-hooks': 2,
      'react-hooks/exhaustive-deps': 1,
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      semi: ['error', 'never'],
      'no-console': 0,
      'no-unused-vars': 0,
      'no-undef': 0,
      'prefer-const': 1,
      'no-redeclare': 1,
    },
  },
  prettierConfig,
]

// -------- Full mode --------
const fullModeConfig = [
  ...baseConfig,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['./tsconfig.json', './src/*/tsconfig.json'],
        },
        node: true,
      },
      react: { version: 'detect' },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      import: importPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'import-access': importAccessPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/ban-ts-comment': 1,
      '@typescript-eslint/no-var-requires': 1,
      '@typescript-eslint/no-empty-interface': 0,
      '@typescript-eslint/no-empty-object-type': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/no-non-null-assertion': 0,
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/explicit-function-return-type': 1,
      '@typescript-eslint/member-delimiter-style': [
        'error',
        {
          multiline: {
            delimiter: 'none',
            requireLast: false,
          },
          singleline: {
            delimiter: 'comma',
            requireLast: false,
          },
        },
      ],

      // use-before-define
      'no-use-before-define': 0,
      '@typescript-eslint/no-use-before-define': 1,

      // Import rules
      'import/no-unresolved': 2,
      'import/named': 2,
      'import/default': 2,
      'import/namespace': 2,
      'import/no-duplicates': 2,
      'import/no-cycle': 1,
      'import/no-self-import': 2,
      'import/no-named-as-default': 0,
      'import/no-named-as-default-member': 0,
      'import/extensions': 0,
      'import/no-extraneous-dependencies': 0,
      'import/prefer-default-export': 0,
      'import/first': 2,
      'import/newline-after-import': 2,

      // Simple import sort
      'simple-import-sort/exports': 2,
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react', '^@?\\w'],
            ['^\\u0000'],
            ['^(@pocket-sommelier/*)(/.*|$)'],
            ['^(@/*)(/.*|$)'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.s?css$'],
          ],
        },
      ],

      // Import access
      'import-access/jsdoc': 2,

      // General JavaScript rules
      semi: 0,
      'object-shorthand': 0,
      'no-shadow': 0,
      'class-methods-use-this': 0,
      'no-console': 0,
      'no-unresolved': 0,
      'no-else-return': 0,
      'arrow-body-style': 0,
      'no-new': 0,
      'no-param-reassign': 0,
      'consistent-return': 0,
      'no-return-assign': 0,
      'no-nested-ternary': 0,
      'arrow-parens': 0,
      'global-require': 1,
      'object-curly-newline': 0,
      'function-paren-newline': 0,
      'no-await-in-loop': 1,
      'no-undef': 0,
      'no-unused-vars': 0,
      'no-redeclare': 1,
      'operator-linebreak': 1,
      'lines-between-class-members': 0,
      'prefer-spread': 2,
      camelcase: 1,
      'no-underscore-dangle': 1,
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      // React rules
      'react/no-danger': 0,
      'react/no-string-refs': 0,
      'react/prefer-stateless-function': 0,
      'react/jsx-wrap-multilines': 0,
      'react/sort-comp': 0,
      'react/jsx-closing-bracket-location': 1,
      'react/jsx-filename-extension': 0,
      'react/prop-types': 0,
      'react/button-has-type': 1,
      'react/jsx-props-no-spreading': 0,
      'react/function-component-definition': 0,
      'react/jsx-no-useless-fragment': 1,
      'react/require-default-props': 0,
      'react/react-in-jsx-scope': 0,
      'react/jsx-uses-vars': 2,
      'react/jsx-key': 2,
      'react/jsx-pascal-case': 2,
      'react/no-unknown-property': 2,
      'react/self-closing-comp': 2,

      // React Hooks
      'react-hooks/rules-of-hooks': 2,
      'react-hooks/exhaustive-deps': 1,

      // JSX A11y
      'jsx-a11y/no-static-element-interactions': 0,
      'jsx-a11y/img-redundant-alt': 1,
      'jsx-a11y/anchor-is-valid': 1,
      'jsx-a11y/click-events-have-key-events': 1,
      'jsx-a11y/no-noninteractive-element-interactions': 1,
      'jsx-a11y/label-has-for': 0,
      'jsx-a11y/anchor-has-content': 0,
      'jsx-a11y/alt-text': 1,
    },
  },
  {
    files: ['**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
    plugins: { 'testing-library': testingLibraryPlugin },
    rules: {
      'testing-library/await-async-events': 2,
      'testing-library/await-async-queries': 2,
      'testing-library/await-async-utils': 2,
      'testing-library/no-await-sync-events': 2,
      'testing-library/no-await-sync-queries': 2,
    },
  },
  {
    files: ['**/*.story.{ts,tsx}', '**/*.stories.{ts,tsx}'],
    plugins: { storybook: storybookPlugin },
    rules: { 'storybook/default-exports': 2 },
  },
  {
    plugins: { prettier: prettierPlugin },
    rules: {
      'prettier/prettier': [
        'error',
        {
          printWidth: 120,
          singleQuote: true,
          semi: false,
          arrowParens: 'avoid',
        },
      ],
    },
  },
  prettierConfig,
]

export default isLightMode ? lightModeConfig : fullModeConfig