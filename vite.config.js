import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build trigger update: Secrets configured
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
});

