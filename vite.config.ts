import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load local .env files as well as environment variables provided by deployment.
  const env = loadEnv(mode, process.cwd(), '');
  const apiKey = env.API_KEY || env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.VITE_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    // Trên Vercel, base thường là '/'
    base: '/AI-ENGLISH-DV/',
    define: {
      // Existing Gemini features and audio transcription share the same configured key.
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            genai: ['@google/genai']
          }
        }
      }
    },
    server: {
      port: 3000,
      strictPort: true,
    }
  };
});
