import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['**/node_modules/**', '**/tests/integration/**'],
    coverage: {
      provider: 'v8',
      include: ['js/**/*.js'],
      reporter: ['text', 'json', 'html'],
    },
  },
})
