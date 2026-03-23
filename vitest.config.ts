// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'scripts/lib/__tests__/**/*.test.ts',
      'src/**/__tests__/**/*.test.ts',
      'src/**/*.test.ts',
    ],
    globals: true,
  },
})
