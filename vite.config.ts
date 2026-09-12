import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // §29.1 RENDERING_REQUIREMENTS's code_splitting_at_route_and_component_level.
    // The build's own warning flagged one 769KB bundle; splitting vendor code
    // from app code so the vendor chunk (which changes far less often) caches
    // independently across deploys, rather than a route-by-route React.lazy
    // conversion across ~150 screens, which risks far more for a build this
    // size still iterating on route registration itself.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          'framer-motion': ['framer-motion'],
        },
      },
    },
  },
})
