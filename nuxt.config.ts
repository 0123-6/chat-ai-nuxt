// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import compression, {defineAlgorithm} from "vite-plugin-compression2";
import zlib from 'node:zlib'
import {projectConfig} from "~~/project.config.ts";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // 新增：设置 Nuxt 开发服务端口为 4003（核心配置）
  devServer: {
    port: 4003,
  },
  vite: {
    plugins: [
      tailwindcss(),
      // 压缩插件
      compression({
        algorithms: [
          defineAlgorithm(
            'brotliCompress',
            {
              params: {
                [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
              },
            },
          ),
        ],
        // 压缩后的文件名称
        filename: '[path][base].br',
      }),
    ],
    server: {
      proxy: {
        '/api': {
          // 实际应为线上后端地址,因为模板项目我自己实现后端,所以指向本地地址
          target: 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (str: string) => str.replace(/^\/api/, ''),
        },
      },
    },
  },
  css: [
    './app/assets/css/index.css',
    'highlight.js/styles/github-dark.css',
  ],
  sourcemap: {
    client: false,
    server: false,
  },
  app: {
    baseURL: projectConfig.baseUrl,
    head: {
      title: 'nuxt模仿豆包网站',
      htmlAttrs: {
        lang: 'zh-CN',
      },
    },
  },
  modules: ['@element-plus/nuxt'],
  typescript: {
    tsConfig: {
      compilerOptions: {
        allowImportingTsExtensions: true,
        strictNullChecks: false,
        strictBindCallApply: false,
      },
    },
  },
})
