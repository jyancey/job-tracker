import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createJobStore } from './sqliteStore.js'
import { handleJobsApi } from './jobsApi.js'

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
  },
})
