import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      strictPort: false,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Built-in local loopback proxies: eliminates CORS blocks & Windows IPv6 (::1) issues
      // when talking to Ollama, LM Studio, or vLLM from http://localhost:3000
      proxy: {
        '/ollama-proxy': {
          target: 'http://127.0.0.1:11434',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/ollama-proxy/, ''),
        },
        '/lmstudio-proxy': {
          target: 'http://127.0.0.1:1234',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/lmstudio-proxy/, ''),
        },
        '/vllm-proxy': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/vllm-proxy/, ''),
        },
      },
    },
  };
});
