// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  // why esmのエラーが出るため遅延ロードを行う
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default
  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: '../../vitest-setup.tsx',
      autoResetMocks: true,
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
