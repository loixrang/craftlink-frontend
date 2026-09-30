import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

const siteOrigin = normalizeOrigin(process.env.VITE_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'https://craftlink.loixrang.com/')

export default defineConfig({
  define: { __SITE_ORIGIN__: JSON.stringify(siteOrigin) },
  plugins: [react(), tailwindcss(), {
    name: 'craftlink-html-canonical',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace('</head>', `    <link rel="canonical" href="${siteOrigin}/" />\n    <meta property="og:url" content="${siteOrigin}/" />\n  </head>`)
      },
    },
  }],
  build: {
    rollupOptions: {
      plugins: [{
        name: 'craftlink-search-files',
        generateBundle() {
          const pages = ['/', '/artisans']
          const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(path => `  <url><loc>${siteOrigin}${path}</loc></url>`).join('\n')}\n</urlset>\n`
          const robots = `User-agent: *\nAllow: /\nSitemap: ${siteOrigin}/sitemap.xml\n`
          this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap })
          this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
        },
      }],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
  },
})

function normalizeOrigin(value: string) {
  const url = new URL(value.startsWith('http') ? value : `https://${value}`)
  if (url.protocol !== 'https:') throw new Error('VITE_SITE_URL must use HTTPS.')
  return url.origin
}
