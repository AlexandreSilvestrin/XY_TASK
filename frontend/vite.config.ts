import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_PROXY_TARGET =
  process.env.VITE_API_PROXY_TARGET ??
  'http://127.0.0.1:5000'

const apiRoutes = [
  '/version',
  '/select',
  '/pesquisar_cnpj',
  '/exportar_banco',
  '/importar_banco',
  '/adicionar_porcentagem',
  '/pesquisar_guia_porcentagem',
  '/salvar_guia_porcentagem',
  '/geral_notas',
  '/gerar_faturamento',
  '/geral_prn',
  '/transformar_razao',
  '/transformar_dimob',
  '/transformar_provisoes',
  '/buscar_codigos_consorcio',
  '/salvar_codigos_consorcio',
  '/iniciar_pesquisa_cnpj',
  '/parar_pesquisa_cnpj',
  '/salvar_cnpj',
  '/buscar_banco_cnpj',
  '/salvar_banco_cnpj',
]

export default defineConfig({
  base: './',

  plugins: [
    react(),
    tailwindcss()
  ],

  server: {
    host: true,
    allowedHosts: [
      'nathaniel-unemployable-unmeanderingly.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
    ],
    proxy: {
      ...Object.fromEntries(
        apiRoutes.map((route) => [
          route,
          {
            target: API_PROXY_TARGET,
            changeOrigin: true,
            ...(API_PROXY_TARGET.includes('ngrok')
              ? { headers: { 'ngrok-skip-browser-warning': '1' } }
              : {}),
          },
        ]),
      ),

      '/socket.io': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
        ...(API_PROXY_TARGET.includes('ngrok')
          ? { headers: { 'ngrok-skip-browser-warning': '1' } }
          : {}),
      },
    },
  },
})