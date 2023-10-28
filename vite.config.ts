import { defineConfig } from 'vite'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
    manifest_version: 3,
    name: 'Web site access ranking checker',
    description: 'check the ranking of website.',
    version: '0.0.1',
    icons: {
        '16': 'images/icon16.png',
        // '32': 'images/icon-32.png',
        // '48': 'images/icon-48.png',
        // '128': 'images/icon-128.png',
    },
    content_scripts: [
        {
            js: ['src/content.ts'],
            matches: [
                "<all_urls>"
            ]
        }
    ],
})

export default defineConfig({
    plugins: [crx({ manifest })],
})