import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/widget.ts'),
      name: 'CallNestWidget',
      fileName: 'widget',
      formats: ['iife', 'es']
    },
    rollupOptions: {
      external: ['socket.io-client'],
      output: {
        globals: {
          'socket.io-client': 'io'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})
