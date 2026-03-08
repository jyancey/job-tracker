import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createJobStore } from './backend/sqliteStore.js'
import { handleJobsApi } from './backend/jobsApi.js'

const jobStore = createJobStore()

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'job-tracker-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          void handleJobsApi(req, res, jobStore)
            .then((handled: boolean) => {
              if (handled) {
                return
              }

              next()
            })
            .catch((error: unknown) => {
              server.config.logger.error(`[job-tracker-api] ${String(error)}`)
              if (!res.headersSent) {
                res.statusCode = 500
                res.end('Internal Server Error')
              }
            })
        })
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/version.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
    },
  },
})
