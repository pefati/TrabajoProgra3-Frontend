import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        host: '0.0.0.0',
        allowedHosts: ['aerogest.ddns.net']
    },
    preview: {
        host: '0.0.0.0',
        allowedHosts: ['aerogest.ddns.net']
    }
})