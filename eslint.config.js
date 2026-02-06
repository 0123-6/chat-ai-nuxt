import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import {defineConfig} from 'eslint/config'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    plugins: {
      js,
    },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // 👈 强制缩进为2个空格
      indent: ['error', 2],
      // 禁止混用 space 和 tab
      'no-mixed-spaces-and-tabs': 'error',
      // 禁止使用 tab
      'no-tabs': 'error',
      // 👇 强制使用单引号
      quotes: ['error', 'single'],
      // 👇 禁止使用分号
      semi: ['error', 'never'],
      // 👇 对象/数组最后一个元素允许逗号（便于多行编辑）
      'comma-dangle': ['error', 'always-multiline'],

      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
])
