import { defineConfig } from 'vite'
import { resolve } from 'path'

const htmlFiles = [
    'index.html', 'login.html', 'signin.html', 'vuelos.html',
    'asientos.html', 'carrito.html', 'pago.html', 'reservas.html',
    'facturas.html', 'favoritos.html', 'perfil.html', 'verify.html',
    'admin.html', 'admin-vuelos.html', 'admin-aeropuertos.html',
    'admin-aviones.html', 'admin-usuarios.html'
].map(f => resolve(__dirname, f))

export default defineConfig({
    server: {
        host: '0.0.0.0',
        allowedHosts: ['aerogest.ddns.net']
    },
    preview: {
        host: '0.0.0.0',
        allowedHosts: ['aerogest.ddns.net']
    },
    build: {
        rollupOptions: {
            input: htmlFiles
        }
    }
})