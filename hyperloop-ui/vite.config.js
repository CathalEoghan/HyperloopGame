import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'Managers': new URL('../Managers', import.meta.url).pathname,
      'CityManager': new URL('../CityManager', import.meta.url).pathname,
      'DevelopmentManager': new URL('../DevelopmentManager', import.meta.url).pathname,
      'UpgradeManager': new URL('../UpgradeManager', import.meta.url).pathname,
    }
  }
})