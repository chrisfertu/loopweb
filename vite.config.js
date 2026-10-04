import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import seo from './vite-plugin-seo.js'

export default defineConfig(({ mode }) => {
  // VITE_APP_103_LIVE comes from .env.[mode] or the shell (the shell wins).
  // 'true' ships the iOS 1.0.3 copy (free model, tip, Watch-first sessions).
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const live = env.VITE_APP_103_LIVE === 'true'

  // VITE_BASE serves the site from a path instead of the root of its domain
  // (a preview at /v2/, say). Such a build asks not to be indexed.
  const base = env.VITE_BASE || '/'

  return {
    plugins: [react(), seo({ live, noindex: base !== '/' })],
    base,
  }
})
