// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import compression, {defineAlgorithm} from "vite-plugin-compression2";
import zlib from 'node:zlib'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
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
  },
  css: [
    './app/assets/css/index.css',
  ],
  sourcemap: {
    client: false,
    server: false,
  },
  app: {
    baseURL: '/nuxt/',
  },
})
