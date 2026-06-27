import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'Managers': fileURLToPath(new URL('../Managers', import.meta.url)),
      'CityManager': fileURLToPath(new URL('../CityManager', import.meta.url)),
      'DevelopmentManager': fileURLToPath(new URL('../DevelopmentManager', import.meta.url)),
      'UpgradeManager': fileURLToPath(new URL('../UpgradeManager', import.meta.url)),
    }
  }
})