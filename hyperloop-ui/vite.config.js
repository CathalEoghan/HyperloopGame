import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  // Keep small images (all 300 profile pictures) as files instead of text inside the script (bug #134)
  build: { assetsInlineLimit: 0 },
  resolve: {
    alias: {
      'Managers': fileURLToPath(new URL('../Managers', import.meta.url)),
      'CityManager': fileURLToPath(new URL('../CityManager', import.meta.url)),
      'DevelopmentManager': fileURLToPath(new URL('../DevelopmentManager', import.meta.url)),
      'UpgradeManager': fileURLToPath(new URL('../UpgradeManager', import.meta.url)),
    }
  }
})